from typing import List

from pydantic import BaseModel

from .analysis import FoodNutrition, MealNutrition


class NutritionReportResponse(BaseModel):
    """Response schema for retrieving a nutrition report."""
    id: int
    meal_nutrition: MealNutrition
    food_nutrition: List[FoodNutrition]
    meal_id: int


class CreateNutritionReportRequest(BaseModel):
    """Request schema for creating a new nutrition report."""
    meal_id: int
    meal_nutrition: MealNutrition
    food_nutrition: List[FoodNutrition]
