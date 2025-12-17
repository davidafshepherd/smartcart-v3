import random
from typing import Dict, List, Tuple

from fastapi import APIRouter, Depends, HTTPException, status
from PIL import Image
from sqlalchemy.orm import Session

from app.constants import BACKEND_DIR
from app.db import get_db
from app.models.db_models import Food
from app.schemas.analysis import (
    ComputeNutritionRequest,
    ComputeNutritionResponse,
    FoodMass,
    FoodMask,
    FoodNutrition,
    FoodVolume,
    MealNutrition,
    SAM3AutomatedRequest,
    SAM3AssistedPointsRequest,
    SAM3AssistedTextRequest,
    SAM3Response,
)


# Create a new API router to group analysis-related endpoints.
router = APIRouter()


# POST endpoint for SAM3 automated segmentation.
@router.post("/sam3/automated", status_code=status.HTTP_200_OK)
async def sam3_automated(
    request: SAM3AutomatedRequest,
    db: Session = Depends(get_db),
) -> SAM3Response:
    """Stub for SAM3 automated segmentation."""

    # Get foods.
    foods = db.query(Food).filter(Food.id.in_(request.foods)).all()
    
    # Get image dimensions.
    before_width, before_height = _get_image_dimensions(request.before_rgb_path)
    after_width, after_height = _get_image_dimensions(request.after_rgb_path)
    
    before_masks = []
    after_masks = []
    
    # Iterate over each food.
    for i, food_id in enumerate(request.foods):
        # Generate a circular dummy mask for the food in the before image.
        mask_data = _generate_dummy_circular_mask(
            before_width, 
            before_height, 
            randomize=True,
        )
        before_masks.append(FoodMask(food_id=food_id, mask=mask_data))
        
        # Generate a circular dummy mask for the food in the after image.
        if i % 2 == 0:
            mask_data = _generate_dummy_circular_mask(
                after_width, 
                after_height, 
                randomize=True,
            )
            after_masks.append(FoodMask(food_id=food_id, mask=mask_data))
    
    return SAM3Response(before_masks=before_masks, after_masks=after_masks)


# POST endpoint for SAM3 assisted segmentation with text prompt.
@router.post("/sam3/assisted/text", status_code=status.HTTP_200_OK)
async def sam3_assisted_text(
    request: SAM3AssistedTextRequest,
) -> SAM3Response:
    """Stub for SAM3 assisted segmentation with a text prompt."""

    # Get image dimensions.
    before_width, before_height = _get_image_dimensions(request.before_rgb_path)
    after_width, after_height = _get_image_dimensions(request.after_rgb_path)
    
    before_masks = []
    after_masks = []
    
    # Generate a random number of circular dummy masks (1-4) in the before image.
    num_before_masks = random.randint(1, 4)
    for i in range(num_before_masks):
        mask_data = _generate_dummy_circular_mask(
            before_width, 
            before_height, 
            randomize=True,
        )
        before_masks.append(FoodMask(food_id=None, mask=mask_data))
    
    # Generate a random number of circular dummy masks (1-4) in the after image.
    num_after_masks = random.randint(1, 4)
    for i in range(num_after_masks):
        mask_data = _generate_dummy_circular_mask(
            after_width, 
            after_height, 
            randomize=True,
        )
        after_masks.append(FoodMask(food_id=None, mask=mask_data))
    
    return SAM3Response(before_masks=before_masks, after_masks=after_masks)


# POST endpoint for SAM3 assisted segmentation with points.
@router.post("/sam3/assisted/points", status_code=status.HTTP_200_OK)
async def sam3_assisted_points(
    request: SAM3AssistedPointsRequest,
) -> SAM3Response:
    """Stub for SAM3 assisted segmentation with points."""
    
    # Get image dimensions.
    before_width, before_height = _get_image_dimensions(request.before_rgb_path)
    after_width, after_height = _get_image_dimensions(request.after_rgb_path)
    
    before_masks = []
    after_masks = []
    
    # Generate one circular dummy mask per foreground point in the before image.
    if request.before_points:
        foreground_points = [p for p in request.before_points if p.label == 1]
        for point in foreground_points:
            mask_data = _generate_dummy_circular_mask(
                before_width, 
                before_height,
                center_x=point.x, 
                center_y=point.y,
            )
            before_masks.append(FoodMask(food_id=None, mask=mask_data))
    
    # Generate one circular dummy mask per foreground point in the after image.
    if request.after_points:
        foreground_points = [p for p in request.after_points if p.label == 1]
        for point in foreground_points:
            mask_data = _generate_dummy_circular_mask(
                after_width, 
                after_height,
                center_x=point.x, 
                center_y=point.y,
            )
            after_masks.append(FoodMask(food_id=None, mask=mask_data))
    
    return SAM3Response(before_masks=before_masks, after_masks=after_masks)


# POST endpoint to compute the nutritional values of a meal.
@router.post("/compute-nutrition", status_code=status.HTTP_200_OK)
async def compute_nutrition(
    request: ComputeNutritionRequest,
    db: Session = Depends(get_db),
) -> ComputeNutritionResponse:
    """Computes the nutritional values of a meal.
    
    Args:
        request: A request containing the food masks in the before and after RGB 
            images of the meal + the before and after depth images of the meal.
        db: SQLAlchemy database session.
        
    Returns:
        The nutritional values of the meal and its foods.
    """

    # Calculate the consumed volumes of each food in the meal (stub).
    volumes = _calculate_volumes(
        request.before_depth_path,
        request.after_depth_path,
        request.before_masks,
        request.after_masks
    )
    
    # Calculate the consumed masses of each food in the meal.
    masses = _calculate_masses(volumes, db)
    
    # Calculate the nutritional values of the meal and its foods.
    meal_nutrition, food_nutrition = _calculate_nutrition(masses, db)
    
    # Return the nutritional values of the meal and its foods.
    return ComputeNutritionResponse(
        food_nutrition=food_nutrition,
        meal_nutrition=meal_nutrition,
    )


# === Helper Functions ===

def _get_image_dimensions(image_path: str) -> Tuple[int, int]:
    """Gets image dimensions from an image file."""

    full_path = BACKEND_DIR / image_path
    
    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image not found: {image_path}",
        )
    
    try:
        with Image.open(full_path) as img:
            return img.size
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read image dimensions: {str(e)}",
        )


def _generate_dummy_circular_mask(
    width: int,
    height: int,
    center_x: float = None,
    center_y: float = None,
    randomize: bool = False,
) -> List[List[int]]:
    """Generates a dummy food mask."""

    mask_data = [[0] * width for _ in range(height)]
    
    min_dim = min(width, height)
    radius = max(10, int(min_dim * 0.08))
    
    if center_x is not None and center_y is not None:
        cx = round(center_x)
        cy = round(center_y)
    elif randomize:
        margin = radius + 10
        cx = random.randint(margin, max(margin, width - margin))
        cy = random.randint(margin, max(margin, height - margin))
    else:
        cx = width // 2
        cy = height // 2
    
    radius_squared = radius * radius
    for y in range(height):
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist_squared = dx * dx + dy * dy
            if dist_squared <= radius_squared:
                mask_data[y][x] = 1
    
    return mask_data


def _calculate_volumes(
    before_depth_path: str,
    after_depth_path: str,
    before_masks: List[FoodMask],
    after_masks: List[FoodMask],
) -> List[FoodVolume]:
    """Calculates the consumed volume of each food in a meal.
    
    Currently, this is a stub that generates a random consumed volume per food.
    
    Args:
        before_depth_path: Path to the pre-meal depth image.
        after_depth_path: Path to the post-meal depth image.
        before_masks: List of food masks in the before image (1 per food).
        after_masks: List of food masks in the after image (0-1 per food).
        
    Returns:
        A list containing the consumed volume (cm^3) of each food in the meal.
    """
    
    # TODO: Implement actual volume calculation from depth images.


    # DUMMY CODE: generate a random consumed volume per food.
    volumes = []
    
    # Generate random volume for each before mask.
    before_volumes = {}
    for before_mask in before_masks:
        food_id = before_mask.food_id
        before_volume = random.uniform(100.0, 450.0)
        before_volumes[food_id] = before_volume
    
    # Generate random volume for each after mask.
    after_volumes = {}
    for after_mask in after_masks:
        food_id = after_mask.food_id
        after_volume = random.uniform(100.0, 450.0)
        after_volumes[food_id] = after_volume
    
    # Calculate consumed volume for each food.
    for food_id, before_volume in before_volumes.items():
        if food_id in after_volumes:
            # If food has an after mask, subtract the after volume from the before volume.
            after_volume = after_volumes[food_id]
            consumed_volume = before_volume - after_volume

            # If the consumed volume is negative, set it to 0.
            if consumed_volume < 0:
                consumed_volume = 0.0
        else:
            # If food has no after mask, set the consumed volume to the before volume.
            consumed_volume = before_volume
        
        # Store the consumed volume of the food.
        volumes.append(FoodVolume(food_id=food_id, volume=consumed_volume))
    
    # Return the consumed volumes of the foods.
    return volumes


def _calculate_masses(
    volumes: List[FoodVolume],
    db: Session,
) -> List[FoodMass]:
    """Calculates the consumed mass of each food in a meal.

    Computes the consumed mass (g) of each food in a meal using the food's 
    density (g/cm^3) and consumed volume (cm^3).

    Args:
        volumes: List of the consumed volume (cm^3) of each food in the meal.
        db: SQLAlchemy database session.
        
    Returns:
        A list containing the consumed mass (g) of each food in the meal.
        
    Raises:
        HTTPException: If a food doesn't exist.
    """

    # Create a list to store the consumed mass of each food in the meal.
    masses = []
    
    # Iterate over each FoodVolume object.
    for volume in volumes:
        # Fetch the food.
        food = db.query(Food).filter(Food.id == volume.food_id).first()
        
        # Check if the food exists.
        if food is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Food {volume.food_id} not found.",
            )
        
        # Calculate and store the consumed mass of the food.
        mass = volume.volume * food.density
        masses.append(FoodMass(food_id=volume.food_id, mass=mass))
    
    # Return the consumed masses of the foods.
    return masses


def _calculate_nutrition(
    masses: List[FoodMass],
    db: Session,
) -> tuple[MealNutrition, List[FoodNutrition]]:
    """Calculates the nutritional values of a meal and its foods.

    Args:
        masses: List of the consumed mass (g) of each food in the meal.
        db: SQLAlchemy database session.
        
    Returns:
        The nutritional values of the meal and a list containing the nutritional 
        values of each food in the meal.
        
    Raises:
        HTTPException: If a food doesn't exist.
    """

    # Store the names of the nutrients.
    nutrients = [
        'kcal', 'kj', 'protein', 'fat', 'carbohydrate', 'sugar', 'fibre',
        'saturated_fat', 'sodium', 'potassium', 'calcium', 'magnesium',
        'phosphorus', 'iron', 'copper', 'zinc', 'selenium', 'iodine',
        'retinol', 'carotene', 'vitamin_d', 'vitamin_e', 'vitamin_k1',
        'thiamin', 'riboflavin', 'niacin', 'vitamin_b6', 'vitamin_b12',
        'folate', 'vitamin_c',
    ]

    # Store a mapping from each food's ID to the food itself.
    food_ids = [mass.food_id for mass in masses]
    foods_dict = _fetch_foods_dict(food_ids, db)
    
    # Create a list to store the nutritional values of each food in the meal.
    food_nutrition_list = []

    # Iterate over each FoodMass object. 
    for mass in masses:
        # Store the food.
        food = foods_dict[mass.food_id]

        # Calculate and store the nutritional values of the food.
        food_nutrition = _calculate_food_nutrition(food, mass.mass, nutrients)
        food_nutrition_list.append(food_nutrition)
    
    # Calculate and store the nutritional values of the meal.
    meal_nutrition = _calculate_meal_nutrition(food_nutrition_list, nutrients)
    
    # Return the nutritional values of the meal and its foods.
    return meal_nutrition, food_nutrition_list


def _fetch_foods_dict(food_ids: List[int], db: Session) -> Dict[int, Food]:
    """Fetches a meal's foods.

    Args:
        food_ids: List of the IDs of the foods to fetch.
        db: SQLAlchemy database session.

    Returns:
        A dictionary mapping each food's ID to the food itself.

    Raises:
        HTTPException: If a food does not exist.
    """
    
    # Fetch the foods.
    foods = db.query(Food).filter(Food.id.in_(food_ids)).all()

    # Store a mapping from each food's ID to the food itself.
    foods_dict = {food.id: food for food in foods}

    # Store the IDs of any missing foods.
    missing_food_ids = set(food_ids) - set(foods_dict.keys())

    # Check if any food are missing.
    if missing_food_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Foods not found: {sorted(missing_food_ids)}",
        )

    # Return the food mapping.
    return foods_dict


def _calculate_food_nutrition(
    food: Food,
    mass: float,
    nutrients: List[str],
) -> FoodNutrition:
    """Calculates the nutritional values of a food from its consumed mass.
    
    Args:
        food: The food.
        mass: The consumed mass (g) of the food.
        nutrients: List of nutrients names.
        
    Returns:
        The nutritional values of the food.
    """

    # Store the food's consumed mass per 100g.
    mass_factor = mass / 100.0

    # Create a dictionary to store the nutritional values of the food.
    food_nutrition_dict = {'food_id': food.id, 'mass': mass}
    
    # Iterate over each nutrient in the food.
    for nutrient in nutrients:
        # Calculate and store the value of the nutrient in the food.
        value_per_100g = getattr(food, nutrient, None)
        value = None if value_per_100g is None else value_per_100g * mass_factor
        food_nutrition_dict[nutrient] = value
  
    # Return the nutritional values of the food.
    return FoodNutrition(**food_nutrition_dict)


def _calculate_meal_nutrition(
    food_nutrition_list: List[FoodNutrition],
    nutrients: List[str],
) -> MealNutrition:
    """Calculates the nutritional values of a meal from its foods.

    Args:
        food_nutrition_list: List of the nutritional values of each food.
        nutrients: List of nutrient names.

    Returns:
        The nutritional values of the meal.
    """

    # Create a dictionary to store the nutritional values of the meal.
    meal_nutrition_dict = {'mass': 0.0, **{n: 0.0 for n in nutrients}}
    
    # Create a dictionary to store how many foods contributed to each nutrient.
    nutrient_counts = {nutrient: 0 for nutrient in nutrients}
    
    # Iterate over each food in the meal.
    for food_nutrition in food_nutrition_list:
        # Update the consumed mass of the meal.
        meal_nutrition_dict['mass'] += food_nutrition.mass
        
        # Iterate over each nutrient in the food.
        for nutrient in nutrients:
            # Store the value of the nutrient in the food.
            value = getattr(food_nutrition, nutrient, None)
            
            # Update the value of the nutrient in the meal.
            if value is not None:
                meal_nutrition_dict[nutrient] += value
                nutrient_counts[nutrient] += 1
    
    # Iterate over each nutrient in the meal.
    for nutrient in nutrients:
        # Set the value of the nutrient to None if no foods contributed to it.
        if nutrient_counts[nutrient] == 0:
            meal_nutrition_dict[nutrient] = None
    
    # Return the nutritional values of the meal.
    return MealNutrition(**meal_nutrition_dict)
