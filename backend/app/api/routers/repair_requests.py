from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from app.api.schemas.repair_request import (
    RepairRequestCreate,
    RepairRequestRead,
)
from app.api.services.repair_request_service import RepairRequestService
from app.middleware.verify_token import get_current_user_from_token

router = APIRouter(prefix="/repair-requests", tags=["repair_requests"])


def verify_token_header(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency to verify JWT token from Authorization header"""
    return get_current_user_from_token(authorization)


@router.post("/create", response_model=RepairRequestRead, status_code=201)
def create_repair_request(
    payload: RepairRequestCreate,
    user: dict = Depends(verify_token_header),
):
    try:
        return RepairRequestService.create_repair_request(payload, user["sub"])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/user", response_model=list[RepairRequestRead])
def get_user_repair_requests(
    user: dict = Depends(verify_token_header),
):
    try:
        return RepairRequestService.get_user_repair_requests(user["sub"])
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/pending", response_model=list[RepairRequestRead])
def get_pending_repair_requests(
    user: dict = Depends(verify_token_header),
):
    try:
        return RepairRequestService.get_pending_repair_requests(user["sub"])
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/mechanic", response_model=list[RepairRequestRead])
def get_mechanic_repair_requests(
    user: dict = Depends(verify_token_header),
):
    try:
        return RepairRequestService.get_mechanic_repair_requests(user["sub"])
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/{request_id}", response_model=RepairRequestRead)
def get_repair_request(request_id: str):
    try:
        return RepairRequestService.get_repair_request(request_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/{request_id}/complete", response_model=RepairRequestRead)
def complete_repair_request(request_id: str, user: dict = Depends(verify_token_header)):
    try:
        return RepairRequestService.complete_repair_request(request_id, user["sub"])
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/", response_model=list[RepairRequestRead])
def list_repair_requests():
    return RepairRequestService.list_repair_requests()



