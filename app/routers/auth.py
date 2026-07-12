from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.database import get_db
from app.utils.auth import get_current_user, get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, Token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Client = Depends(get_db)):
    """Register a new employee account (role defaults to Employee)."""
    if db.table("users").select("id").eq("email", user_in.email).execute().data:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    if user_in.department_id is not None:
        if not db.table("departments").select("id").eq("id", user_in.department_id).execute().data:
            raise HTTPException(status_code=400, detail=f"Department {user_in.department_id} does not exist.")

    resp = db.table("users").insert({
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": get_password_hash(user_in.password),
        "department_id": user_in.department_id,
        "role": "Employee",
        "status": "active",
    }).execute()

    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to register user.")
    return resp.data[0]


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Client = Depends(get_db)):
    """Authenticate and receive a JWT token."""
    resp = db.table("users").select("*").eq("email", login_data.email).execute()
    if not resp.data:
        raise HTTPException(status_code=401, detail="Incorrect email or password",
                            headers={"WWW-Authenticate": "Bearer"})
    user = resp.data[0]
    if not verify_password(login_data.password, user.get("hashed_password")):
        raise HTTPException(status_code=401, detail="Incorrect email or password",
                            headers={"WWW-Authenticate": "Bearer"})
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="User account is deactivated.")

    access_token = create_access_token(data={"sub": user.get("email")})
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user
