from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.database import get_db
from app.dependencies import require_admin
from app.schemas.activity_log import ActivityLogResponse

router = APIRouter(prefix="/activity-log", tags=["Activity Log"])


@router.get("", response_model=List[ActivityLogResponse])
def get_activity_log(
    user_id: Optional[int] = None,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Client = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Paginated activity log, most recent first. Admin only.
    Filter by user_id to see a specific user's actions.
    """
    offset = (page - 1) * page_size
    query = (
        db.table("activity_logs")
        .select("*")
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
    )
    if user_id is not None:
        query = query.eq("user_id", user_id)
    return query.execute().data
