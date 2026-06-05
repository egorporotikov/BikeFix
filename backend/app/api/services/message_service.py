from datetime import datetime
from typing import List

from app.api.schemas.message import MessageCreate, MessageRead
from app.utils.supabase_client import fetch_rows, insert_row


class MessageService:
    TABLE_NAME = "messages"

    @classmethod
    def _ensure_request_exists(cls, request_id: int) -> None:
        from app.api.services.repair_request_service import RepairRequestService

        RepairRequestService.get_repair_request(request_id)

    @classmethod
    def create_message(cls, payload: MessageCreate) -> MessageRead:
        if payload.sender_id == payload.recipient_id:
            raise ValueError("Sender and recipient must be different")
        if not payload.content.strip():
            raise ValueError("Message content cannot be empty")

        cls._ensure_request_exists(payload.request_id)

        timestamp = datetime.utcnow().isoformat()
        record = insert_row(
            cls.TABLE_NAME,
            {
                **payload.dict(),
                "created_at": timestamp,
            },
        )
        return MessageRead(**record)

    @classmethod
    def list_messages_for_request(cls, request_id: int) -> List[MessageRead]:
        cls._ensure_request_exists(request_id)
        rows = fetch_rows(cls.TABLE_NAME, {"request_id": request_id})
        return [MessageRead(**row) for row in rows]
