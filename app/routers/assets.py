from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_db
from app.dependencies import require_asset_manager_or_admin
from app.utils.auth import get_current_user
from app.utils.helpers import log_activity, generate_asset_tag
from app.schemas.asset import AssetCreate, AssetResponse, AssetDetailResponse

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.post("", response_model=AssetResponse, status_code=201)
def create_asset(
    asset_in: AssetCreate,
    db: Client = Depends(get_db),
    current_user: dict = Depends(require_asset_manager_or_admin),
):
    """Register a new asset. Auto-generates asset_tag (AF-XXXX). AssetManager/Admin only."""
    if not db.table("asset_categories").select("id").eq("id", asset_in.category_id).execute().data:
        raise HTTPException(status_code=400, detail=f"Asset category {asset_in.category_id} does not exist.")

    asset_tag = generate_asset_tag(db)
    resp = db.table("assets").insert({
        "name": asset_in.name,
        "asset_tag": asset_tag,
        "category_id": asset_in.category_id,
        "serial_number": asset_in.serial_number,
        "acquisition_date": asset_in.acquisition_date,
        "acquisition_cost": asset_in.acquisition_cost,
        "condition": asset_in.condition,
        "location": asset_in.location,
        "is_shared_bookable": asset_in.is_shared_bookable,
        "status": "Available",
        "photo_url": asset_in.photo_url,
    }).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create asset.")

    log_activity(db, current_user["id"], "Asset Registered",
                 f"Asset '{asset_in.name}' ({asset_tag}) registered.")
    return resp.data[0]


@router.get("", response_model=List[AssetResponse])
def list_assets(
    asset_tag: Optional[str] = None,
    serial_number: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    location: Optional[str] = None,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Search/filter assets. All authenticated users."""
    query = db.table("assets").select("*")
    if asset_tag:
        query = query.ilike("asset_tag", f"%{asset_tag}%")
    if serial_number:
        query = query.ilike("serial_number", f"%{serial_number}%")
    if category_id is not None:
        query = query.eq("category_id", category_id)
    if status:
        query = query.eq("status", status)
    if location:
        query = query.ilike("location", f"%{location}%")
    return query.execute().data


@router.get("/{asset_id}", response_model=AssetDetailResponse)
def get_asset(asset_id: int, db: Client = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get asset details including allocation and maintenance history."""
    resp = db.table("assets").select("*").eq("id", asset_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset = resp.data[0]

    alloc_resp = db.table("allocations").select("*").eq("asset_id", asset_id).execute()
    maint_resp = db.table("maintenance_requests").select("*").eq("asset_id", asset_id).execute()

    return {
        **asset,
        "allocation_history": alloc_resp.data or [],
        "maintenance_history": maint_resp.data or [],
    }


@router.get("/{asset_id}/maintenance-history", tags=["Maintenance"])
def get_maintenance_history(asset_id: int, db: Client = Depends(get_db),
                             current_user: dict = Depends(get_current_user)):
    """Return all maintenance requests for a given asset."""
    if not db.table("assets").select("id").eq("id", asset_id).execute().data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db.table("maintenance_requests").select("*").eq("asset_id", asset_id).order("created_at", desc=True).execute().data
