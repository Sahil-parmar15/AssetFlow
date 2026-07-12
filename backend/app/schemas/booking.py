from datetime import datetime
from pydantic import BaseModel


class BookingCreate(BaseModel):
    asset_id: int
    start_time: datetime
    end_time: datetime


class BookingResponse(BaseModel):
    id: int
    asset_id: int
    booked_by: int
    start_time: str
    end_time: str
    status: str

    model_config = {"from_attributes": True}
