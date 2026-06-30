from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    request_id: str
    text: str = Field(..., min_length=1)


class MessageRead(BaseModel):
    id: str
    chat_id: str
    sender_profile_id: str
    sender_role: str
    sender_name: Optional[str] = None
    is_verified: Optional[bool] = None
    content: str
    created_at: datetime

    class Config:
        orm_mode = True
