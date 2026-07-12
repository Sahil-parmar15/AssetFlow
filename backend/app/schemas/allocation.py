from typing import Optional
from pydantic import BaseModel


class AllocationCreate(BaseModel):
    employee_id: Optional[int] = None
    department_id: Optional[int] = None
    expected_return_date: Optional[str] = None   # ISO date string


class AllocationResponse(BaseModel):
    id: int
    asset_id: int
    employee_id: Optional[int] = None
    department_id: Optional[int] = None
    allocated_at: str
    expected_return_date: Optional[str] = None
    returned_at: Optional[str] = None
    condition_notes: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}


class ReturnRequest(BaseModel):
    condition_notes: Optional[str] = None
