from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from app.api.schemas.offer import OfferCreate, OfferRead
from app.api.services.offer_service import OfferService
from app.api.services.repair_request_service import RepairRequestService
from app.utils.supabase_client import fetch_rows
from app.middleware.verify_token import get_current_user_from_token

router = APIRouter(prefix="/repair-requests/{request_id}/offers", tags=["offers"])


def verify_token_header(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency to verify JWT token from Authorization header"""
    return get_current_user_from_token(authorization)


@router.post("", response_model=OfferRead, status_code=201)
def create_offer(
    request_id: str,
    payload: OfferCreate,
    user: dict = Depends(verify_token_header),
):
    try:
        return OfferService.create_offer(request_id, payload, user["sub"])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{offer_id}/select", response_model=OfferRead)
def select_offer(
    request_id: str,
    offer_id: str,
    user: dict = Depends(verify_token_header),
):
    try:
        return OfferService.select_offer(request_id, offer_id, user["sub"])
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("", response_model=list[OfferRead])
def list_offers(
    request_id: str,
    user: dict = Depends(verify_token_header),
):
    try:
        # Only the request owner or mechanics may list offers
        request = RepairRequestService.get_repair_request(request_id)
        caller = user["sub"]
        caller_profile = fetch_rows("profiles", {"auth_id": caller})

        if caller_profile and caller_profile[0].get("id") == request.requester_profile_id:
            return OfferService.list_offers_for_request(request_id)

        if not caller_profile or caller_profile[0].get("role") != "mechanic":
            raise HTTPException(status_code=403, detail="Not authorized to view offers for this request")

        return OfferService.list_offers_for_request(request_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
