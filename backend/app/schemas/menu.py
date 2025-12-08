from typing import List, Optional

from pydantic import BaseModel


class MenuItemResponse(BaseModel):
    """Response schema for retrieving a menu item."""
    id: int
    name: str
    ingredients: List[str]


class CreateMenuItemRequest(BaseModel):
    """Request schema for creating a new menu item."""
    name: str
    ingredients: List[str]


class UpdateMenuItemRequest(BaseModel):
    """Request schema for updating a menu item."""
    name: Optional[str] = None
    ingredients: Optional[List[str]] = None
