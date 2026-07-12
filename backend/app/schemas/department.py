from typing import Optional
from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Engineering"])
    parent_department_id: Optional[int] = None
    head_id: Optional[int] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    parent_department_id: Optional[int] = None
    head_id: Optional[int] = None
    status: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    parent_department_id: Optional[int] = None
    head_id: Optional[int] = None
    status: str

    model_config = {"from_attributes": True}
