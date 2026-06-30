from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ReviewInfo(BaseModel):
    """Simplified review info to include in mechanic profile"""
    id: str
    rating: int
    comment: Optional[str] = None
    user_name: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class MechanicProfileRead(BaseModel):
    id: str
    username: Optional[str] = None
    name: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    average_rating: Optional[float] = None
    total_reviews: Optional[int] = None
    completed_jobs_count: Optional[int] = None
    is_verified: Optional[bool] = None
    reviews: Optional[List[ReviewInfo]] = None

    class Config:
        orm_mode = True
