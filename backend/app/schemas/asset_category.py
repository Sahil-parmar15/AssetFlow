from typing import Optional
from pydantic import BaseModel, Field


class AssetCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Laptops"])
    custom_fields: Optional[dict] = Field(None, examples=[{"warranty_period": "2 years"}])


class AssetCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    custom_fields: Optional[dict] = None


class AssetCategoryResponse(BaseModel):
    id: int
    name: str
    custom_fields: Optional[dict] = None

    model_config = {"from_attributes": True}
