from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Jane Smith"])
    email: EmailStr = Field(..., examples=["jane@example.com"])
    department_id: Optional[int] = Field(None, examples=[1])


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, examples=["securepass123"])


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    department_id: Optional[int] = None
    role: str
    status: str

    model_config = {"from_attributes": True}
