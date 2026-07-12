from datetime import datetime, timezone
from supabase import Client


def log_activity(db: Client, user_id: int, action: str, details: str) -> None:
    """
    Persist an activity log entry. Silently swallows errors so it never
    breaks the main request flow.
    """
    try:
        db.table("activity_logs").insert({
            "user_id": user_id,
            "action": action,
            "details": details,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass


def generate_asset_tag(db: Client) -> str:
    """Generate sequential asset tags: AF-0001, AF-0002 …"""
    resp = db.table("assets").select("asset_tag").order("id", desc=True).limit(1).execute()
    if resp.data:
        last_tag = resp.data[0].get("asset_tag", "AF-0000")
        try:
            last_num = int(last_tag.split("-")[1])
        except (IndexError, ValueError):
            last_num = 0
        return f"AF-{(last_num + 1):04d}"
    return "AF-0001"


def compute_booking_status(booking: dict) -> str:
    """
    Derive booking status on read (Upcoming / Ongoing / Completed / Cancelled).

    Chosen over a scheduled cron job because:
    - Zero infrastructure overhead
    - Always accurate (no stale state)
    - No worker process or distributed lock needed
    """
    if booking.get("status") == "Cancelled":
        return "Cancelled"
    now = datetime.now(timezone.utc).isoformat()
    start = booking.get("start_time", "")
    end = booking.get("end_time", "")
    if now < start:
        return "Upcoming"
    if now < end:
        return "Ongoing"
    return "Completed"
