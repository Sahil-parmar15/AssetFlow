from datetime import date, datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_db
from app.dependencies import require_asset_manager_or_admin
from app.utils.helpers import log_activity
from app.schemas.allocation import AllocationCreate, AllocationResponse, ReturnRequest

router = APIRouter(tags=["Allocations"])


@router.post("/assets/{asset_id}/allocate", response_model=AllocationResponse, status_code=201)
def allocate_asset(
    asset_id: int,
    alloc_in: AllocationCreate,
    db: Client = Depends(get_db),
    current_user: dict = Depends(require_asset_manager_or_admin),
):
    """
    Allocate an asset to an employee or department.

    Returns **409** if already allocated, with body:
    ```json
    { "message": "Asset is already allocated", "current_holder": "Jane Smith", "allocation_id": 42 }
    ```
    """
    asset_resp = db.table("assets").select("*").eq("id", asset_id).execute()
    if not asset_resp.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset = asset_resp.data[0]

    active_resp = db.table("allocations").select("*, users(name)").eq("asset_id", asset_id).eq("status", "Active").execute()
    if active_resp.data:
        active = active_resp.data[0]
        holder_name = (active.get("users") or {}).get("name", "Unknown")
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Asset is already allocated",
                "current_holder": holder_name,
                "allocation_id": active["id"],
            },
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    resp = db.table("allocations").insert({
        "asset_id": asset_id,
        "employee_id": alloc_in.employee_id,
        "department_id": alloc_in.department_id,
        "allocated_at": now_iso,
        "expected_return_date": alloc_in.expected_return_date,
        "status": "Active",
    }).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create allocation.")

    db.table("assets").update({"status": "Allocated"}).eq("id", asset_id).execute()
    log_activity(db, current_user["id"], "Asset Allocated",
                 f"Asset ID {asset_id} ({asset.get('asset_tag')}) allocated. Allocation ID: {resp.data[0]['id']}")
    return resp.data[0]


@router.post("/allocations/{alloc_id}/return", response_model=AllocationResponse)
def return_asset(
    alloc_id: int,
    return_data: ReturnRequest,
    db: Client = Depends(get_db),
    current_user: dict = Depends(require_asset_manager_or_admin),
):
    """Mark an allocation as returned and set the asset status back to Available."""
    alloc_resp = db.table("allocations").select("*").eq("id", alloc_id).execute()
    if not alloc_resp.data:
        raise HTTPException(status_code=404, detail="Allocation not found")
    alloc = alloc_resp.data[0]
    if alloc["status"] != "Active":
        raise HTTPException(status_code=400, detail="Allocation is already returned.")

    now_iso = datetime.now(timezone.utc).isoformat()
    resp = db.table("allocations").update({
        "returned_at": now_iso,
        "status": "Returned",
        "condition_notes": return_data.condition_notes,
    }).eq("id", alloc_id).execute()

    db.table("assets").update({"status": "Available"}).eq("id", alloc["asset_id"]).execute()
    log_activity(db, current_user["id"], "Asset Returned",
                 f"Allocation ID {alloc_id} returned. Asset ID {alloc['asset_id']} now Available.")
    return resp.data[0]


@router.get("/allocations/overdue", response_model=List[AllocationResponse])
def overdue_allocations(db: Client = Depends(get_db), current_user: dict = Depends(require_asset_manager_or_admin)):
    """Return all active allocations past their expected_return_date."""
    today = date.today().isoformat()
    return db.table("allocations").select("*").eq("status", "Active").lt("expected_return_date", today).execute().data
