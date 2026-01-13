from typing import List, Optional

from pydantic import BaseModel


class SAM3AutomatedRequest(BaseModel):
    """Request schema for SAM3 automated segmentation."""
    before_rgb_path: str
    after_rgb_path: str
    confidence_threshold: float = 0.5
    foods: List[int]


class SAM3AssistedTextRequest(BaseModel):
    """Request schema for SAM3 inference with a text prompt."""
    before_rgb_path: str
    after_rgb_path: str
    confidence_threshold: float = 0.5
    food_id: int
    text_prompt: str


class Point(BaseModel):
    """A 2D point on an image."""
    label: int
    x: float
    y: float


class SAM3AssistedPointsRequest(BaseModel):
    """Request schema for SAM3 inference with points."""
    before_rgb_path: str
    after_rgb_path: str
    before_points: Optional[List[Point]] = None
    after_points: Optional[List[Point]] = None


class FoodMask(BaseModel):
    """A segmentation mask for a food item."""
    food_id: Optional[int] = None
    mask: List[List[int]]


class SAM3Warning(BaseModel):
    """A warning message from SAM3 inference."""
    food_id: int
    food_name: str
    message: str


class SAM3Response(BaseModel):
    """Response schema from SAM3 inference."""
    before_masks: List[FoodMask]
    after_masks: List[FoodMask]
    warnings: List[SAM3Warning] = []


class ComputeNutritionRequest(BaseModel):
    """Request schema for nutrition computation."""
    before_depth_path: str
    after_depth_path: str
    before_masks: List[FoodMask]
    after_masks: List[FoodMask]


class FoodVolume(BaseModel):
    """Volume (cm^3) consumed for a specific food."""
    food_id: int
    volume: float


class FoodMass(BaseModel):
    """Mass (g) consumed for a specific food."""
    food_id: int
    mass: float


class MealNutrition(BaseModel):
    """Nutrition values for an entire meal."""
    mass: float
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


class FoodNutrition(BaseModel):
    """Nutrition values for a specific food."""
    food_id: int
    mass: float
    food_name: str
    short_name: str
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


class ComputeNutritionResponse(BaseModel):
    """Response schema from nutrition computation."""
    meal_nutrition: MealNutrition
    food_nutrition: List[FoodNutrition]
