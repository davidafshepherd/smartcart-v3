from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.db_models import NutritionReport, NutritionReportFood
from app.schemas import (
    CreateNutritionReportRequest,
    FoodNutrition,
    MealNutrition,
    NutritionReportResponse,
)


# Create a new API router to group nutrition-related endpoints.
router = APIRouter()


# GET endpoint to retrieve a single nutrition report.
@router.get("/{meal_id}", status_code=status.HTTP_200_OK)
def get_nutrition_report(
    meal_id: int,
    db: Session = Depends(get_db),
) -> NutritionReportResponse:
    """Retrieves a nutrition report for a meal.
    
    Args:
        meal_id: The ID of the meal of the nutrition report to retrieve.
        db: SQLAlchemy database session.
    
    Returns:
        The nutrition report for the specified meal.
    
    Raises:
        HTTPException: If the meal or nutrition report does not exist.
    """

    report = db.query(NutritionReport).filter(NutritionReport.meal_id == meal_id).first()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nutrition report for meal {meal_id} not found.",
        )
    
    return _report_to_response(report)

# POST endpoint to create a new nutrition report.
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_nutrition_report(
    request: CreateNutritionReportRequest,
    db: Session = Depends(get_db),
) -> NutritionReportResponse:
    """Creates a new nutrition report.
    
    Args:
        request: A request containing the ID of the nutrition report's meal, 
        the nutritional values of the nutrition report's meal and the 
        nutritional values of the nutrition report's meal's foods.
        db: SQLAlchemy database session.
    
    Returns:
        The newly created nutrition report.
    
    Raises:
        HTTPException: If the meal does not exist.
    """
    
    existing = db.query(NutritionReport).filter(NutritionReport.meal_id == request.meal_id).first()

    # Check if a report with the same meal id exists.
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A nutrition report with the same meal id already exists.",
        )
    
    report_data = request.meal_nutrition.model_dump(exclude_unset=True)
    new_report = NutritionReport(meal_id=request.meal_id, **report_data)

    db.add(new_report)
    db.flush()

    items: list[NutritionReportFood] = []
    for fn in request.food_nutrition:
        item = NutritionReportFood(
            report_meal_id=request.meal_id,
            food_id=fn.food_id,
            mass=fn.mass,
        )
        items.append(item)

    db.add_all(items)
    db.flush()
    db.commit()

    # Return the nutrition report.
    return _report_to_response(new_report)

# DELETE endpoint to delete a meal.
@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition_report(meal_id: int, db: Session = Depends(get_db)) -> None:
    """Deletes a nutrition report.

    Args:
        meal_id: The ID of the nutrition report to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the nutrition report does not exist.
    """

    # Fetch the nutrition report.
    report = db.query(NutritionReport).filter(NutritionReport.meal_id == meal_id).first()

    # Check if the meal exists.
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nutrition report for meal {meal_id} not found.",
        )

    # Delete the meal and commit the change.
    db.delete(report)
    db.commit()

def _food_to_nutrition(food_item: NutritionReportFood) -> FoodNutrition:
    food = food_item.food
    factor = food_item.mass / 100.0

    data = {
        field: (
            getattr(food, field) * factor
            if getattr(food, field) is not None
            else None
        )
        for field in FoodNutrition.model_fields
        if field not in {"food_id", "mass"}
    }

    return FoodNutrition(
        food_id=food_item.food_id,
        mass=food_item.mass,
        **data,
    )

def _report_to_response(nutrition_report: NutritionReport) -> NutritionReportResponse:
    return NutritionReportResponse(
        meal_id=nutrition_report.meal_id,
        meal_nutrition=MealNutrition.model_validate(nutrition_report, from_attributes=True),
        food_nutrition=[_food_to_nutrition(item) for item in nutrition_report.food_items]
    )