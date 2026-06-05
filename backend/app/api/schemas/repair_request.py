from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl


class RepairRequestBase(BaseModel):
    user_id: int | None = None
    photo_url: HttpUrl
    description: str = Field(..., min_length=5)
    location: str = Field(..., min_length=3)
    status: str = Field(default="open")


class RepairRequestCreate(RepairRequestBase):
    pass


class RepairRequestRead(RepairRequestBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
