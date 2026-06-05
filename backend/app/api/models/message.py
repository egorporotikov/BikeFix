from datetime import datetime
from pydantic import BaseModel


class MessageModel(BaseModel):
    id: int
    request_id: int
    sender_id: int
    recipient_id: int
    content: str
    created_at: datetime
