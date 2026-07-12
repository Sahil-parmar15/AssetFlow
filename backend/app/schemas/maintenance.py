from typing import Optional
from pydantic import BaseModel, Field


class MaintenanceRequestCreate(BaseModel):
    asset_id: int
    issue_description: str
    priority: str = Field(..., examples=["Low", "Medium", "High"])
    photo_url: Optional[str] = None


class MaintenanceRequestResponse(BaseModel):
    id: int
    asset_id: int
    raised_by: int
    issue_description: str
    priority: str
    photo_url: Optional[str] = None
    status: str
    technician_name: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None
    rejection_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class TechnicianAssign(BaseModel):
    technician_name: str


class MaintenanceReject(BaseModel):
    rejection_reason: str
