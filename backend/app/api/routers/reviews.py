from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from app.api.schemas.review import ReviewCreate, ReviewRead
from app.api.services.mechanic_service import MechanicService
from app.utils.supabase_client import fetch_rows
from app.middleware.verify_token import get_current_user_from_token

router = APIRouter(prefix="/reviews", tags=["reviews"])


def verify_token_header(authorization: Optional[str] = Header(None)) -> dict:
    return get_current_user_from_token(authorization)


@router.post("/create", response_model=ReviewRead, status_code=201)
def create_review(payload: ReviewCreate, user: dict = Depends(verify_token_header)):
    try:
        # resolve user profile id from auth id
        prof = fetch_rows("profiles", {"auth_id": user["sub"]})
        if not prof:
            raise HTTPException(status_code=403, detail="User profile not found")
        user_profile_id = prof[0].get("id")

        return MechanicService.create_review(payload.request_id, user_profile_id, payload.rating, payload.comment)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
