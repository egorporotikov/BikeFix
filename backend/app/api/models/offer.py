from datetime import datetime
from pydantic import BaseModel


class OfferModel(BaseModel):
    id: str
    repair_request_id: str
    mechanic_profile_id: str
    price: float
    description: str
    status: str = "pending"
    created_at: datetime
    updated_at: datetime
