from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OfferCreate(BaseModel):
    price: float = Field(..., gt=0)
    message: str = Field(..., min_length=1)


class OfferRead(BaseModel):
    id: str
    repair_request_id: str
    mechanic_profile_id: str
    mechanic_name: Optional[str] = None
    mechanic_profile_image_url: Optional[str] = None
    mechanic_is_verified: bool = False
    price: float
    description: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
