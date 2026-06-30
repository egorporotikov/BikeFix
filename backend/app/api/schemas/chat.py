from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class ChatCreate(BaseModel):
    request_id: str
    mechanic_profile_id: Optional[str] = None


class ChatRead(BaseModel):
    id: str
    repair_request_id: str
    requester_profile_id: Optional[str]
    mechanic_profile_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)


class ChatMessageRead(BaseModel):
    id: str
    chat_id: str
    sender_profile_id: str
    sender_role: str
    content: str
    created_at: datetime

    class Config:
        orm_mode = True
