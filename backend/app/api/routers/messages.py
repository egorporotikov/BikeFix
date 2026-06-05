from fastapi import APIRouter, HTTPException

from app.api.schemas.message import MessageCreate, MessageRead
from app.api.services.message_service import MessageService

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=MessageRead, status_code=201)
def send_message(payload: MessageCreate):
    try:
        return MessageService.create_message(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{request_id}", response_model=list[MessageRead])
def list_messages(request_id: int):
    try:
        return MessageService.list_messages_for_request(request_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
