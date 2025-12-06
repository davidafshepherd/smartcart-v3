"""Pydantic schemas for meals."""

from pydantic import BaseModel


class CreateMealRequest(BaseModel):
    """Request schema for creating a meal."""
    upload_id: str
    before_entry_id: str
    after_entry_id: str
    menu_item_id: int
