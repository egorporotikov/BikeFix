from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from app.api.schemas.message import MessageCreate, MessageRead
from app.api.services.message_service import MessageService
from app.middleware.verify_token import get_current_user_from_token

router = APIRouter(prefix="/messages", tags=["messages"])


def verify_token_header(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency to verify JWT token from Authorization header"""
    return get_current_user_from_token(authorization)


@router.post("/send", response_model=MessageRead, status_code=201)
def send_message(
    payload: MessageCreate,
    user: dict = Depends(verify_token_header),
):
    try:
        return MessageService.create_message(payload, sender_auth_id=user["sub"])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{request_id}", response_model=list[MessageRead])
def list_messages(
    request_id: str,
    user: dict = Depends(verify_token_header),
):
    try:
        return MessageService.list_messages_for_request(request_id, user["sub"])
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
