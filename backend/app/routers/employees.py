from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_db
from app.dependencies import require_admin
from app.utils.auth import get_current_user
from app.schemas.user import UserResponse
from app.schemas.employee import EmployeeRoleUpdate

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=List[UserResponse])
def list_employees(
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all employees with optional filters by department_id and status."""
    query = db.table("users").select("*")
    if department_id is not None:
        query = query.eq("department_id", department_id)
    if status is not None:
        query = query.eq("status", status)
    return query.execute().data


@router.patch("/{employee_id}/role", response_model=UserResponse)
def update_employee_role(
    employee_id: int,
    role_in: EmployeeRoleUpdate,
    db: Client = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Promote an employee to DepartmentHead or AssetManager. Admin only."""
    if role_in.role not in ["DepartmentHead", "AssetManager"]:
        raise HTTPException(status_code=400, detail="Role must be 'DepartmentHead' or 'AssetManager'")
    if not db.table("users").select("id").eq("id", employee_id).execute().data:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db.table("users").update({"role": role_in.role}).eq("id", employee_id).execute().data[0]
