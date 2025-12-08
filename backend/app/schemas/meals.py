from datetime import date, time
from typing import Optional

from pydantic import BaseModel

from app.schemas.menu import MenuItemResponse
from app.schemas.patients import PatientResponse


class MealResponse(BaseModel):
    """Response schema for retrieving a meal."""
    id: int
    date: date
    start_time: time
    end_time: time
    before_weight: float
    after_weight: float
    before_rgb_path: str
    before_depth_path: str
    after_rgb_path: str
    after_depth_path: str
    patient: PatientResponse
    menu_item: MenuItemResponse

    class Config:
        from_attributes = True


class CreateMealRequest(BaseModel):
    """Request schema for creating a new meal."""
    before_snapshot_id: int
    after_snapshot_id: int
    menu_item_id: int


class UpdateMealRequest(BaseModel):
    """Request schema for updating a meal."""
    patient_id: Optional[int] = None
    menu_item_id: Optional[int] = None
