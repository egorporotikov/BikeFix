from typing import Any, Dict, Optional

from app.utils.supabase_client import fetch_rows


def get_mechanic_context(mechanic_profile_id: Optional[str]) -> Dict[str, Any]:
    """Return a normalized mechanic context payload for API responses.

    The app treats profiles as the canonical identity record, but mechanic-specific
    information such as display name, avatar and verification state is stored in the
    mechanics table when present. This helper centralizes that lookup so services do
    not each need to re-implement the same fallback behavior.
    """
    if not mechanic_profile_id:
        return {}

    profile_rows = fetch_rows("profiles", {"id": mechanic_profile_id})
    if not profile_rows:
        return {}

    profile = profile_rows[0]
    mechanic_rows = fetch_rows("mechanics", {"profile_id": mechanic_profile_id})
    mechanic = mechanic_rows[0] if mechanic_rows else {}

    resolved_name = (mechanic.get("name") if mechanic else None) or profile.get("username") or profile.get("email")
    resolved_image_url = (
        mechanic.get("profile_image_url")
        if mechanic.get("profile_image_url") is not None
        else profile.get("profile_image_url")
    )
    resolved_is_verified = bool(
        mechanic.get("is_verified")
        if mechanic.get("is_verified") is not None
        else profile.get("is_verified")
    )

    context: Dict[str, Any] = {
        "name": resolved_name,
        "profile_image_url": resolved_image_url,
        "is_verified": resolved_is_verified,
        "mechanic_name": resolved_name,
        "mechanic_profile_image_url": resolved_image_url,
        "mechanic_is_verified": resolved_is_verified,
    }

    return context
