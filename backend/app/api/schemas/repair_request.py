from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class RepairRequestBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=5, max_length=1000)
    address: str = Field(..., min_length=3, max_length=500)
    category: str = Field(..., description="Category: flat tire, brake issue, chain problem, other")
    image_url: Optional[str] = None
    status: str = Field(default="pending")


class RepairRequestCreate(RepairRequestBase):
    pass


class RepairRequestRead(BaseModel):
    id: str
    requester_profile_id: str
    requester_name: Optional[str] = None
    title: str
    description: str
    address: str
    category: str
    image_url: Optional[str]
    status: str
    mechanic_profile_id: Optional[str]
    mechanic_name: Optional[str] = None
    mechanic_profile_image_url: Optional[str] = None
    mechanic_is_verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
