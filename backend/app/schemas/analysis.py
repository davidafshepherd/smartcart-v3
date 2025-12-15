from typing import List, Optional

from pydantic import BaseModel


class Point(BaseModel):
    """A 2D point on an image."""
    x: float
    y: float


class Box(BaseModel):
    """A bounding box on an image."""
    x1: float
    y1: float
    x2: float
    y2: float


class PointGroup(BaseModel):
    """A group of points for a specific food."""
    food_id: int
    points: List[Point]


class BoxGroup(BaseModel):
    """A group of boxes for a specific food."""
    food_id: int
    boxes: List[Box]


class OWLv2Request(BaseModel):
    """Request schema for OWLv2 inference."""
    before_rgb_path: str
    after_rgb_path: str
    threshold: float = 0.5
    foods: List[int]


class OWLv2SAHIRequest(BaseModel):
    """Request schema for OWLv2 with SAHI inference."""
    before_rgb_path: str
    after_rgb_path: str
    threshold: float = 0.5
    iou_threshold: float = 0.5
    foods: List[int]


class OWLv2Response(BaseModel):
    """Response schema from OWLv2 inference."""
    before_boxes: List[BoxGroup]
    after_boxes: List[BoxGroup]


class PointsRequest(BaseModel):
    """Request schema for SAM2 inference with points."""
    before_rgb_path: str
    after_rgb_path: str
    before_points: List[PointGroup]
    after_points: List[PointGroup]


class BoxRequest(BaseModel):
    """Request schema for SAM2 inference with boxes."""
    before_rgb_path: str
    after_rgb_path: str
    before_boxes: List[BoxGroup]
    after_boxes: List[BoxGroup]


class Mask(BaseModel):
    """A segmentation mask."""
    food_id: int
    mask_data: List[List[int]]


class SAM2Response(BaseModel):
    """Response schema from SAM2 inference."""
    before_masks: List[Mask]
    after_masks: List[Mask]


class ComputeNutritionRequest(BaseModel):
    """Request schema for nutrition computation."""
    before_depth_path: str
    after_depth_path: str
    before_masks: List[Mask]
    after_masks: List[Mask]


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
