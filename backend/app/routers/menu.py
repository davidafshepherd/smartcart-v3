from fastapi import APIRouter, status, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from typing import List, Dict, Any, Optional
from app.models.db_models import MenuItem, Meal

# Create a new API router to group menu item-related endpoints
router = APIRouter()


# GET endpoint to retrieve all menu items.
@router.get("/", status_code=status.HTTP_200_OK)
def get_menu_items(
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Retrieves all menu items.

    Fetches all menu item records stored in the database and returns their IDs, 
    names and ingredients.

    Args:
        db: SQLAlchemy database session.
    
        Returns:
            A list of dictionaries, each containing a menu item's ID, name and
            ingredients.
    """

    menu_items = db.query(MenuItem).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "ingredients": item.ingredients,
        }
        for item in menu_items
    ]


# POST endpoint to create a new menu item.
@router.get("/", status_code=status.HTTP_201_CREATED)
def create_menu_item(
    name: str = Body(...),
    ingredients: List[str] = Body(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Creates a new menu item.

    Inserts a new menu item record into the database. The menu item's name and
    ingredients are provided by the client.

    Args:
        name: The human-readable name of the menu item.
        ingredients: The list of foods or ingredients that define the menu item.
        db: SQLAlchemy database session.

    Returns:
        A dictionary containing the created menu item's ID, name and 
        ingredients.
    """

    # Create and persist the new menu item.
    new_menu_item = MenuItem(name=name, ingredients=ingredients)
    db.add(new_menu_item)
    db.commit()
    db.refresh(new_menu_item)

    return {
        "id": new_menu_item.id,
        "name": new_menu_item.name,
        "ingredients": new_menu_item.ingredients,
    }


# PUT endpoint to update a menu item.
@router.put("/{menu_item_id}", status_code=status.HTTP_200_OK)
def update_menu_item(
    menu_item_id: int,
    name: Optional[str] = Body(...),
    ingredients: Optional[List[str]] = Body(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Updates a menu item.

    Updates the name and/or ingredients of an existing menu item record. The
    menu item must already exist.

    Args:
        menu_item_id: The ID of the menu item.
        name: The new name to assign to the menu item, if provided.
        ingredients: The new ingredients to assign to the menu item, if provided.
        db: SQLAlchemy database session.
    
    Returns:
        A dictionary containing the updated menu item's ID, name and 
        ingredients.

    Raises:
        HTTPException: If the menu item does not exist.
    """

    # Check if the menu item exists.
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item {menu_item_id} not found.",
        )
    
    # Update and persist the menu item.
    if name is not None:
        menu_item.name = name
    if ingredients is not None:
        menu_item.ingredients = ingredients
    db.commit()
    db.refresh(menu_item)

    return {
        "id": menu_item.id,
        "name": menu_item.name,
        "ingredients": menu_item.ingredients,
    }


# DELETE endpoint to delete a menu item.
@router.delete("/{menu_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    menu_item_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Deletes a menu item.

    Deletes a menu item record stored in the database using the given ID. The ID 
    must exist. The menu item must not be in use by a meal.
    
    Args:
        patient_id: The ID of the menu item to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the menu item does not exist or if the menu item is 
        used by one or more meals.
    """

    # Checks if the menu item exists.
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item {menu_item_id} not found.",
        )
    
    # Check if the menu item is not in use by a meal.
    in_use = db.query(Meal).filter(Meal.menu_item_id == menu_item_id).first()
    if in_use is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete menu item because it is used by a meal.",
        )
    
    # Delete the menu item and commit the change.
    db.delete(menu_item)
    db.commit()
