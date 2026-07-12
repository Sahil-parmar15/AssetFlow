from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_db
from app.utils.auth import get_current_user
from app.utils.helpers import log_activity, compute_booking_status
from app.schemas.booking import BookingCreate, BookingResponse

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingResponse, status_code=201)
def create_booking(
    booking_in: BookingCreate,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Book a shared/bookable asset.

    Overlap rule: reject if any non-cancelled booking on the same asset satisfies
    `existing.start_time < new.end_time AND existing.end_time > new.start_time`.

    Example:
    - Existing booking: 09:00–10:00
    - Request 09:30–10:30 → **409 Conflict** (overlaps)
    - Request 10:00–11:00 → **201 Created** (boundary is exclusive)
    """
    asset_resp = db.table("assets").select("*").eq("id", booking_in.asset_id).execute()
    if not asset_resp.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not asset_resp.data[0].get("is_shared_bookable"):
        raise HTTPException(status_code=400, detail="Asset is not marked as bookable.")

    if booking_in.start_time >= booking_in.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time.")

    start_iso = booking_in.start_time.isoformat()
    end_iso = booking_in.end_time.isoformat()

    existing = db.table("bookings").select("*").eq("asset_id", booking_in.asset_id).neq("status", "Cancelled").execute()
    for b in (existing.data or []):
        ex_start, ex_end = b["start_time"], b["end_time"]
        if ex_start < end_iso and ex_end > start_iso:
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Booking overlaps with an existing booking",
                    "conflicting_booking_id": b["id"],
                    "conflicting_start": ex_start,
                    "conflicting_end": ex_end,
                },
            )

    resp = db.table("bookings").insert({
        "asset_id": booking_in.asset_id,
        "booked_by": current_user["id"],
        "start_time": start_iso,
        "end_time": end_iso,
        "status": "Upcoming",
    }).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create booking.")

    log_activity(db, current_user["id"], "Booking Created",
                 f"Booking for Asset ID {booking_in.asset_id} from {start_iso} to {end_iso}.")
    return resp.data[0]


@router.get("", response_model=List[BookingResponse])
def list_bookings(
    asset_id: Optional[int] = None,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List bookings for a resource (for calendar display). Status computed on read."""
    query = db.table("bookings").select("*")
    if asset_id is not None:
        query = query.eq("asset_id", asset_id)
    bookings = query.execute().data or []
    for b in bookings:
        b["status"] = compute_booking_status(b)
    return bookings


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(booking_id: int, db: Client = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Cancel a booking. Only the booker or AssetManager/Admin may cancel."""
    resp = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Booking not found")
    b = resp.data[0]
    if b["status"] == "Cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled.")
    if b["booked_by"] != current_user["id"] and current_user.get("role") not in ["Admin", "AssetManager"]:
        raise HTTPException(status_code=403, detail="Not authorised to cancel this booking.")

    updated = db.table("bookings").update({"status": "Cancelled"}).eq("id", booking_id).execute()
    log_activity(db, current_user["id"], "Booking Cancelled", f"Booking ID {booking_id} cancelled.")
    return updated.data[0]
