from fastapi import APIRouter, HTTPException

from app.api.schemas.offer import OfferCreate, OfferRead
from app.api.services.offer_service import OfferService

router = APIRouter(prefix="/repair-requests/{request_id}/offers", tags=["offers"])


@router.post("", response_model=OfferRead, status_code=201)
def create_offer(request_id: int, payload: OfferCreate):
    try:
        return OfferService.create_offer(request_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("", response_model=list[OfferRead])
def list_offers(request_id: int):
    try:
        return OfferService.list_offers_for_request(request_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
