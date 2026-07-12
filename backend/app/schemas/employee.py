from pydantic import BaseModel, Field


class EmployeeRoleUpdate(BaseModel):
    role: str = Field(..., examples=["DepartmentHead", "AssetManager"])
