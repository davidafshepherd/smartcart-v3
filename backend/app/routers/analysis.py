import random
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.db_models import Food
from app.schemas.analysis import (
    Box,
    BoxGroup,
    BoxRequest,
    ComputeNutritionRequest,
    ComputeNutritionResponse,
    FoodMass,
    FoodNutrition,
    FoodVolume,
    MealNutrition,
    Mask,
    OWLv2Request, 
    OWLv2Response,
    OWLv2SAHIRequest,
    PointsRequest,
    SAM2Response,
)

# Create a new API router to group analysis-related endpoints.
router = APIRouter()


# POST endpoint to compute boxes bounding foods with OWLv2.
@router.post("/owlv2", status_code=status.HTTP_200_OK)
async def owlv2_detect(request: OWLv2Request) -> OWLv2Response:
    """Runs OWLv2 object detection.
    
    Args:
        request: The OWLv2 request with image paths, threshold, and foods list.
        
    Returns:
        OWLv2Response containing detected bounding boxes and corresponding food names.
    """
    # TODO: Implement OWLv2 inference
    # For now, return dummy data grouped by food_id
    before_box_groups = []
    after_box_groups = []
    
    # Assume image dimensions are roughly 1920x1080 for dummy data
    img_width = 1920
    img_height = 1080
    
    # Generate 1-2 dummy boxes per food in before image
    for i, food_id in enumerate(request.foods):
        # Place boxes at different positions for each food
        x_offset = (i * 200) % (img_width - 300)
        y_offset = (i * 150) % (img_height - 200)
        
        boxes = []
        # First box for this food
        boxes.append(Box(
            x1=float(x_offset),
            y1=float(y_offset),
            x2=float(x_offset + 200),
            y2=float(y_offset + 150)
        ))
        
        # Sometimes add a second box
        if i % 2 == 0:
            boxes.append(Box(
                x1=float((x_offset + 250) % (img_width - 200)),
                y1=float((y_offset + 180) % (img_height - 150)),
                x2=float((x_offset + 250) % (img_width - 200) + 200),
                y2=float((y_offset + 180) % (img_height - 150) + 150)
            ))
        
        before_box_groups.append(BoxGroup(food_id=food_id, boxes=boxes))
    
    # Generate fewer boxes for after image (simulating consumption)
    for i, food_id in enumerate(request.foods):
        if i % 2 == 0:  # Only half the foods have boxes in after image
            x_offset = (i * 200) % (img_width - 300)
            y_offset = (i * 150) % (img_height - 200)
            boxes = [Box(
                x1=float(x_offset),
                y1=float(y_offset),
                x2=float(x_offset + 180),  # Slightly smaller (consumed)
                y2=float(y_offset + 130)
            )]
            after_box_groups.append(BoxGroup(food_id=food_id, boxes=boxes))
    
    return OWLv2Response(
        before_boxes=before_box_groups,
        after_boxes=after_box_groups
    )


# POST endpoint to compute boxes bounding foods with OWLv2 and SAHI.
@router.post("/owlv2/sahi", status_code=status.HTTP_200_OK)
async def owlv2_sahi_detect(request: OWLv2SAHIRequest) -> OWLv2Response:
    """Runs OWLv2 object detection with SAHI (Slicing Aided Hyper Inference).
    
    Args:
        request: The OWLv2+SAHI request with image paths, threshold, IOU threshold, and foods list.
        
    Returns:
        OWLv2Response containing detected bounding boxes and corresponding food names.
    """
    # TODO: Implement OWLv2+SAHI inference
    # For now, return dummy data (similar to OWLv2 but with potentially more boxes due to SAHI)
    before_box_groups = []
    after_box_groups = []
    
    # Assume image dimensions are roughly 1920x1080 for dummy data
    img_width = 1920
    img_height = 1080
    
    # SAHI typically detects more boxes, so generate 2-3 boxes per food
    for i, food_id in enumerate(request.foods):
        x_offset = (i * 200) % (img_width - 300)
        y_offset = (i * 150) % (img_height - 200)
        
        boxes = []
        # First box
        boxes.append(Box(
            x1=float(x_offset),
            y1=float(y_offset),
            x2=float(x_offset + 200),
            y2=float(y_offset + 150)
        ))
        
        # Second box
        boxes.append(Box(
            x1=float((x_offset + 250) % (img_width - 200)),
            y1=float((y_offset + 180) % (img_height - 150)),
            x2=float((x_offset + 250) % (img_width - 200) + 200),
            y2=float((y_offset + 180) % (img_height - 150) + 150)
        ))
        
        # Third box for some foods
        if i % 3 == 0:
            boxes.append(Box(
                x1=float((x_offset + 100) % (img_width - 200)),
                y1=float((y_offset + 250) % (img_height - 150)),
                x2=float((x_offset + 100) % (img_width - 200) + 180),
                y2=float((y_offset + 250) % (img_height - 150) + 130)
            ))
        
        # Use the actual food_id from the request
        before_box_groups.append(BoxGroup(food_id=food_id, boxes=boxes))
    
    # Generate boxes for after image
    for i, food_id in enumerate(request.foods):
        if i % 2 == 0:
            x_offset = (i * 200) % (img_width - 300)
            y_offset = (i * 150) % (img_height - 200)
            boxes = [Box(
                x1=float(x_offset),
                y1=float(y_offset),
                x2=float(x_offset + 180),
                y2=float(y_offset + 130)
            )]
            after_box_groups.append(BoxGroup(food_id=food_id, boxes=boxes))
    
    return OWLv2Response(
        before_boxes=before_box_groups,
        after_boxes=after_box_groups
    )


# POST endpoint to compute food masks with points.
@router.post("/sam2/points", status_code=status.HTTP_200_OK)
async def sam2_points(request: PointsRequest) -> SAM2Response:
    """Runs SAM2 inference using point groups.
    
    Args:
        request: The points request with image paths and point groups.
        
    Returns:
        SAM2Response containing generated masks (one mask per food).
    """
    # TODO: Implement SAM2 inference with points
    # For now, return dummy masks (one per food)
    before_masks = []
    after_masks = []
    
    # Generate dummy masks for before image (one per food)
    # Use a standard mask size - will be scaled to match actual image dimensions
    mask_width = 640
    mask_height = 480
    
    for point_group in request.before_points:
        mask_data = []
        if point_group.points:
            first_point = point_group.points[0]
            # Scale point coordinates to mask dimensions (assuming image is roughly 1000-2000px)
            # For dummy, place circle at proportional position
            cx = int((first_point.x / 1500.0) * mask_width) if first_point.x > 0 else mask_width // 2
            cy = int((first_point.y / 1500.0) * mask_height) if first_point.y > 0 else mask_height // 2
            cx = max(50, min(mask_width - 50, cx))  # Clamp to valid range
            cy = max(50, min(mask_height - 50, cy))
            radius = 60  # Fixed radius for dummy mask
            
            for y in range(mask_height):
                row = []
                for x in range(mask_width):
                    dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                    row.append(1 if dist < radius else 0)
                mask_data.append(row)
        else:
            # Empty mask if no points
            mask_data = [[0] * mask_width for _ in range(mask_height)]
        
        before_masks.append(Mask(
            food_id=point_group.food_id,
            mask_data=mask_data
        ))
    
    # Generate dummy masks for after image (if any points)
    for point_group in request.after_points:
        mask_data = []
        if point_group.points:
            first_point = point_group.points[0]
            cx = int((first_point.x / 1500.0) * mask_width) if first_point.x > 0 else mask_width // 2
            cy = int((first_point.y / 1500.0) * mask_height) if first_point.y > 0 else mask_height // 2
            cx = max(50, min(mask_width - 50, cx))
            cy = max(50, min(mask_height - 50, cy))
            radius = 60
            
            for y in range(mask_height):
                row = []
                for x in range(mask_width):
                    dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                    row.append(1 if dist < radius else 0)
                mask_data.append(row)
        else:
            mask_data = [[0] * mask_width for _ in range(mask_height)]
        
        after_masks.append(Mask(
            food_id=point_group.food_id,
            mask_data=mask_data
        ))
    
    return SAM2Response(before_masks=before_masks, after_masks=after_masks)


# POST endpoint to compute food masks with boxes.
@router.post("/sam2/boxes", status_code=status.HTTP_200_OK)
async def sam2_boxes(request: BoxRequest) -> SAM2Response:
    """Runs SAM2 inference using bounding boxes.
    
    Args:
        request: The box request with image paths and bounding boxes.
        
    Returns:
        SAM2Response containing generated masks.
    """
    # TODO: Implement SAM2 inference with boxes
    # For now, return dummy masks based on boxes
    before_masks = []
    after_masks = []
    
    # Generate dummy masks for before image (one per box)
    # Use a standard mask size - will be scaled to match actual image dimensions
    mask_width = 640
    mask_height = 480
    
    for box_group in request.before_boxes:
        # Combine all boxes for this food into a single mask
        # Initialize mask with all zeros
        mask_data = [[0] * mask_width for _ in range(mask_height)]
        
        # For each box in the group, mark the pixels as 1 (OR operation)
        for box in box_group.boxes:
            # Scale box coordinates to mask dimensions (assuming image is roughly 1920x1080)
            x1 = int((box.x1 / 1920.0) * mask_width) if box.x1 > 0 else 0
            y1 = int((box.y1 / 1080.0) * mask_height) if box.y1 > 0 else 0
            x2 = int((box.x2 / 1920.0) * mask_width) if box.x2 > 0 else mask_width
            y2 = int((box.y2 / 1080.0) * mask_height) if box.y2 > 0 else mask_height
            
            # Clamp to valid range
            x1 = max(0, min(mask_width - 1, x1))
            y1 = max(0, min(mask_height - 1, y1))
            x2 = max(0, min(mask_width, x2))
            y2 = max(0, min(mask_height, y2))
            
            # Mark pixels in this box as 1
            for y in range(y1, y2):
                for x in range(x1, x2):
                    mask_data[y][x] = 1
        
        # Add single combined mask for this food
        before_masks.append(Mask(
            food_id=box_group.food_id,
            mask_data=mask_data
        ))
    
    # Generate dummy masks for after image (if any boxes)
    for box_group in request.after_boxes:
        # Combine all boxes for this food into a single mask
        # Initialize mask with all zeros
        mask_data = [[0] * mask_width for _ in range(mask_height)]
        
        # For each box in the group, mark the pixels as 1 (OR operation)
        for box in box_group.boxes:
            # Scale box coordinates to mask dimensions
            x1 = int((box.x1 / 1920.0) * mask_width) if box.x1 > 0 else 0
            y1 = int((box.y1 / 1080.0) * mask_height) if box.y1 > 0 else 0
            x2 = int((box.x2 / 1920.0) * mask_width) if box.x2 > 0 else mask_width
            y2 = int((box.y2 / 1080.0) * mask_height) if box.y2 > 0 else mask_height
            
            # Clamp to valid range
            x1 = max(0, min(mask_width - 1, x1))
            y1 = max(0, min(mask_height - 1, y1))
            x2 = max(0, min(mask_width, x2))
            y2 = max(0, min(mask_height, y2))
            
            # Mark pixels in this box as 1
            for y in range(y1, y2):
                for x in range(x1, x2):
                    mask_data[y][x] = 1
        
        # Add single combined mask for this food
        after_masks.append(Mask(
            food_id=box_group.food_id,
            mask_data=mask_data
        ))
    
    return SAM2Response(before_masks=before_masks, after_masks=after_masks)


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

def _calculate_volumes(
    before_depth_path: str,
    after_depth_path: str,
    before_masks: List[Mask],
    after_masks: List[Mask],
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
