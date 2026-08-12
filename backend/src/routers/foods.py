import re
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from src.db import get_db
from src.models.db_models import Food
from src.schemas import FoodBriefResponse, FoodResponse


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

    # Create a query to fetch all foods.
    query = db.query(Food)

    # Store the individual words in the search term.
    search_words = _tokenize(term) if term else []

    if search_words:
        # Narrow down to foods containing at least one of the search words.
        query = query.filter(
            or_(*(Food.food_name.ilike(f"%{_escape_like_term(w)}%", escape="\\") for w in search_words))
        )
        candidates = query.all()

        # Rank foods by number of matched words, then by how close together the matches are.
        candidates.sort(key=lambda food: _score_food_name(food.food_name, search_words) + (food.food_name,))
        foods = candidates[:limit]
    else:
        # If no search term, order foods by food name and limit results.
        foods = query.order_by(Food.food_name).limit(limit).all()

    # Return a list of the foods.
    return [
        FoodBriefResponse(
            id=food.id,
            food_name=food.food_name,
            short_name=food.short_name,
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
        short_name=food.short_name,
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


# === Helper Functions ===

def _escape_like_term(term: str) -> str:
    """Escapes LIKE wildcard characters so they're matched literally."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _tokenize(text: str) -> List[str]:
    """Splits text into lowercase alphanumeric words."""
    return [word for word in re.split(r"[^a-z0-9]+", text.lower()) if word]


def _score_food_name(food_name: str, query_words: List[str]) -> Tuple[int, int, int]:
    """Scores a food name against the search words for ranking.

    Ranks food names with more matched words first. Among ties, ranks names 
    whose matches are more tightly clustered together rank first. Among 
    further ties, ranks names whose matches start earlier rank first.

    Args:
        food_name: The food's name to score.
        query_words: The search words to match against the food name.

    Returns:
        A tuple of the ranking components.
    """

    # Tokenize food name.
    tokens = _tokenize(food_name)

    # Find the earliest matching token's index for each search word.
    matched_indices = []
    for word in query_words:
        index = next((i for i, token in enumerate(tokens) if word in token), None)
        if index is not None:
            matched_indices.append(index)

    # Derive the ranking components: match count, cluster tightness and start position.
    matched_count = len(matched_indices)
    proximity_span = (max(matched_indices) - min(matched_indices)) if matched_count > 1 else 0
    start_offset = min(matched_indices) if matched_indices else 0

    # Return ranking components.
    return (-matched_count, proximity_span, start_offset)
