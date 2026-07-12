from typing import Optional, List
from pydantic import BaseModel, Field


class AssetCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    category_id: int
    serial_number: Optional[str] = None
    acquisition_date: Optional[str] = None   # ISO date string e.g. "2024-01-15"
    acquisition_cost: Optional[float] = None
    condition: Optional[str] = None          # New / Good / Fair / Poor
    location: Optional[str] = None
    is_shared_bookable: bool = False
    photo_url: Optional[str] = None


class AssetResponse(BaseModel):
    id: int
    name: str
    asset_tag: str
    category_id: int
    serial_number: Optional[str] = None
    acquisition_date: Optional[str] = None
    acquisition_cost: Optional[float] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    is_shared_bookable: bool
    status: str
    photo_url: Optional[str] = None

    model_config = {"from_attributes": True}


class AssetDetailResponse(AssetResponse):
    """Extended asset view with embedded history lists."""
    allocation_history: List[dict] = []
    maintenance_history: List[dict] = []
