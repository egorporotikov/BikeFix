from datetime import datetime
from typing import Any, Dict, List, Optional

from app.api.services.mechanic_context import get_mechanic_context
from app.api.services.repair_request_service import RepairRequestService
from app.utils.supabase_client import insert_row, fetch_rows, get_row_by_id


class ChatService:
    CHATS_TABLE = "chats"
    MESSAGES_TABLE = "messages"

    @classmethod
    def create_chat(cls, request_id: str, authenticated_user_id: str, mechanic_profile_id: Optional[str]) -> Dict[str, Any]:
        # Ensure caller is a customer and get requester profile id
        user_prof = fetch_rows("profiles", {"auth_id": authenticated_user_id})
        if not user_prof or user_prof[0].get("role") != "user":
            raise PermissionError("Only users can create chats as the requester")

        requester_profile_id = user_prof[0].get("id")

        if mechanic_profile_id:
            mech_prof = fetch_rows("profiles", {"id": mechanic_profile_id})
            if not mech_prof or mech_prof[0].get("role") != "mechanic":
                raise PermissionError("Provided mechanic_profile_id is not a mechanic")

        payload = {
            "repair_request_id": request_id,
            "requester_profile_id": requester_profile_id,
            "mechanic_profile_id": mechanic_profile_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        return insert_row(cls.CHATS_TABLE, payload)

    @classmethod
    def get_chat_by_request_id(cls, request_id: str) -> Optional[Dict[str, Any]]:
        rows = fetch_rows(cls.CHATS_TABLE, {"repair_request_id": request_id})
        return rows[0] if rows else None

    @classmethod
    def get_or_create_chat(cls, request_id: str, authenticated_user_id: str, mechanic_profile_id: Optional[str] = None) -> Dict[str, Any]:
        existing_chat = cls.get_chat_by_request_id(request_id)
        if existing_chat:
            return existing_chat

        request = RepairRequestService.get_repair_request(request_id)
        if mechanic_profile_id is None:
            mechanic_profile_id = request.mechanic_profile_id

        if mechanic_profile_id is None:
            raise ValueError("Cannot create chat until a mechanic has been selected")

        return cls.create_chat(request_id=request_id, authenticated_user_id=authenticated_user_id, mechanic_profile_id=mechanic_profile_id)

    @classmethod
    def _assert_chat_participant(cls, chat_id: str, authenticated_user_id: str) -> Dict[str, Any]:
        chat = get_row_by_id(cls.CHATS_TABLE, chat_id)
        if not chat:
            raise LookupError("Chat not found")

        prof = fetch_rows("profiles", {"auth_id": authenticated_user_id})
        if not prof:
            raise PermissionError("User is not a recognized profile")

        profile_id = prof[0].get("id")
        if profile_id not in {chat.get("requester_profile_id"), chat.get("mechanic_profile_id")}:
            raise PermissionError("User is not a participant in this chat")

        role = prof[0].get("role")
        if profile_id == chat.get("requester_profile_id") and role != "user":
            raise PermissionError("Requester participant does not have 'user' role")
        if profile_id == chat.get("mechanic_profile_id") and role != "mechanic":
            raise PermissionError("Mechanic participant does not have 'mechanic' role")

        return chat

    @classmethod
    def send_message(cls, chat_id: str, sender_auth_id: str, content: str) -> Dict[str, Any]:
        if not content or not content.strip():
            raise ValueError("Content must not be empty")

        chat = cls._assert_chat_participant(chat_id, sender_auth_id)
        prof = fetch_rows("profiles", {"auth_id": sender_auth_id})
        sender_profile_id = prof[0].get("id") if prof else None
        if not sender_profile_id:
            raise PermissionError("Cannot resolve sender profile")

        role = prof[0].get("role") if prof and prof[0].get("role") else "user"

        payload = {
            "chat_id": chat_id,
            "sender_profile_id": sender_profile_id,
            "sender_role": role,
            "content": content,
            "created_at": datetime.utcnow().isoformat(),
        }
        message = insert_row(cls.MESSAGES_TABLE, payload)
        
        # Enrich with sender details
        sender_details = cls._get_sender_details(sender_profile_id)
        message.update(sender_details)
        
        return message

    @classmethod
    def _get_sender_details(cls, sender_profile_id: str) -> dict:
        """Fetch sender name and verification status."""
        try:
            rows = fetch_rows("profiles", {"id": sender_profile_id})
            if not rows:
                return {}
            profile = rows[0]
            if profile.get("role") == "mechanic":
                mechanic_context = get_mechanic_context(sender_profile_id)
                return {
                    "sender_name": mechanic_context.get("mechanic_name") or profile.get("username") or profile.get("email"),
                    "is_verified": mechanic_context.get("mechanic_is_verified", False),
                }
            return {
                "sender_name": profile.get("username") or profile.get("email"),
                "is_verified": profile.get("is_verified"),
            }
        except Exception:
            return {}

    @classmethod
    def _enrich_messages(cls, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enrich message records with sender details."""
        enriched = []
        for msg in messages:
            sender_details = cls._get_sender_details(msg.get("sender_profile_id"))
            enriched.append({**msg, **sender_details})
        return enriched

    @classmethod
    def fetch_messages(cls, chat_id: str, authenticated_user_id: str) -> List[Dict[str, Any]]:
        cls._assert_chat_participant(chat_id, authenticated_user_id)

        rows = fetch_rows(cls.MESSAGES_TABLE, {"chat_id": chat_id})
        rows.sort(key=lambda r: r.get("created_at") or "")
        enriched = cls._enrich_messages(rows)
        return enriched

    @classmethod
    def get_chat(cls, chat_id: str) -> Optional[Dict[str, Any]]:
        return get_row_by_id(cls.CHATS_TABLE, chat_id)

    @classmethod
    def subscribe_to_messages(cls, chat_id: str):
        raise NotImplementedError("Server-side realtime subscription is not implemented. Use Supabase JS on the client.")
