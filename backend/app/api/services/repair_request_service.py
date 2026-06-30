from datetime import datetime
from typing import List, Optional
import base64

from app.api.schemas.repair_request import (
    RepairRequestCreate,
    RepairRequestRead,
)
from app.api.services.mechanic_context import get_mechanic_context
from app.utils.supabase_client import (
    fetch_rows,
    get_row_by_id,
    insert_row,
    update_row,
    upload_file,
)


class RepairRequestService:
    TABLE_NAME = "repair_requests"

    @classmethod
    def _get_profile_name(cls, profile_id: str) -> Optional[str]:
        try:
            rows = fetch_rows("profiles", {"id": profile_id})
            if not rows:
                return None
            profile = rows[0]
            return profile.get("username") or profile.get("email")
        except Exception:
            return None

    @classmethod
    def _get_mechanic_details(cls, mechanic_profile_id: str) -> dict:
        """Fetch mechanic profile image and verification status."""
        context = get_mechanic_context(mechanic_profile_id)
        return {
            "mechanic_profile_image_url": context.get("mechanic_profile_image_url"),
            "mechanic_is_verified": context.get("mechanic_is_verified", False),
        }

    @classmethod
    def _populate_names(cls, record: dict) -> dict:
        if record.get("requester_profile_id"):
            record["requester_name"] = cls._get_profile_name(record["requester_profile_id"])
        if record.get("mechanic_profile_id"):
            mechanic_context = get_mechanic_context(record["mechanic_profile_id"])
            record["mechanic_name"] = mechanic_context.get("mechanic_name")
            record["mechanic_profile_image_url"] = mechanic_context.get("mechanic_profile_image_url")
            record["mechanic_is_verified"] = mechanic_context.get("mechanic_is_verified", False)
        return record

    @classmethod
    def create_repair_request(cls, payload: RepairRequestCreate, user_id: str) -> RepairRequestRead:
        # Validate user role
        prof = fetch_rows("profiles", {"auth_id": user_id})
        if not prof or prof[0].get("role") != "user":
            raise PermissionError("Only users can create repair requests")

        if not payload.description.strip():
            raise ValueError("Description cannot be empty")
        if not payload.address.strip():
            raise ValueError("Address cannot be empty")
        if not payload.title.strip():
            raise ValueError("Title cannot be empty")

        valid_categories = ["flat tire", "brake issue", "chain problem", "other"]
        if payload.category not in valid_categories:
            raise ValueError(f"Invalid category. Must be one of: {', '.join(valid_categories)}")

        timestamp = datetime.utcnow().isoformat()
        requester_profile_id = prof[0].get("id")

        # 🔥 Upload image if provided AND valid base64
        public_url = None

        if payload.image_url and isinstance(payload.image_url, str):
            if payload.image_url.startswith("data:image"):
                try:
                    base64_data = payload.image_url.split(",")[-1]
                    file_bytes = base64.b64decode(base64_data)

                    file_name = f"{requester_profile_id}_{int(datetime.utcnow().timestamp())}.jpg"
                    public_url = upload_file(file_bytes, file_name, bucket="bikefix")

                except Exception as exc:
                    raise RuntimeError(f"Failed to upload image: {exc}")

        # 🔥 Save public URL in DB
        record = insert_row(
            cls.TABLE_NAME,
            {
                "requester_profile_id": requester_profile_id,
                "title": payload.title,
                "description": payload.description,
                "address": payload.address,
                "category": payload.category,
                "image_url": public_url,
                "status": "pending",
                "mechanic_profile_id": None,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )

        return RepairRequestRead(**cls._populate_names(record))

    @classmethod
    def list_repair_requests(cls) -> List[RepairRequestRead]:
        rows = fetch_rows(cls.TABLE_NAME)
        return [RepairRequestRead(**cls._populate_names(row)) for row in rows]

    @classmethod
    def get_repair_request(cls, request_id: str) -> RepairRequestRead:
        row = get_row_by_id(cls.TABLE_NAME, request_id)
        if not row:
            raise LookupError(f"Repair request with id {request_id} not found")
        return RepairRequestRead(**cls._populate_names(row))

    @classmethod
    def get_user_repair_requests(cls, user_id: str) -> List[RepairRequestRead]:
        prof = fetch_rows("profiles", {"auth_id": user_id})
        if not prof or prof[0].get("role") != "user":
            raise PermissionError("Only users can view their repair requests")

        requester_profile_id = prof[0].get("id")
        rows = fetch_rows(cls.TABLE_NAME, {"requester_profile_id": requester_profile_id})
        return [RepairRequestRead(**cls._populate_names(row)) for row in rows]

    @classmethod
    def get_pending_repair_requests(cls, caller_id: str) -> List[RepairRequestRead]:
        prof = fetch_rows("profiles", {"auth_id": caller_id})
        if not prof or prof[0].get("role") != "mechanic":
            raise PermissionError("Only mechanics can view pending repair requests")

        rows = fetch_rows(cls.TABLE_NAME, {"status": "pending"})
        return [RepairRequestRead(**cls._populate_names(row)) for row in rows]

    @classmethod
    def get_mechanic_repair_requests(cls, mechanic_id: str) -> List[RepairRequestRead]:
        prof = fetch_rows("profiles", {"auth_id": mechanic_id})
        if not prof or prof[0].get("role") != "mechanic":
            raise PermissionError("Only mechanics can view mechanic repair requests")

        mechanic_profile_id = prof[0].get("id")
        rows = fetch_rows(cls.TABLE_NAME, {"mechanic_profile_id": mechanic_profile_id})
        return [RepairRequestRead(**cls._populate_names(row)) for row in rows]

    @classmethod
    def complete_repair_request(cls, request_id: str, user_id: str) -> RepairRequestRead:
        prof = fetch_rows("profiles", {"auth_id": user_id})
        if not prof or prof[0].get("role") != "user":
            raise PermissionError("Only the requester can complete repair requests")

        requester_profile_id = prof[0].get("id")
        request = get_row_by_id(cls.TABLE_NAME, request_id)
        if not request:
            raise LookupError(f"Repair request with id {request_id} not found")

        if request.get("requester_profile_id") != requester_profile_id:
            raise PermissionError("Only the requester can complete this repair request")

        if request.get("status") != "accepted":
            raise ValueError("Only accepted repair requests can be marked completed")

        if not request.get("mechanic_profile_id"):
            raise RuntimeError("Cannot complete a repair request without an assigned mechanic")

        timestamp = datetime.utcnow().isoformat()
        updated = update_row(
            cls.TABLE_NAME,
            request_id,
            {
                "status": "completed",
                "updated_at": timestamp,
            },
        )
        return RepairRequestRead(**cls._populate_names(updated))
