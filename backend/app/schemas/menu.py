from typing import List, Optional

from pydantic import BaseModel

from .foods import FoodBriefResponse


class MenuItemResponse(BaseModel):
    """Response schema for retrieving a menu item."""
    id: int
    name: str
    foods: List[FoodResponse]


class CreateMenuItemRequest(BaseModel):
    """Request schema for creating a new menu item."""
    name: str
    food_ids: List[int]


class UpdateMenuItemRequest(BaseModel):
    """Request schema for updating a menu item."""
    name: Optional[str] = None
    food_ids: Optional[List[int]] = None
