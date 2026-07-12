from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(..., examples=["securepass123"])


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
