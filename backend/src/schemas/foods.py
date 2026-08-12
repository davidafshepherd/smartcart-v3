from typing import Optional

from pydantic import BaseModel


class FoodBriefResponse(BaseModel):
    """Response schema for retrieving a shortened food."""
    id: int
    food_name: str
    short_name: str
    kcal: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbohydrate: Optional[float] = None


class FoodResponse(BaseModel):
    """Response schema for retrieving a food."""
    id: int
    food_name: str
    short_name: str
    density: float
    kcal: Optional[float] = None
    kj: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbohydrate: Optional[float] = None
    sugar: Optional[float] = None
    fibre: Optional[float] = None
    saturated_fat: Optional[float] = None
    sodium: Optional[float] = None
    potassium: Optional[float] = None
    calcium: Optional[float] = None
    magnesium: Optional[float] = None
    phosphorus: Optional[float] = None
    iron: Optional[float] = None
    copper: Optional[float] = None
    zinc: Optional[float] = None
    selenium: Optional[float] = None
    iodine: Optional[float] = None
    retinol: Optional[float] = None
    carotene: Optional[float] = None
    vitamin_d: Optional[float] = None
    vitamin_e: Optional[float] = None
    vitamin_k1: Optional[float] = None
    thiamin: Optional[float] = None
    riboflavin: Optional[float] = None
    niacin: Optional[float] = None
    vitamin_b6: Optional[float] = None
    vitamin_b12: Optional[float] = None
    folate: Optional[float] = None
    vitamin_c: Optional[float] = None
