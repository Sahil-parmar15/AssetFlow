from datetime import date, timedelta
from fastapi import APIRouter, Depends
from supabase import Client

from app.database import get_db
from app.utils.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis")
def get_dashboard_kpis(db: Client = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Return a snapshot of key asset management metrics:
    - assets_available / assets_allocated
    - maintenance_today (requests raised today)
    - active_bookings (non-cancelled)
    - pending_transfers
    - upcoming_returns (next 7 days)
    - overdue_returns (past expected date, not returned)
    """
    today = date.today()
    today_iso = today.isoformat()
    next_7_days = (today + timedelta(days=7)).isoformat()

    assets_available = len(db.table("assets").select("id").eq("status", "Available").execute().data or [])
    assets_allocated = len(db.table("assets").select("id").eq("status", "Allocated").execute().data or [])
    maintenance_today = len(
        db.table("maintenance_requests").select("id").gte("created_at", today_iso).execute().data or []
    )
    active_bookings = len(
        db.table("bookings").select("id").neq("status", "Cancelled").execute().data or []
    )
    pending_transfers = len(
        db.table("transfer_requests").select("id").eq("status", "Requested").execute().data or []
    )
    overdue_returns = len(
        db.table("allocations").select("id").eq("status", "Active").lt("expected_return_date", today_iso).execute().data or []
    )
    upcoming_returns = len(
        db.table("allocations").select("id").eq("status", "Active")
        .gte("expected_return_date", today_iso)
        .lte("expected_return_date", next_7_days)
        .execute().data or []
    )

    return {
        "assets_available": assets_available,
        "assets_allocated": assets_allocated,
        "maintenance_today": maintenance_today,
        "active_bookings": active_bookings,
        "pending_transfers": pending_transfers,
        "upcoming_returns": upcoming_returns,
        "overdue_returns": overdue_returns,
    }
