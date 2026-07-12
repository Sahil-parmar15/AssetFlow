from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_db
from app.dependencies import require_asset_manager_or_admin
from app.utils.auth import get_current_user
from app.utils.helpers import log_activity
from app.schemas.maintenance import (
    MaintenanceRequestCreate,
    MaintenanceRequestResponse,
    TechnicianAssign,
    MaintenanceReject,
)

router = APIRouter(prefix="/maintenance-requests", tags=["Maintenance"])


@router.post("", response_model=MaintenanceRequestResponse, status_code=201)
def create_maintenance_request(
    maint_in: MaintenanceRequestCreate,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Raise a maintenance request. Any authenticated user."""
    if maint_in.priority not in ["Low", "Medium", "High"]:
        raise HTTPException(status_code=400, detail="Priority must be 'Low', 'Medium', or 'High'.")
    if not db.table("assets").select("id").eq("id", maint_in.asset_id).execute().data:
        raise HTTPException(status_code=404, detail="Asset not found")

    resp = db.table("maintenance_requests").insert({
        "asset_id": maint_in.asset_id,
        "raised_by": current_user["id"],
        "issue_description": maint_in.issue_description,
        "priority": maint_in.priority,
        "photo_url": maint_in.photo_url,
        "status": "Pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create maintenance request.")

    log_activity(db, current_user["id"], "Maintenance Requested",
                 f"Maintenance request raised for Asset ID {maint_in.asset_id}. Priority: {maint_in.priority}.")
    return resp.data[0]


@router.post("/{req_id}/approve", response_model=MaintenanceRequestResponse)
def approve_maintenance_request(req_id: int, db: Client = Depends(get_db),
                                 current_user: dict = Depends(require_asset_manager_or_admin)):
    """Approve a request and set asset.status = UnderMaintenance. AssetManager/Admin only."""
    resp = db.table("maintenance_requests").select("*").eq("id", req_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    req = resp.data[0]
    if req["status"] != "Pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req['status']}.")

    updated = db.table("maintenance_requests").update({"status": "Approved"}).eq("id", req_id).execute()
    db.table("assets").update({"status": "UnderMaintenance"}).eq("id", req["asset_id"]).execute()
    log_activity(db, current_user["id"], "Maintenance Approved",
                 f"Maintenance Request ID {req_id} approved. Asset ID {req['asset_id']} → UnderMaintenance.")
    return updated.data[0]


@router.post("/{req_id}/reject", response_model=MaintenanceRequestResponse)
def reject_maintenance_request(req_id: int, reject_data: MaintenanceReject,
                                db: Client = Depends(get_db),
                                current_user: dict = Depends(require_asset_manager_or_admin)):
    """Reject a pending or approved request with a reason. AssetManager/Admin only."""
    resp = db.table("maintenance_requests").select("*").eq("id", req_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    req = resp.data[0]
    if req["status"] not in ["Pending", "Approved"]:
        raise HTTPException(status_code=400, detail=f"Cannot reject a '{req['status']}' request.")

    updated = db.table("maintenance_requests").update({
        "status": "Rejected",
        "rejection_reason": reject_data.rejection_reason,
    }).eq("id", req_id).execute()
    log_activity(db, current_user["id"], "Maintenance Rejected",
                 f"Maintenance Request ID {req_id} rejected. Reason: {reject_data.rejection_reason}")
    return updated.data[0]


@router.patch("/{req_id}/assign-technician", response_model=MaintenanceRequestResponse)
def assign_technician(req_id: int, tech_data: TechnicianAssign, db: Client = Depends(get_db),
                      current_user: dict = Depends(require_asset_manager_or_admin)):
    """Assign a technician name and move status to TechnicianAssigned."""
    if not db.table("maintenance_requests").select("id").eq("id", req_id).execute().data:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    updated = db.table("maintenance_requests").update({
        "technician_name": tech_data.technician_name,
        "status": "TechnicianAssigned",
    }).eq("id", req_id).execute()
    log_activity(db, current_user["id"], "Technician Assigned",
                 f"Technician '{tech_data.technician_name}' assigned to Request ID {req_id}.")
    return updated.data[0]


@router.post("/{req_id}/resolve", response_model=MaintenanceRequestResponse)
def resolve_maintenance_request(req_id: int, db: Client = Depends(get_db),
                                 current_user: dict = Depends(require_asset_manager_or_admin)):
    """Resolve a request, set resolved_at=now, and restore asset.status = Available."""
    resp = db.table("maintenance_requests").select("*").eq("id", req_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    req = resp.data[0]
    if req["status"] not in ["Approved", "TechnicianAssigned", "InProgress"]:
        raise HTTPException(status_code=400, detail=f"Cannot resolve a '{req['status']}' request.")

    now_iso = datetime.now(timezone.utc).isoformat()
    updated = db.table("maintenance_requests").update({
        "status": "Resolved",
        "resolved_at": now_iso,
    }).eq("id", req_id).execute()
    db.table("assets").update({"status": "Available"}).eq("id", req["asset_id"]).execute()
    log_activity(db, current_user["id"], "Maintenance Resolved",
                 f"Request ID {req_id} resolved. Asset ID {req['asset_id']} → Available.")
    return updated.data[0]
