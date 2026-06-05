from datetime import datetime
from pydantic import BaseModel, Field


class OfferBase(BaseModel):
    mechanic_id: int
    price: float = Field(..., gt=0)
    message: str = Field(..., min_length=1)


class OfferCreate(OfferBase):
    pass


class OfferRead(OfferBase):
    id: int
    request_id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True
