import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Header

from app.api.schemas.profile import ProfileRead, ProfileUpdate
from app.api.services.profile_service import ProfileService
from app.middleware.verify_token import get_current_user_from_token
from app.utils.supabase_client import upload_file

router = APIRouter(prefix="/profiles", tags=["profiles"])


def verify_token_header(authorization: Optional[str] = Header(None)) -> dict:
    return get_current_user_from_token(authorization)


@router.get("/me", response_model=ProfileRead)
def get_current_profile(user: dict = Depends(verify_token_header)):
    try:
        return ProfileService.get_current_profile(user["sub"])
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/update", response_model=ProfileRead)
def update_profile(payload: ProfileUpdate, user: dict = Depends(verify_token_header)):
    try:
        return ProfileService.update_profile(user["sub"], payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload-avatar", response_model=ProfileRead)
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
        public_url = upload_file(payload, file_name, bucket="bikefix")
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    try:
        return ProfileService.update_profile(user["sub"], ProfileUpdate(profile_image_url=public_url))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
