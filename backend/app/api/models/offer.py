from datetime import datetime
from pydantic import BaseModel


class OfferModel(BaseModel):
    id: int
    request_id: int
    mechanic_id: int
    price: float
    message: str
    status: str = "pending"
    created_at: datetime
