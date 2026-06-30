from typing import Optional

from pydantic import BaseModel


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None


class ProfileRead(BaseModel):
    id: str
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    name: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None

    class Config:
        orm_mode = True
