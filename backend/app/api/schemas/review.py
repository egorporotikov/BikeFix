from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    request_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewRead(BaseModel):
    id: str
    mechanic_profile_id: str
    user_profile_id: str
    repair_request_id: str
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True


class MechanicStatsRead(BaseModel):
    completed_jobs_count: int
    average_rating: Optional[float]
    total_reviews: int

    class Config:
        orm_mode = True
