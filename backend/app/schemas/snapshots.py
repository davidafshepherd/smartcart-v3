from pydantic import BaseModel
from datetime import date, time
from typing import List


class MealSnapshotResponse(BaseModel):
    """Response schema for a meal snapshot."""
    id: int
    upload_id: str
    folder: str
    date: date
    time: time
    patient_id: int
    weight: float
    rgb_path: str
    depth_path: str

    class Config:
        from_attributes = True


class InvalidSnapshotResponse(BaseModel):
    """Response schema for an invalid meal snapshot."""
    folder: str
    error: str

class UploadResponse(BaseModel):
    """Response schema for an uploaded ZIP file."""
    upload_id: str
    meal_snapshots: List[MealSnapshotResponse]
    invalid_snapshots: List[InvalidSnapshotResponse]
