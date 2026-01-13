import random
from typing import Dict, List, Tuple

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from PIL import Image
from sqlalchemy.orm import Session

from app.constants import BACKEND_DIR
from app.db import get_db
from app.models.db_models import Food
from app.models.sam3 import (
    combine_masks,
    get_model,
    get_processor,
    mask_to_list,
    segment_with_points,
    segment_with_text_prompt,
)
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
    SAM3Warning,
)



# Create a new API router to group analysis-related endpoints.
router = APIRouter()


# POST endpoint for SAM3 automated segmentation.
@router.post("/sam3/automated", status_code=status.HTTP_200_OK)
async def sam3_automated(
    request: SAM3AutomatedRequest,
    db: Session = Depends(get_db),
) -> SAM3Response:
    """Runs SAM3 automated segmentation on before/after meal images.
    
    For each food in the meal, runs SAM3 with the food's name as a text prompt.
    All masks returned for a food are combined into a single mask.
    
    Args:
        request: Request containing image paths, food IDs, and confidence threshold.
        db: SQLAlchemy database session.
        
    Returns:
        SAM3Response containing masks for before and after images.
    """

    # Fetch foods from the database.
    foods = db.query(Food).filter(Food.id.in_(request.foods)).all()
    foods_dict = {food.id: food for food in foods}
    
    # Validate that all food IDs exist.
    missing_food_ids = set(request.foods) - set(foods_dict.keys())
    if missing_food_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Foods not found: {sorted(missing_food_ids)}",
        )
    
    # Load the before and after images.
    before_image = _load_image(request.before_rgb_path)
    after_image = _load_image(request.after_rgb_path)
    
    before_masks = []
    after_masks = []
    warnings = []
    
    # Iterate over each food.
    for food_id in request.foods:
        food = foods_dict[food_id]
        
        # Use the food's short name as the text prompt.
        prompt = food.short_name
        
        # Run SAM3 on the before image.
        masks, boxes, scores = segment_with_text_prompt(
            before_image,
            prompt,
            confidence_threshold=request.confidence_threshold,
        )
        
        # Combine all masks for this food into a single mask.
        if masks.size > 0:
            combined_mask = combine_masks(masks)
            before_masks.append(FoodMask(food_id=food_id, mask=mask_to_list(combined_mask)))
        else:
            # Add warning for missing before mask.
            warnings.append(SAM3Warning(
                food_id=food_id,
                food_name=food.short_name,
                message=f"'{food.short_name}' was not found in the before image.",
            ))
        
        # Run SAM3 on the after image.
        masks, boxes, scores = segment_with_text_prompt(
            after_image,
            prompt,
            confidence_threshold=request.confidence_threshold,
        )
        
        # Combine all masks for this food into a single mask.
        if masks.size > 0:
            combined_mask = combine_masks(masks)
            after_masks.append(FoodMask(food_id=food_id, mask=mask_to_list(combined_mask)))
    
    return SAM3Response(before_masks=before_masks, after_masks=after_masks, warnings=warnings)


# POST endpoint for SAM3 assisted segmentation with text prompt.
@router.post("/sam3/assisted/text", status_code=status.HTTP_200_OK)
async def sam3_assisted_text(
    request: SAM3AssistedTextRequest,
    db: Session = Depends(get_db),
) -> SAM3Response:
    """Runs SAM3 assisted segmentation with a text prompt on before/after images.
    
    Args:
        request: Request containing image paths, text prompt, food ID, and confidence threshold.
        db: SQLAlchemy database session.
        
    Returns:
        SAM3Response containing masks for before and after images.
    """
    
    # Fetch the food from the database.
    food = db.query(Food).filter(Food.id == request.food_id).first()
    if food is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food {request.food_id} not found.",
        )
    
    # Load the before and after images.
    before_image = _load_image(request.before_rgb_path)
    after_image = _load_image(request.after_rgb_path)
    
    before_masks = []
    after_masks = []
    warnings = []
    
    # Run SAM3 on the before image with the text prompt.
    masks, boxes, scores = segment_with_text_prompt(
        before_image,
        request.text_prompt,
        confidence_threshold=request.confidence_threshold,
    )
    
    # Add each mask to the before masks list.
    for i in range(masks.shape[0]):
        # Text prompt masks have shape (N, 1, H, W), squeeze to (H, W).
        mask = masks[i].squeeze(0)
        before_masks.append(FoodMask(food_id=None, mask=mask_to_list(mask)))
    
    # Add warning if no before masks were found.
    if len(before_masks) == 0:
        warnings.append(SAM3Warning(
            food_id=request.food_id,
            food_name=food.short_name,
            message=f"'{food.short_name}' was not found in the before image.",
        ))
    
    # Run SAM3 on the after image with the text prompt.
    masks, boxes, scores = segment_with_text_prompt(
        after_image,
        request.text_prompt,
        confidence_threshold=request.confidence_threshold,
    )
    
    # Add each mask to the after masks list.
    for i in range(masks.shape[0]):
        # Text prompt masks have shape (N, 1, H, W), squeeze to (H, W).
        mask = masks[i].squeeze(0)
        after_masks.append(FoodMask(food_id=None, mask=mask_to_list(mask)))
    
    return SAM3Response(before_masks=before_masks, after_masks=after_masks, warnings=warnings)


# POST endpoint for SAM3 assisted segmentation with points.
@router.post("/sam3/assisted/points", status_code=status.HTTP_200_OK)
async def sam3_assisted_points(
    request: SAM3AssistedPointsRequest,
) -> SAM3Response:
    """Runs SAM3 assisted segmentation with point prompts on before/after images.
    
    Uses multimask_output=True and selects the mask with the highest score.
    
    Args:
        request: Request containing image paths and point coordinates/labels.
        
    Returns:
        SAM3Response containing masks for before and after images.
    """
    
    # Load the before and after images.
    before_image = _load_image(request.before_rgb_path)
    after_image = _load_image(request.after_rgb_path)
    
    before_masks = []
    after_masks = []
    
    # Run SAM3 on the before image with points if provided.
    if request.before_points:
        # Convert points to numpy arrays.
        point_coords = np.array(
            [[p.x, p.y] for p in request.before_points],
            dtype=np.float32,
        )
        point_labels = np.array(
            [p.label for p in request.before_points],
            dtype=np.int32,
        )
        
        # Run point-based segmentation.
        masks, scores, logits = segment_with_points(
            before_image,
            point_coords,
            point_labels,
        )
        
        # Select the mask with the highest score.
        if masks.size > 0:
            best_idx = np.argmax(scores)
            best_mask = masks[best_idx]  # Shape is (H, W)
            before_masks.append(FoodMask(food_id=None, mask=mask_to_list(best_mask)))
    
    # Run SAM3 on the after image with points if provided.
    if request.after_points:
        # Convert points to numpy arrays.
        point_coords = np.array(
            [[p.x, p.y] for p in request.after_points],
            dtype=np.float32,
        )
        point_labels = np.array(
            [p.label for p in request.after_points],
            dtype=np.int32,
        )
        
        # Run point-based segmentation.
        masks, scores, logits = segment_with_points(
            after_image,
            point_coords,
            point_labels,
        )
        
        # Select the mask with the highest score.
        if masks.size > 0:
            best_idx = np.argmax(scores)
            best_mask = masks[best_idx]  # Shape is (H, W)
            after_masks.append(FoodMask(food_id=None, mask=mask_to_list(best_mask)))
    
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

def _load_image(image_path: str) -> Image.Image:
    """Loads an image.
    
    Args:
        image_path: Path to the image relative to the backend directory.
        
    Returns:
        The loaded PIL Image.
        
    Raises:
        HTTPException: If the image is not found or cannot be loaded.
    """

    # Store the complete path to the image.
    full_path = BACKEND_DIR / image_path
    
    # Check if the image exists.
    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image not found: {image_path}",
        )
    
    # Return the image as a PIL Image.
    try:
        return Image.open(full_path).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load image: {str(e)}",
        )


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
    
    
    # Load Depth Images
    before_depth = load_depth(before_depth_path)
    after_depth = load_depth(after_depth_path)


    volumes = []
    
    # Generate random volume for each before mask.
    before_volumes = {}
    for before_mask in before_masks:
        food_id = before_mask.food_id
        before_volume = volume_from_depth_and_mask(before_depth,before_mask.mask,500.0, 500.0, 320.0, 240.0, 50)
        before_volumes[food_id] = before_volume
    
    # Generate random volume for each after mask.
    after_volumes = {}
    for after_mask in after_masks:
        food_id = after_mask.food_id
        after_volume = volume_from_depth_and_mask(after_depth,after_mask.mask,500.0, 500.0, 320.0, 240.0, 50)
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
    food_nutrition_dict = {
        'food_id': food.id,
        'mass': mass,
        'food_name': food.food_name,
        'short_name': food.short_name,
    }
    
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


def load_depth(depth_path: str) -> np.ndarray:
    return cv2.imread(depth_path, cv2.IMREAD_UNCHANGED)

def mask_to_bool(
    mask_data: List[List[int]], 
    target_shape: Tuple[int, int]
) -> np.ndarray:
    """
    Convert a segmentation mask to a boolean array matching depth image shape

    Args:
        mask_data (List[List[int]]): Segmentation mask
        target_shape (Tuple[int, int]): Depth image shape

    Returns:
        np.ndarray: A 2D boolean NumPy array
"""
    
    #  Binary Segmentation mask to boolean array
    mask = np.array(mask_data, dtype=np.uint8)
     

     # Match mask shape to depth image shape
    if mask.shape != target_shape:
        mask = cv2.resize(
            mask,
            (target_shape[1], target_shape[0]),
            interpolation=cv2.INTER_NEAREST
        )

    return mask.astype(bool)


def apply_mask(
    depth: np.ndarray, 
    mask: np.ndarray
) -> np.ndarray:
    """Apply a boolean segmentation mask to a depth image

    Args:
        depth: A 2D NumPy of depth image.
        mask: A 2D boolean NumPy array where True indicates pixels to keep

    Returns:
        np.ndarray: A 2D NumPy array with depth values outside the mask set to zero
    """
    depth_masked = depth.copy()
    depth_masked[~mask] = 0
    return depth_masked

def get_3D_point_cloud(
    depth_mm: np.ndarray,
    fx: float, fy: float, cx: float, cy: float,
    min_points: int = 50
) -> np.ndarray:
    """Generate a 3D point cloud from a depth image

    Converts a depth image into a 3D point cloud
    Args:
        depth_mm: A 2D NumPy array containing depth values in millimeters
        fx: fx
        fy: fy
        cx: cx
        cy: cy
        min_points: Minimum number of valid 3D points required

    Returns:
        np.ndarray: 3D point cloud 
    """
    v_coords, u_coords = np.nonzero(depth_mm > 0)
    z_mm = depth_mm[v_coords, u_coords]

    Z = z_mm / 10.0  # mm -> cm
    X = (u_coords - cx) * Z / fx
    Y = (v_coords - cy) * Z / fy

    points = np.stack([X, Y, Z], axis=1)

    if points.shape[0] < min_points:
        raise RuntimeError(f"Not enough points: {points.shape[0]}")

    return points


def calculate_volume_cm3(
    points_cm: np.ndarray
) -> float:
    """Compute the volume enclosed by a 3D point cloud.

    Calculates the volume (in cubic centimeters) of a 3D object representedby a point cloud using its convex hull

    Args:
        points_cm: A NumPy array of shape `(N, 3)` containing 3D points in centimeters

    Returns:
        float: The volume in cubic centimeters.
    """
    hull = ConvexHull(points_cm)
    return float(hull.volume)

def volume_from_depth_and_mask(
    depth: np.ndarray,
    mask_data: List[List[int]],
    fx: float, fy: float, cx: float, cy: float,
    min_points: int = 50
) -> float:
    """Estimate food volume from a depth image and segmentation mask.

    Computes the volume of a segmented food item

    Args:
        depth: A 2D NumPy array of the depth image
        mask_data: Segmentation mask 
        fx: fx 
        fy: fy
        cx: cx
        cy: cy
        min_points: Minimum number of valid 3D points required

    Returns:
        float: Estimated volume of the segmented object in cubic centimeters
    """
    
    mask = mask_to_bool(mask_data, depth.shape)
    depth_masked = apply_mask(depth, mask)
    points = get_3D_point_cloud(depth_masked, fx, fy, cx, cy, min_points)
    return calculate_volume_cm3(points)
