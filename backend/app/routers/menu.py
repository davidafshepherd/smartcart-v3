from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from typing import List
from app.schemas import MenuItemResponse, CreateMenuItemRequest, UpdateMenuItemRequest
from app.models.db_models import MenuItem, Meal


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

    menu_items = db.query(MenuItem).all()
    return [
        MenuItemResponse(id=i.id, name=i.name, ingredients=i.ingredients)
        for i in menu_items
    ]


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

    # Fetch the menu item
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    
    # Check if the menu item exists
    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item {menu_item_id} not found.",
        )
    
    # Return the menu item
    return MenuItemResponse(
        id=menu_item.id,
        name=menu_item.name,
        ingredients=menu_item.ingredients,
    )


# POST endpoint to create a new menu item.
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_menu_item(
    request: CreateMenuItemRequest,
    db: Session = Depends(get_db),
) -> MenuItemResponse:
    """Creates a new menu item.

    Args:
        request: The request containing the menu item's name and ingredients.
        db: SQLAlchemy database session.

    Returns:
        The newly created menu item.
    """

    # Create and persist the new menu item.
    new_menu_item = MenuItem(name=request.name, ingredients=request.ingredients)
    db.add(new_menu_item)
    db.commit()
    db.refresh(new_menu_item)

    # Return the newly created menu item.
    return MenuItemResponse(
        id=new_menu_item.id,
        name=new_menu_item.name,
        ingredients=new_menu_item.ingredients,
    )


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
        request: The request containing the menu item's new name / ingredients.
        db: SQLAlchemy database session.

    Returns:
        The updated menu item.

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
    if request.name is not None:
        menu_item.name = request.name
    if request.ingredients is not None:
        menu_item.ingredients = request.ingredients
    db.commit()
    db.refresh(menu_item)

    # Return the updated menu item.
    return MenuItemResponse(
        id=menu_item.id,
        name=menu_item.name,
        ingredients=menu_item.ingredients,
    )


# DELETE endpoint to delete a menu item.
@router.delete("/{menu_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    menu_item_id: int, 
    db: Session = Depends(get_db),
) -> None:
    """Deletes a menu item.

    Deletes a menu item record if the menu item is not in use by a meal.

    Args:
        menu_item_id: The ID of the menu item to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the menu item does not exist or is in use by a meal.
    """

    # Check if the menu item exists.
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item {menu_item_id} not found.",
        )

    # Check if the menu item is in use by any meal.
    in_use = db.query(Meal).filter(Meal.menu_item_id == menu_item_id).first()
    if in_use is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete menu item because it is used by a meal.",
        )

    # Delete the menu item and commit the change.
    db.delete(menu_item)
    db.commit()
