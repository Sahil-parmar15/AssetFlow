from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_db
from app.dependencies import require_asset_manager_or_dept_head
from app.utils.auth import get_current_user
from app.utils.helpers import log_activity
from app.schemas.transfer_request import TransferRequestCreate, TransferRequestResponse

router = APIRouter(tags=["Transfer Requests"])


@router.post("/assets/{asset_id}/transfer-request", response_model=TransferRequestResponse, status_code=201)
def create_transfer_request(
    asset_id: int,
    transfer_in: TransferRequestCreate,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Request to transfer an asset to another employee (used when allocation is blocked)."""
    if not db.table("assets").select("id").eq("id", asset_id).execute().data:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not db.table("users").select("id").eq("id", transfer_in.requested_to).execute().data:
        raise HTTPException(status_code=400, detail="Target employee not found")

    resp = db.table("transfer_requests").insert({
        "asset_id": asset_id,
        "requested_by": current_user["id"],
        "requested_to": transfer_in.requested_to,
        "status": "Requested",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create transfer request.")

    log_activity(db, current_user["id"], "Transfer Requested",
                 f"Transfer requested for Asset ID {asset_id} to User ID {transfer_in.requested_to}.")
    return resp.data[0]


@router.post("/transfer-requests/{tr_id}/approve", response_model=TransferRequestResponse)
def approve_transfer_request(
    tr_id: int,
    db: Client = Depends(get_db),
    current_user: dict = Depends(require_asset_manager_or_dept_head),
):
    """
    Approve a transfer: closes the old allocation, creates a new one for the
    requested_to employee. Asset status stays Allocated.
    """
    tr_resp = db.table("transfer_requests").select("*").eq("id", tr_id).execute()
    if not tr_resp.data:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    tr = tr_resp.data[0]
    if tr["status"] != "Requested":
        raise HTTPException(status_code=400, detail=f"Transfer request is already {tr['status']}.")

    now_iso = datetime.now(timezone.utc).isoformat()
    asset_id = tr["asset_id"]

    # Close old active allocation
    old = db.table("allocations").select("id").eq("asset_id", asset_id).eq("status", "Active").execute()
    if old.data:
        db.table("allocations").update({"returned_at": now_iso, "status": "Returned"}).eq("id", old.data[0]["id"]).execute()

    # Create new allocation
    db.table("allocations").insert({
        "asset_id": asset_id,
        "employee_id": tr["requested_to"],
        "allocated_at": now_iso,
        "status": "Active",
    }).execute()

    resp = db.table("transfer_requests").update({"status": "Approved"}).eq("id", tr_id).execute()
    log_activity(db, current_user["id"], "Transfer Approved",
                 f"Transfer Request ID {tr_id} approved. Asset ID {asset_id} → User ID {tr['requested_to']}.")
    return resp.data[0]
