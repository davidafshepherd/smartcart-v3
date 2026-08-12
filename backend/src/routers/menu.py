from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db import get_db
from src.models.db_models import Food, Meal, MenuItem
from src.schemas import (
    CreateMenuItemRequest,
    FoodBriefResponse,
    MenuItemResponse,
    UpdateMenuItemRequest,
)


# Create a new API router to group menu item-related endpoints.
router = APIRouter()


# GET endpoint to retrieve all menu items.
@router.get("/", status_code=status.HTTP_200_OK)
def get_menu_items(db: Session = Depends(get_db)) -> List[MenuItemResponse]:
    """Retrieves all menu items.

    Args:
        db: SQLAlchemy database session.

    Returns:
        A list of all menu items.
    """

    # Fetch all menu items.
    menu_items = db.query(MenuItem).all()

    # Return a list of all menu items.
    return [_menu_item_to_response(item) for item in menu_items]


# GET endpoint to retrieve a single menu item.
@router.get("/{menu_item_id}", status_code=status.HTTP_200_OK)
def get_menu_item(
    menu_item_id: int,
    db: Session = Depends(get_db),
) -> MenuItemResponse:
    """Retrieves a single menu item by ID.

    Args:
        menu_item_id: The ID of the menu item to retrieve.
        db: SQLAlchemy database session.

    Returns:
        The menu item with the specified ID.

    Raises:
        HTTPException: If the menu item does not exist.
    """

    # Fetch the menu item.
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    
    # Check if the menu item exists.
    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item {menu_item_id} not found.",
        )

    # Return the menu item.
    return _menu_item_to_response(menu_item)


# POST endpoint to create a new menu item.
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_menu_item(
    request: CreateMenuItemRequest,
    db: Session = Depends(get_db),
) -> MenuItemResponse:
    """Creates a new menu item.

    Args:
        request: A request containing the menu item's name and the IDs of the 
        menu item's foods.
        db: SQLAlchemy database session.

    Returns:
        The newly created menu item.

    Raises:
        HTTPException: If the foods don't exist.
    """

    # Fetch the menu item's foods.
    foods = _fetch_foods(request.food_ids, db)

    # Create and persist the new menu item.
    new_menu_item = MenuItem(name=request.name)
    new_menu_item.foods = foods
    db.add(new_menu_item)
    db.commit()
    db.refresh(new_menu_item)

    # Return the newly created menu item.
    return _menu_item_to_response(new_menu_item)


# PUT endpoint to update a menu item.
@router.put("/{menu_item_id}", status_code=status.HTTP_200_OK)
def update_menu_item(
    menu_item_id: int,
    request: UpdateMenuItemRequest,
    db: Session = Depends(get_db),
) -> MenuItemResponse:
    """Updates a menu item.

    Args:
        menu_item_id: The ID of the menu item to update.
        request: A request containing the menu item's new name and/or foods.
        db: SQLAlchemy database session.

    Returns:
        The updated menu item.

    Raises:
        HTTPException: If the menu item or foods do not exist.
    """

    # Fetch the menu item.
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()

    # Check if the menu item exists.
    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item {menu_item_id} not found.",
        )

    # Update the menu item's name if requested.
    if request.name is not None:
        menu_item.name = request.name

    # Update the menu item's foods if requested.
    if request.food_ids is not None:
        foods = _fetch_foods(request.food_ids, db)
        menu_item.foods = foods

    # Persist the menu item.
    db.commit()
    db.refresh(menu_item)

    # Return the updated menu item.
    return _menu_item_to_response(menu_item)


# DELETE endpoint to delete a menu item.
@router.delete("/{menu_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(menu_item_id: int, db: Session = Depends(get_db)) -> None:
    """Deletes a menu item.

    Deletes a menu item record if the menu item is not in use by a meal.

    Args:
        menu_item_id: The ID of the menu item to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the menu item does not exist or is in use by a meal.
    """

    # Fetch the menu item.
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()

    # Check if the menu item exists.
    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item {menu_item_id} not found.",
        )

    # Fetch any meal using the menu item.
    in_use = db.query(Meal).filter(Meal.menu_item_id == menu_item_id).first()

    # Check if any meal is using the menu item.
    if in_use is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete menu item because it is used by a meal.",
        )

    # Delete the menu item and commit the change.
    db.delete(menu_item)
    db.commit()


# === Helpers ===

def _menu_item_to_response(menu_item: MenuItem) -> MenuItemResponse:
    """Converts a MenuItem ORM object into a MenuItemResponse Pydantic schema.

    Args:
        menu_item: The MenuItem ORM object.

    Returns:
        A MenuItemResponse Pydantic schema.
    """
    return MenuItemResponse(
        id=menu_item.id,
        name=menu_item.name,
        foods=[
            FoodBriefResponse(
                id=food.id,
                food_name=food.food_name,
                short_name=food.short_name,
                kcal=food.kcal,
                protein=food.protein,
                fat=food.fat,
                carbohydrate=food.carbohydrate,
            )
            for food in menu_item.foods
        ],
    )


def _fetch_foods(food_ids: List[int], db: Session) -> List[Food]:
    """Fetches a list of foods.

    Args:
        food_ids: List of the IDs of the foods to fetch.
        db: SQLAlchemy database session.

    Returns:
        A list of the foods.

    Raises:
        HTTPException: If a food does not exist.
    """

    # Fetch the foods.
    foods = db.query(Food).filter(Food.id.in_(food_ids)).all()

    # Store the IDs of the found foods and the IDs of the missing foods.
    found_ids = {food.id for food in foods}
    missing_ids = set(food_ids) - found_ids

    # Check if any foods are missing.
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Foods not found: {', '.join(str(id) for id in sorted(missing_ids))}",
        )
    
    # Return the foods.
    return foods
