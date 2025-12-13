from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.db_models import Food
from app.schemas import FoodBriefResponse, FoodResponse


# Create a new API router to group food-related endpoints.
router = APIRouter()


# GET endpoint to retrieve all foods matching a search criteria.
@router.get("/", status_code=status.HTTP_200_OK)
def get_foods(
    term: Optional[str] = Query(None, description="Search term"),
    limit: int = Query(50, ge=1, le=200, description="Search limit"),
    db: Session = Depends(get_db),
) -> List[FoodBriefResponse]:
    """Retrieves all foods matching a search criteria.

    Args:
        term: Optional search term to filter the foods by.
        limit: Search limit to limit the number of results returned.
        db: SQLAlchemy database session.

    Returns:
        A list of all foods matching the search criteria.
    """

    # Fetch all foods.
    foods = db.query(Food)

    # Filter foods by search term if requested.
    if search:
        query = query.filter(Food.food_name.ilike(f"%{search}%"))

    # Order foods by food name and limit results.
    foods = query.order_by(Food.food_name).limit(limit).all()

    # Return a list of the foods.
    return [
        FoodShortResponse(
            id=food.id,
            food_name=food.food_name,
            kcal=food.kcal,
            protein=food.protein,
            fat=food.fat,
            carbohydrate=food.carbohydrate,
        )
        for food in foods
    ]


# GET endpoint to retrieve a single food.
@router.get("/{food_id}", status_code=status.HTTP_200_OK)
def get_food(food_id: int, db: Session = Depends(get_db)) -> FoodResponse:
    """Retrieves a single food by ID.

    Args:
        food_id: The ID of the food to retrieve.
        db: SQLAlchemy database session.

    Returns:
        The food with the specified ID.

    Raises:
        HTTPException: If the food does not exist.
    """

    # Fetch the food.
    food = db.query(Food).filter(Food.id == food_id).first()

    # Check if the food exists.
    if food is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food {food_id} not found.",
        )

    # Return the food.
    return FoodResponse(
        id=food.id,
        food_name=food.food_name,
        density=food.density,
        kcal=food.kcal,
        kj=food.kj,
        protein=food.protein,
        fat=food.fat,
        carbohydrate=food.carbohydrate,
        sugar=food.sugar,
        fibre=food.fibre,
        saturated_fat=food.saturated_fat,
        sodium=food.sodium,
        potassium=food.potassium,
        calcium=food.calcium,
        magnesium=food.magnesium,
        phosphorus=food.phosphorus,
        iron=food.iron,
        copper=food.copper,
        zinc=food.zinc,
        selenium=food.selenium,
        iodine=food.iodine,
        retinol=food.retinol,
        carotene=food.carotene,
        vitamin_d=food.vitamin_d,
        vitamin_e=food.vitamin_e,
        vitamin_k1=food.vitamin_k1,
        thiamin=food.thiamin,
        riboflavin=food.riboflavin,
        niacin=food.niacin,
        vitamin_b6=food.vitamin_b6,
        vitamin_b12=food.vitamin_b12,
        folate=food.folate,
        vitamin_c=food.vitamin_c,
    )
