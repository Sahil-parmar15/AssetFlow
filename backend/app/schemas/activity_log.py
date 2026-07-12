from pydantic import BaseModel


class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    details: str
    created_at: str

    model_config = {"from_attributes": True}
