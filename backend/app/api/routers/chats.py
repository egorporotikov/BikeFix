from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from app.api.schemas.chat import ChatCreate, ChatRead, ChatMessageCreate, ChatMessageRead
from app.api.services.chat_service import ChatService
from app.middleware.verify_token import get_current_user_from_token

router = APIRouter(prefix="/chats", tags=["chats"])


def verify_token_header(authorization: Optional[str] = Header(None)) -> dict:
    return get_current_user_from_token(authorization)


@router.post("/create", response_model=ChatRead, status_code=201)
def create_chat(
    payload: ChatCreate,
    user: dict = Depends(verify_token_header),
):
    try:
        return ChatService.get_or_create_chat(
            request_id=payload.request_id,
            authenticated_user_id=user["sub"],
            mechanic_profile_id=payload.mechanic_profile_id,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/request/{request_id}", response_model=ChatRead)
def get_chat_by_request(
    request_id: str,
    user: dict = Depends(verify_token_header),
):
    try:
        chat = ChatService.get_chat_by_request_id(request_id)
        if not chat:
            raise LookupError("Chat not found")
        return ChatRead(**chat)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{chat_id}/messages", response_model=list[ChatMessageRead])
def get_chat_messages(
    chat_id: str,
    user: dict = Depends(verify_token_header),
):
    try:
        return [
            ChatMessageRead(**message)
            for message in ChatService.fetch_messages(chat_id, user["sub"])
        ]
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{chat_id}/messages/send", response_model=ChatMessageRead, status_code=201)
def send_chat_message(
    chat_id: str,
    payload: ChatMessageCreate,
    user: dict = Depends(verify_token_header),
):
    try:
        sent = ChatService.send_message(
            chat_id=chat_id,
            sender_auth_id=user["sub"],
            content=payload.content,
        )
        return ChatMessageRead(**sent)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
