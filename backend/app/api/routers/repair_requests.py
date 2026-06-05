from fastapi import APIRouter, HTTPException

from app.api.schemas.repair_request import RepairRequestCreate, RepairRequestRead
from app.api.services.repair_request_service import RepairRequestService

router = APIRouter(prefix="/repair-requests", tags=["repair_requests"])


@router.post("/", response_model=RepairRequestRead, status_code=201)
def create_repair_request(payload: RepairRequestCreate):
    try:
        return RepairRequestService.create_repair_request(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/", response_model=list[RepairRequestRead])
def list_repair_requests():
    return RepairRequestService.list_repair_requests()


@router.get("/{request_id}", response_model=RepairRequestRead)
def get_repair_request(request_id: int):
    try:
        return RepairRequestService.get_repair_request(request_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
