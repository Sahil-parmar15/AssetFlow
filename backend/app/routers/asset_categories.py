from typing import List
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_db
from app.dependencies import require_admin
from app.schemas.asset_category import AssetCategoryCreate, AssetCategoryUpdate, AssetCategoryResponse

router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"])


@router.post("", response_model=AssetCategoryResponse, status_code=201)
def create_asset_category(cat_in: AssetCategoryCreate, db: Client = Depends(get_db),
                           current_user: dict = Depends(require_admin)):
    resp = db.table("asset_categories").insert({"name": cat_in.name, "custom_fields": cat_in.custom_fields}).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create asset category.")
    return resp.data[0]


@router.get("", response_model=List[AssetCategoryResponse])
def list_asset_categories(db: Client = Depends(get_db), current_user: dict = Depends(require_admin)):
    return db.table("asset_categories").select("*").execute().data


@router.get("/{cat_id}", response_model=AssetCategoryResponse)
def get_asset_category(cat_id: int, db: Client = Depends(get_db), current_user: dict = Depends(require_admin)):
    resp = db.table("asset_categories").select("*").eq("id", cat_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Asset category not found")
    return resp.data[0]


@router.patch("/{cat_id}", response_model=AssetCategoryResponse)
def update_asset_category(cat_id: int, cat_in: AssetCategoryUpdate, db: Client = Depends(get_db),
                           current_user: dict = Depends(require_admin)):
    if not db.table("asset_categories").select("id").eq("id", cat_id).execute().data:
        raise HTTPException(status_code=404, detail="Asset category not found")
    update_data = cat_in.model_dump(exclude_unset=True)
    if not update_data:
        return db.table("asset_categories").select("*").eq("id", cat_id).execute().data[0]
    return db.table("asset_categories").update(update_data).eq("id", cat_id).execute().data[0]


@router.delete("/{cat_id}", status_code=204)
def delete_asset_category(cat_id: int, db: Client = Depends(get_db), current_user: dict = Depends(require_admin)):
    if not db.table("asset_categories").select("id").eq("id", cat_id).execute().data:
        raise HTTPException(status_code=404, detail="Asset category not found")
    db.table("asset_categories").delete().eq("id", cat_id).execute()
    return None
