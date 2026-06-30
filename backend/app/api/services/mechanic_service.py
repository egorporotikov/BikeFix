from typing import Dict, List, Any, Optional
from datetime import datetime

from app.api.schemas.mechanic import MechanicProfileRead, ReviewInfo
from app.api.schemas.review import ReviewRead, MechanicStatsRead
from app.api.services.notification_service import NotificationService
from app.utils.supabase_client import fetch_rows, insert_row, update_row, get_row_by_id, upload_file


class MechanicService:
    @classmethod
    def get_mechanic_profile(cls, mechanic_profile_id: str) -> Dict[str, Any]:
        """Return a dict containing available mechanic profile data."""

        profile_rows = fetch_rows("profiles", {"id": mechanic_profile_id})
        if not profile_rows:
            raise LookupError(f"Mechanic profile with id {mechanic_profile_id} not found")

        mechanic_rows = fetch_rows("mechanics", {"profile_id": mechanic_profile_id})
        mechanic = mechanic_rows[0] if mechanic_rows else {}

        profile = profile_rows[0]

        result: Dict[str, Any] = {
            "id": mechanic_profile_id,
            "username": profile.get("username") or profile.get("email"),
            "name": (mechanic.get("name") if mechanic else None) or profile.get("username") or profile.get("email"),
        }

        # Optional profile fields
        if profile.get("city"):
            result["city"] = profile.get("city")
        if profile.get("bio"):
            result["bio"] = profile.get("bio")

        # Always use avatar from profiles table
        if profile.get("profile_image_url"):
            result["profile_image_url"] = profile.get("profile_image_url")

        # mechanic table optional fields
        if mechanic:
            if mechanic.get("is_verified") is not None:
                result["is_verified"] = bool(mechanic.get("is_verified"))

        # completed jobs
        service_requests = fetch_rows("repair_requests", {"mechanic_profile_id": mechanic_profile_id})
        if service_requests:
            completed_jobs_count = sum(1 for req in service_requests if req.get("status") == "completed")
            result["completed_jobs_count"] = completed_jobs_count

        # reviews
        review_rows = fetch_rows("reviews", {"mechanic_profile_id": mechanic_profile_id})
        if review_rows:
            total_reviews = len(review_rows)
            average_rating = None
            if total_reviews > 0:
                average_rating = sum((r.get("rating") or 0) for r in review_rows) / total_reviews

            reviews_list: List[Dict[str, Any]] = []
            for r in review_rows:
                user_rows = fetch_rows("profiles", {"id": r.get("user_profile_id")})
                user_name = None
                if user_rows:
                    user_name = user_rows[0].get("username") or user_rows[0].get("email")

                reviews_list.append(
                    {
                        "id": r.get("id"),
                        "rating": r.get("rating"),
                        "comment": r.get("comment"),
                        "user_name": user_name,
                        "created_at": r.get("created_at"),
                    }
                )

            result["total_reviews"] = total_reviews
            result["average_rating"] = average_rating
            result["reviews"] = reviews_list

        return result

    @classmethod
    def get_mechanic_reviews(cls, mechanic_profile_id: str) -> List[ReviewRead]:
        rows = fetch_rows("reviews", {"mechanic_profile_id": mechanic_profile_id})
        reviews: List[ReviewRead] = []
        for r in rows:
            user = fetch_rows("profiles", {"id": r.get("user_profile_id")})
            if user:
                r["user_username"] = user[0].get("username") or user[0].get("email")
            reviews.append(ReviewRead(**r))
        return reviews

    @classmethod
    def get_mechanic_stats(cls, mechanic_profile_id: str) -> MechanicStatsRead:
        service_requests = fetch_rows("repair_requests", {"mechanic_profile_id": mechanic_profile_id})
        completed_jobs_count = sum(1 for req in service_requests if req.get("status") == "completed")

        review_rows = fetch_rows("reviews", {"mechanic_profile_id": mechanic_profile_id})
        total_reviews = len(review_rows)
        average_rating: Optional[float] = None
        if total_reviews > 0:
            average_rating = sum((r.get("rating") or 0) for r in review_rows) / total_reviews

        return MechanicStatsRead(
            completed_jobs_count=completed_jobs_count,
            average_rating=average_rating,
            total_reviews=total_reviews,
        )

    @classmethod
    def upload_avatar(cls, auth_id: str, file_bytes: bytes, file_name: str) -> MechanicProfileRead:
        profile_rows = fetch_rows("profiles", {"auth_id": auth_id})
        if not profile_rows:
            raise LookupError("Profile not found")

        profile = profile_rows[0]
        profile_id = profile.get("id")
        if not profile_id:
            raise RuntimeError("Profile id not found")

        public_url = upload_file(file_bytes, file_name, bucket="bikefix")

        # Update only profiles table (mechanics avatar no longer used)
        update_row("profiles", profile_id, {"profile_image_url": public_url})

        # Ensure mechanic row exists (but avatar is not used anymore)
        mechanic_rows = fetch_rows("mechanics", {"profile_id": profile_id})
        if not mechanic_rows:
            insert_row(
                "mechanics",
                {
                    "profile_id": profile_id,
                    "name": profile.get("username") or profile.get("email"),
                    "city": None,
                    "bio": None,
                    "profile_image_url": public_url,  # kept for compatibility
                    "rating": 0,
                    "total_reviews": 0,
                    "is_verified": False,
                },
            )

        return cls.get_mechanic_profile(profile_id)

    @classmethod
    def create_review(cls, request_id: str, user_profile_id: str, rating: int, comment: Optional[str]) -> ReviewRead:
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")

        request = get_row_by_id("repair_requests", request_id)
        if not request:
            raise LookupError("Repair request not found")

        if request.get("status") != "completed":
            raise ValueError("Can only leave a review for a completed request")

        if request.get("requester_profile_id") != user_profile_id:
            raise PermissionError("Only the requester can leave a review for this request")

        mechanic_profile_id = request.get("mechanic_profile_id")
        if not mechanic_profile_id:
            raise RuntimeError("Request does not have an assigned mechanic")

        timestamp = datetime.utcnow().isoformat()
        existing_reviews = fetch_rows(
            "reviews",
            {"repair_request_id": request_id, "user_profile_id": user_profile_id},
        )

        is_new_review = not existing_reviews

        if is_new_review:
            record = insert_row(
                "reviews",
                {
                    "mechanic_profile_id": mechanic_profile_id,
                    "user_profile_id": user_profile_id,
                    "repair_request_id": request_id,
                    "rating": rating,
                    "comment": comment,
                    "created_at": timestamp,
                },
            )
        else:
            existing_review = existing_reviews[0]
            review_id = existing_review.get("id")
            record = update_row(
                "reviews",
                review_id,
                {
                    "rating": rating,
                    "comment": comment,
                    "updated_at": timestamp,
                },
            )

        if is_new_review:
            NotificationService.create_notification(
                recipient_profile_id=mechanic_profile_id,
                sender_profile_id=user_profile_id,
                type="review_created",
                title="New review submitted",
                body=f"A customer left a rating for request '{request_id}'.",
                link=f"/mechanic/profile",
            )

        review_rows = fetch_rows("reviews", {"mechanic_profile_id": mechanic_profile_id})
        total_reviews = len(review_rows)
        avg = float(sum((r.get("rating") or 0) for r in review_rows) / total_reviews) if total_reviews else 0.0

        mech_rows = fetch_rows("mechanics", {"profile_id": mechanic_profile_id})
        if mech_rows:
            mech_id = mech_rows[0].get("id")
            update_row("mechanics", mech_id, {"rating": avg, "total_reviews": total_reviews, "updated_at": timestamp})

        return ReviewRead(**record)
