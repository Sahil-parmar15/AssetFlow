from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.database import get_db
from app.dependencies import require_admin
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.post("", response_model=DepartmentResponse, status_code=201)
def create_department(dept_in: DepartmentCreate, db: Client = Depends(get_db),
                      current_user: dict = Depends(require_admin)):
    """Create a new department. Admin only."""
    if dept_in.parent_department_id is not None:
        if not db.table("departments").select("id").eq("id", dept_in.parent_department_id).execute().data:
            raise HTTPException(status_code=400, detail="Parent department does not exist.")
    if dept_in.head_id is not None:
        if not db.table("users").select("id").eq("id", dept_in.head_id).execute().data:
            raise HTTPException(status_code=400, detail="Head user does not exist.")

    resp = db.table("departments").insert({
        "name": dept_in.name,
        "parent_department_id": dept_in.parent_department_id,
        "head_id": dept_in.head_id,
        "status": "active",
    }).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create department.")
    return resp.data[0]


@router.patch("/{dept_id}", response_model=DepartmentResponse)
def edit_department(dept_id: int, dept_in: DepartmentUpdate, db: Client = Depends(get_db),
                    current_user: dict = Depends(require_admin)):
    """Update department fields. Admin only."""
    if not db.table("departments").select("id").eq("id", dept_id).execute().data:
        raise HTTPException(status_code=404, detail="Department not found")
    update_data = dept_in.model_dump(exclude_unset=True)
    if not update_data:
        return db.table("departments").select("*").eq("id", dept_id).execute().data[0]
    return db.table("departments").update(update_data).eq("id", dept_id).execute().data[0]


@router.post("/{dept_id}/deactivate", response_model=DepartmentResponse)
def deactivate_department(dept_id: int, db: Client = Depends(get_db),
                          current_user: dict = Depends(require_admin)):
    """Deactivate a department. Admin only."""
    if not db.table("departments").select("id").eq("id", dept_id).execute().data:
        raise HTTPException(status_code=404, detail="Department not found")
    return db.table("departments").update({"status": "inactive"}).eq("id", dept_id).execute().data[0]
