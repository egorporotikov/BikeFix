from datetime import datetime
from typing import List

from app.api.schemas.offer import OfferCreate, OfferRead
from app.utils.supabase_client import fetch_rows, insert_row


class OfferService:
    TABLE_NAME = "offers"

    @classmethod
    def _ensure_request_exists(cls, request_id: int) -> None:
        from app.api.services.repair_request_service import RepairRequestService

        RepairRequestService.get_repair_request(request_id)

    @classmethod
    def create_offer(cls, request_id: int, payload: OfferCreate) -> OfferRead:
        if payload.price <= 0:
            raise ValueError("Offer price must be greater than zero")
        if not payload.message.strip():
            raise ValueError("Offer message cannot be empty")

        cls._ensure_request_exists(request_id)

        timestamp = datetime.utcnow().isoformat()
        record = insert_row(
            cls.TABLE_NAME,
            {
                "request_id": request_id,
                **payload.dict(),
                "status": "pending",
                "created_at": timestamp,
            },
        )
        return OfferRead(**record)

    @classmethod
    def list_offers_for_request(cls, request_id: int) -> List[OfferRead]:
        rows = fetch_rows(cls.TABLE_NAME, {"request_id": request_id})
        return [OfferRead(**row) for row in rows]
