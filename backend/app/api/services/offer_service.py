from datetime import datetime
from typing import List, Optional

from app.api.schemas.offer import OfferCreate, OfferRead
from app.api.services.mechanic_context import get_mechanic_context
from app.api.services.notification_service import NotificationService
from app.utils.supabase_client import fetch_rows, get_row_by_id, insert_row, update_row


class OfferService:
    TABLE_NAME = "offers"

    @classmethod
    def _get_mechanic_details(cls, mechanic_profile_id: str) -> dict:
        """Fetch mechanic name, profile_image_url, and is_verified status."""
        return get_mechanic_context(mechanic_profile_id)

    @classmethod
    def _enrich_offers(cls, offers: List[dict]) -> List[dict]:
        """Enrich offer records with mechanic details."""
        enriched = []
        for offer in offers:
            mechanic_details = cls._get_mechanic_details(offer.get("mechanic_profile_id"))
            enriched.append({**offer, **mechanic_details})
        return enriched

    @classmethod
    def _ensure_request_exists(cls, request_id: str) -> None:
        from app.api.services.repair_request_service import RepairRequestService

        RepairRequestService.get_repair_request(request_id)

    @classmethod
    def create_offer(cls, request_id: str, payload: OfferCreate, mechanic_auth_id: str) -> OfferRead:
        if payload.price <= 0:
            raise ValueError("Offer price must be greater than zero")
        if not payload.message.strip():
            raise ValueError("Offer message cannot be empty")

        from app.api.services.repair_request_service import RepairRequestService

        request = RepairRequestService.get_repair_request(request_id)
        if request.status != "pending":
            raise ValueError("Cannot submit offers for a request that is not pending")

        prof = fetch_rows("profiles", {"auth_id": mechanic_auth_id})
        if not prof or prof[0].get("role") != "mechanic":
            raise PermissionError("Only mechanics can create offers")

        mechanic_profile_id = prof[0].get("id")
        if not mechanic_profile_id:
            raise PermissionError("Unable to resolve mechanic profile")

        timestamp = datetime.utcnow().isoformat()
        record = insert_row(
            cls.TABLE_NAME,
            {
                "repair_request_id": request_id,
                "mechanic_profile_id": mechanic_profile_id,
                "price": payload.price,
                "description": payload.message,
                "status": "pending",
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )

        NotificationService.create_notification(
            recipient_profile_id=request.requester_profile_id,
            sender_profile_id=mechanic_profile_id,
            type="offer_created",
            title="New offer received",
            body=f"A mechanic sent an offer for your request '{request.title}'.",
            link=f"/requests/{request_id}",
        )

        enriched = cls._enrich_offers([record])
        return OfferRead(**enriched[0])

    @classmethod
    def select_offer(cls, request_id: str, offer_id: str, user_auth_id: str) -> OfferRead:
        offer = get_row_by_id(cls.TABLE_NAME, offer_id)
        if not offer or offer.get("repair_request_id") != request_id:
            raise LookupError("Offer not found for this repair request")

        from app.api.services.repair_request_service import RepairRequestService
        from app.api.services.chat_service import ChatService

        request = RepairRequestService.get_repair_request(request_id)
        user_prof = fetch_rows("profiles", {"auth_id": user_auth_id})
        if not user_prof or user_prof[0].get("role") != "user":
            raise PermissionError("Only the request owner can select an offer")

        requester_profile_id = user_prof[0].get("id")
        if requester_profile_id != request.requester_profile_id:
            raise PermissionError("Only the request owner can select an offer")

        if request.status != "pending":
            raise ValueError("Offers can only be selected for pending requests")

        if offer.get("status") != "pending":
            raise ValueError("Only pending offers can be selected")

        mechanic_profile_id = offer.get("mechanic_profile_id")
        if not mechanic_profile_id:
            raise RuntimeError("Cannot select an offer without a mechanic")

        timestamp = datetime.utcnow().isoformat()
        selected_offer = update_row(
            cls.TABLE_NAME,
            offer_id,
            {
                "status": "accepted",
                "updated_at": timestamp,
            },
        )

        all_offers = fetch_rows(cls.TABLE_NAME, {"repair_request_id": request_id})
        for row in all_offers:
            if row.get("id") != offer_id and row.get("status") == "pending":
                update_row(
                    cls.TABLE_NAME,
                    row.get("id"),
                    {
                        "status": "rejected",
                        "updated_at": timestamp,
                    },
                )

        update_row(
            "repair_requests",
            request_id,
            {
                "mechanic_profile_id": mechanic_profile_id,
                "status": "accepted",
                "updated_at": timestamp,
            },
        )

        ChatService.create_chat(
            request_id=request_id,
            authenticated_user_id=user_auth_id,
            mechanic_profile_id=mechanic_profile_id,
        )

        NotificationService.create_notification(
            recipient_profile_id=mechanic_profile_id,
            sender_profile_id=request.requester_profile_id,
            type="offer_selected",
            title="Your offer was selected",
            body=f"Your offer for request '{request.title}' was accepted.",
            link=f"/chat/{request_id}",
        )

        enriched = cls._enrich_offers([selected_offer])
        return OfferRead(**enriched[0])

    @classmethod
    def list_offers_for_request(cls, request_id: str) -> List[OfferRead]:
        rows = fetch_rows(cls.TABLE_NAME, {"repair_request_id": request_id})
        enriched = cls._enrich_offers(rows)
        return [OfferRead(**row) for row in enriched]