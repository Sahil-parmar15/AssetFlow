from pydantic import BaseModel, Field


class TransferRequestCreate(BaseModel):
    requested_to: int = Field(..., description="Employee ID to transfer the asset to")


class TransferRequestResponse(BaseModel):
    id: int
    asset_id: int
    requested_by: int
    requested_to: int
    status: str
    created_at: str

    model_config = {"from_attributes": True}
