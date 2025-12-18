from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.db_models import Meal
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
        
    # TODO: Implement database retrieval logic here
    # This is a stub endpoint for now
    
    # Return a dummy nutrition report.
    return NutritionReportResponse(
        id=1,
        meal_id=meal_id,
        meal_nutrition=MealNutrition(
            mass=250.0,
            kcal=450.0,
            kj=1883.0,
            protein=25.0,
            fat=15.0,
            carbohydrate=50.0,
            sugar=10.0,
            fibre=5.0,
            saturated_fat=5.0,
            sodium=500.0,
            potassium=800.0,
            calcium=200.0,
            magnesium=50.0,
            phosphorus=300.0,
            iron=5.0,
            copper=0.5,
            zinc=3.0,
            selenium=30.0,
            iodine=50.0,
            retinol=100.0,
            carotene=500.0,
            vitamin_d=5.0,
            vitamin_e=10.0,
            vitamin_k1=50.0,
            thiamin=1.0,
            riboflavin=1.5,
            niacin=10.0,
            vitamin_b6=1.5,
            vitamin_b12=2.0,
            folate=200.0,
            vitamin_c=60.0,
        ),
        food_nutrition=[
            FoodNutrition(
                food_id=1,
                mass=150.0,
                kcal=250.0,
                kj=1046.0,
                protein=15.0,
                fat=8.0,
                carbohydrate=30.0,
                sugar=5.0,
                fibre=3.0,
                saturated_fat=2.0,
                sodium=300.0,
                potassium=500.0,
                calcium=100.0,
                magnesium=30.0,
                phosphorus=200.0,
                iron=3.0,
                copper=0.3,
                zinc=2.0,
                selenium=20.0,
                iodine=30.0,
                retinol=50.0,
                carotene=300.0,
                vitamin_d=3.0,
                vitamin_e=5.0,
                vitamin_k1=30.0,
                thiamin=0.5,
                riboflavin=0.8,
                niacin=5.0,
                vitamin_b6=0.8,
                vitamin_b12=1.0,
                folate=100.0,
                vitamin_c=30.0,
            ),
            FoodNutrition(
                food_id=2,
                mass=100.0,
                kcal=200.0,
                kj=837.0,
                protein=10.0,
                fat=7.0,
                carbohydrate=20.0,
                sugar=5.0,
                fibre=2.0,
                saturated_fat=3.0,
                sodium=200.0,
                potassium=300.0,
                calcium=100.0,
                magnesium=20.0,
                phosphorus=100.0,
                iron=2.0,
                copper=0.2,
                zinc=1.0,
                selenium=10.0,
                iodine=20.0,
                retinol=50.0,
                carotene=200.0,
                vitamin_d=2.0,
                vitamin_e=5.0,
                vitamin_k1=20.0,
                thiamin=0.5,
                riboflavin=0.7,
                niacin=5.0,
                vitamin_b6=0.7,
                vitamin_b12=1.0,
                folate=100.0,
                vitamin_c=30.0,
            ),
        ],
    )


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
    
    # TODO: Implement database save logic here
    # This is a stub endpoint for now
    
    # Return a dummy nutrition report.
    return NutritionReportResponse(
        id=1,
        meal_id=request.meal_id,
        meal_nutrition=request.meal_nutrition,
        food_nutrition=request.food_nutrition,
    )
