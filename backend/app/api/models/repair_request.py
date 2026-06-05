from datetime import datetime
from pydantic import BaseModel, HttpUrl


class RepairRequestModel(BaseModel):
    id: int
    user_id: int | None = None
    photo_url: HttpUrl
    description: str
    location: str
    status: str = "open"
    created_at: datetime
    updated_at: datetime
