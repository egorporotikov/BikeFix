from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RepairRequestModel(BaseModel):
    id: str
    requester_profile_id: str
    mechanic_profile_id: Optional[str] = None
    title: str
    description: str
    address: str
    category: str
    image_url: Optional[str] = None
    status: str = "pending"
    created_at: datetime
    updated_at: datetime
