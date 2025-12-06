"""Pydantic schemas for menu items."""

from pydantic import BaseModel
from typing import List, Optional


class MenuItemResponse(BaseModel):
    """Response schema for a menu item."""
    id: int
    name: str
    ingredients: List[str]


class CreateMenuItemRequest(BaseModel):
    """Request schema for creating a menu item."""
    name: str
    ingredients: List[str]


class UpdateMenuItemRequest(BaseModel):
    """Request schema for updating a menu item."""
    name: Optional[str] = None
    ingredients: Optional[List[str]] = None

