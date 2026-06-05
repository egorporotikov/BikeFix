from datetime import datetime
from typing import List

from app.api.schemas.repair_request import RepairRequestCreate, RepairRequestRead
from app.utils.supabase_client import fetch_rows, get_row_by_id, insert_row


class RepairRequestService:
    TABLE_NAME = "repair_requests"

    @classmethod
    def create_repair_request(cls, payload: RepairRequestCreate) -> RepairRequestRead:
        if not payload.description.strip():
            raise ValueError("Description cannot be empty")
        if not payload.location.strip():
            raise ValueError("Location cannot be empty")

        timestamp = datetime.utcnow().isoformat()
        record = insert_row(
            cls.TABLE_NAME,
            {
                **payload.dict(),
                "status": payload.status or "open",
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )
        return RepairRequestRead(**record)

    @classmethod
    def list_repair_requests(cls) -> List[RepairRequestRead]:
        rows = fetch_rows(cls.TABLE_NAME)
        return [RepairRequestRead(**row) for row in rows]

    @classmethod
    def get_repair_request(cls, request_id: int) -> RepairRequestRead:
        row = get_row_by_id(cls.TABLE_NAME, request_id)
        if not row:
            raise LookupError(f"Repair request with id {request_id} not found")
        return RepairRequestRead(**row)
