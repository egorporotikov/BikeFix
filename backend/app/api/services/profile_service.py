from typing import Optional

from app.api.schemas.profile import ProfileRead, ProfileUpdate
from app.utils.supabase_client import fetch_rows, update_row


class ProfileService:
    TABLE_NAME = "profiles"

    @classmethod
    def _get_profile_by_auth_id(cls, auth_id: str) -> Optional[dict]:
        rows = fetch_rows(cls.TABLE_NAME, {"auth_id": auth_id})
        return rows[0] if rows else None

    @classmethod
    def get_current_profile(cls, auth_id: str) -> ProfileRead:
        profile = cls._get_profile_by_auth_id(auth_id)
        if not profile:
            raise LookupError("Profile not found")
        return ProfileRead(**profile)

    @classmethod
    def update_profile(cls, auth_id: str, payload: ProfileUpdate) -> ProfileRead:
        profile = cls._get_profile_by_auth_id(auth_id)
        if not profile:
            raise LookupError("Profile not found")

        update_data = payload.dict(exclude_unset=True)
        if not update_data:
            return ProfileRead(**profile)

        for field in ["name", "city", "bio", "profile_image_url"]:
            if field in update_data and isinstance(update_data[field], str):
                update_data[field] = update_data[field].strip()

        updated_profile = update_row(cls.TABLE_NAME, profile["id"], update_data)
        return ProfileRead(**updated_profile)
