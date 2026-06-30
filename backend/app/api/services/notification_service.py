from datetime import datetime
from typing import Any, Dict, List, Optional

from app.api.schemas.notification import NotificationRead
from app.utils.supabase_client import fetch_rows, insert_row, update_row


class NotificationService:
    TABLE_NAME = "notifications"

    @classmethod
    def create_notification(
        cls,
        recipient_profile_id: str,
        type: str,
        title: str,
        body: Optional[str] = None,
        link: Optional[str] = None,
        sender_profile_id: Optional[str] = None,
    ) -> NotificationRead:
        if not recipient_profile_id:
            raise ValueError("Recipient profile id is required")
        if not type:
            raise ValueError("Notification type is required")
        if not title:
            raise ValueError("Notification title is required")

        timestamp = datetime.utcnow().isoformat()
        record = insert_row(
            cls.TABLE_NAME,
            {
                "recipient_profile_id": recipient_profile_id,
                "sender_profile_id": sender_profile_id,
                "type": type,
                "title": title,
                "body": body,
                "link": link,
                "is_read": False,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )

        return NotificationRead(**record)

    @classmethod
    def list_notifications(cls, recipient_profile_id: str) -> List[NotificationRead]:
        rows = fetch_rows(cls.TABLE_NAME, {"recipient_profile_id": recipient_profile_id})
        rows.sort(key=lambda row: row.get("created_at") or "", reverse=True)
        return [NotificationRead(**row) for row in rows]

    @classmethod
    def list_unread_count(cls, recipient_profile_id: str) -> int:
        rows = fetch_rows(
            cls.TABLE_NAME,
            {"recipient_profile_id": recipient_profile_id, "is_read": False},
        )
        return len(rows)

    @classmethod
    def mark_as_read(cls, notification_id: str, recipient_profile_id: str) -> NotificationRead:
        rows = fetch_rows(cls.TABLE_NAME, {"id": notification_id, "recipient_profile_id": recipient_profile_id})
        if not rows:
            raise LookupError("Notification not found")

        updated = update_row(cls.TABLE_NAME, notification_id, {"is_read": True, "updated_at": datetime.utcnow().isoformat()})
        return NotificationRead(**updated)
