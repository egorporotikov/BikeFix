from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: str
    recipient_profile_id: str
    sender_profile_id: Optional[str] = None
    type: str
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    is_read: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
