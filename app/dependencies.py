from fastapi import Depends, HTTPException, status
from app.utils.auth import get_current_user


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow only Admin role."""
    if current_user.get("role") != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return current_user


def require_asset_manager_or_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow AssetManager or Admin roles."""
    if current_user.get("role") not in ["AssetManager", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AssetManager or Admin role required",
        )
    return current_user


def require_asset_manager_or_dept_head(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow AssetManager, DepartmentHead, or Admin roles."""
    if current_user.get("role") not in ["AssetManager", "DepartmentHead", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AssetManager or DepartmentHead role required",
        )
    return current_user
