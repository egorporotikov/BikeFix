import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile

from app.api.schemas.mechanic import MechanicProfileRead
from app.api.services.mechanic_service import MechanicService
from app.middleware.verify_token import get_current_user_from_token

router = APIRouter(prefix="/mechanics", tags=["mechanics"])


def verify_token_header(authorization: Optional[str] = Header(None)) -> dict:
    return get_current_user_from_token(authorization)


@router.get("/{mechanic_id}", response_model=MechanicProfileRead)
def get_mechanic_profile(mechanic_id: str):
    try:
        return MechanicService.get_mechanic_profile(mechanic_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{mechanic_id}/reviews")
def list_mechanic_reviews(mechanic_id: str):
    try:
        return MechanicService.get_mechanic_reviews(mechanic_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{mechanic_id}/stats")
def get_mechanic_stats(mechanic_id: str):
    try:
        return MechanicService.get_mechanic_stats(mechanic_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload-avatar", response_model=MechanicProfileRead)
async def upload_avatar(
    avatar: UploadFile = File(...),
    user: dict = Depends(verify_token_header),
):
    if not avatar.content_type or not avatar.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    payload = await avatar.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    file_name = f"{uuid.uuid4().hex}_{avatar.filename}"

    try:
        return MechanicService.upload_avatar(user["sub"], payload, file_name)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
