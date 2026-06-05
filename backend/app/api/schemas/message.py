from datetime import datetime
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    request_id: int
    sender_id: int
    recipient_id: int
    content: str = Field(..., min_length=1)


class MessageRead(MessageCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
