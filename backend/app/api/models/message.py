from datetime import datetime
from pydantic import BaseModel


class MessageModel(BaseModel):
    id: str
    request_id: str
    sender_profile_id: str
    sender_role: str
    content: str
    created_at: datetime
