from datetime import datetime
from typing import List

from app.api.schemas.message import MessageCreate, MessageRead
from app.api.services.notification_service import NotificationService
from app.utils.supabase_client import fetch_rows, insert_row


class MessageService:
    TABLE_NAME = "messages"

    @classmethod
    def _get_chat(cls, chat_id: str):
        from app.api.services.chat_service import ChatService
        return ChatService.get_chat(chat_id)

    @classmethod
    def create_message(cls, payload: MessageCreate, sender_auth_id: str) -> MessageRead:
        if not payload.text.strip():
            raise ValueError("Message text cannot be empty")

        # 1. Получаем чат
        chat = cls._get_chat(payload.request_id)  # request_id = chat_id в твоём фронтенде

        # 2. Получаем профиль отправителя
        sender_profile = fetch_rows("profiles", {"auth_id": sender_auth_id})
        if not sender_profile:
            raise PermissionError("Sender profile not found")

        sender_profile_id = sender_profile[0].get("id")
        sender_role = sender_profile[0].get("role")

        # 3. Определяем получателя
        if sender_profile_id == chat["requester_profile_id"]:
            if sender_role != "user":
                raise PermissionError("Sender does not have 'user' role")
            recipient_profile_id = chat["mechanic_profile_id"]
        elif sender_profile_id == chat["mechanic_profile_id"]:
            if sender_role != "mechanic":
                raise PermissionError("Sender does not have 'mechanic' role")
            recipient_profile_id = chat["requester_profile_id"]
        else:
            raise PermissionError("Sender is not authorized for this chat")

        if recipient_profile_id is None:
            raise ValueError("Chat does not have an assigned recipient yet")

        # 4. Создаём сообщение
        timestamp = datetime.utcnow().isoformat()
        record = insert_row(
            cls.TABLE_NAME,
            {
                "chat_id": payload.request_id,  # ← ИСПРАВЛЕНО
                "sender_profile_id": sender_profile_id,
                "content": payload.text,
                "sender_role": sender_role,
                "created_at": timestamp,
            },
        )

        # 5. Создаём уведомление
        NotificationService.create_notification(
            recipient_profile_id=recipient_profile_id,
            sender_profile_id=sender_profile_id,
            type="chat_message",
            title="New message",
            body=f"New chat message in chat '{payload.request_id}'.",
            link=f"/chat/{payload.request_id}",
        )

        return MessageRead(**record)

    @classmethod
    def list_messages_for_request(cls, chat_id: str, caller_auth_id: str) -> List[MessageRead]:
        # 1. Получаем чат
        chat = cls._get_chat(chat_id)

        # 2. Проверяем, что вызывающий — участник
        caller_profile = fetch_rows("profiles", {"auth_id": caller_auth_id})
        if not caller_profile:
            raise PermissionError("Caller profile not found")

        caller_profile_id = caller_profile[0].get("id")
        if caller_profile_id not in {chat["requester_profile_id"], chat["mechanic_profile_id"]}:
            raise PermissionError("Caller is not a participant in this chat")

        # 3. Получаем сообщения
        rows = fetch_rows(cls.TABLE_NAME, {"chat_id": chat_id})
        rows.sort(key=lambda row: row.get("created_at") or "")
        return [MessageRead(**row) for row in rows]
