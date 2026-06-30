from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from app.api.schemas.notification import NotificationRead
from app.api.services.notification_service import NotificationService
from app.utils.supabase_client import fetch_rows
from app.middleware.verify_token import get_current_user_from_token

router = APIRouter(prefix="/notifications", tags=["notifications"])


def verify_token_header(authorization: Optional[str] = Header(None)) -> dict:
    return get_current_user_from_token(authorization)


@router.get("/me", response_model=list[NotificationRead])
def get_my_notifications(user: dict = Depends(verify_token_header)):
    try:
        profile_rows = fetch_rows("profiles", {"auth_id": user["sub"]})
        if not profile_rows:
            raise HTTPException(status_code=404, detail="Profile not found")

        recipient_profile_id = profile_rows[0].get("id")
        return NotificationService.list_notifications(recipient_profile_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/me/unread-count")
def get_unread_notifications_count(user: dict = Depends(verify_token_header)):
    try:
        profile_rows = fetch_rows("profiles", {"auth_id": user["sub"]})
        if not profile_rows:
            raise HTTPException(status_code=404, detail="Profile not found")

        recipient_profile_id = profile_rows[0].get("id")
        return {"unread_count": NotificationService.list_unread_count(recipient_profile_id)}
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/{notification_id}/mark-read", response_model=NotificationRead)
def mark_notification_as_read(notification_id: str, user: dict = Depends(verify_token_header)):
    try:
        profile_rows = fetch_rows("profiles", {"auth_id": user["sub"]})
        if not profile_rows:
            raise HTTPException(status_code=404, detail="Profile not found")

        recipient_profile_id = profile_rows[0].get("id")
        return NotificationService.mark_as_read(notification_id, recipient_profile_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
