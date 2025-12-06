from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Tuple
from pathlib import Path
from datetime import date, time
import shutil
import json

from app.db import get_db
from app.schemas import CreateMealRequest
from app.models.db_models import Meal, Patient, MenuItem
from app.constants import (
    BACKEND_DIR,
    UPLOAD_DIR,
    IMAGES_DIR,
    METADATA_FILENAME,
    RGB_FILENAME,
    DEPTH_FILENAME,
)


# Create a new API router to group meal-related endpoints
router = APIRouter()


# GET endpoint to retrieve all meals.
@router.get("/", status_code=status.HTTP_200_OK)
def get_meals(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieves all meals organized by patient, date, and time.

    Fetches all meal records and organizes them hierarchically:
    patient_id -> date -> start_time-end_time -> meal data

    Args:
        db: SQLAlchemy database session.

    Returns:
        A nested dictionary organizing meals by patient, date, and time range.
    """
    meals = db.query(Meal).all()
    result: Dict[str, Any] = {}

    for meal in meals:
        patient_id_str = str(meal.patient_id)
        date_str = meal.date.isoformat()
        time_range = f"{meal.start_time.strftime('%H:%M')}-{meal.end_time.strftime('%H:%M')}"

        if patient_id_str not in result:
            result[patient_id_str] = {}

        if date_str not in result[patient_id_str]:
            result[patient_id_str][date_str] = {}

        # Get menu item info.
        menu_item_data = None
        if meal.menu_item:
            menu_item_data = {
                "id": meal.menu_item.id,
                "name": meal.menu_item.name,
                "ingredients": meal.menu_item.ingredients,
            }

        result[patient_id_str][date_str][time_range] = {
            "id": meal.id,
            "date": date_str,
            "start_time": meal.start_time.strftime('%H:%M'),
            "end_time": meal.end_time.strftime('%H:%M'),
            "before_weight": meal.before_weight,
            "after_weight": meal.after_weight,
            "before_rgb_path": meal.before_rgb_path,
            "before_depth_path": meal.before_depth_path,
            "after_rgb_path": meal.after_rgb_path,
            "after_depth_path": meal.after_depth_path,
            "patient_id": meal.patient_id,
            "menu_item": menu_item_data,
        }

    return result


# POST endpoint to create a new meal.
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_meal(
    request: CreateMealRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Creates a new meal from two matched snapshots.

    Takes a before snapshot and after snapshot, validates them, moves images
    to permanent storage, and creates a meal record.

    Args:
        request: The request containing upload_id, before_entry_id, 
            after_entry_id, and menu_item_id.
        db: SQLAlchemy database session.

    Returns:
        A dictionary containing the created meal's data.

    Raises:
        HTTPException: If validation fails or entries don't exist.
    """
    # Get the upload directory.
    upload_directory = _get_upload_directory(request.upload_id)
    
    # Get the before and after entry directories.
    before_path = upload_directory / request.before_entry_id
    after_path = upload_directory / request.after_entry_id

    # Validate paths exist.
    if not before_path.exists() or not before_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Before entry '{request.before_entry_id}' not found.",
        )

    if not after_path.exists() or not after_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"After entry '{request.after_entry_id}' not found.",
        )

    # Load metadata from both entries.
    before_metadata = _load_metadata(before_path)
    after_metadata = _load_metadata(after_path)

    # Validate that both entries have the same patient_id.
    if before_metadata["patient_id"] != after_metadata["patient_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Before and after snapshots must have the same patient ID.",
        )

    # Validate that both entries have the same date.
    if before_metadata["date"] != after_metadata["date"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Before and after snapshots must have the same date.",
        )

    # Validate that the menu item exists.
    menu_item = db.query(MenuItem).filter(MenuItem.id == request.menu_item_id).first()
    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item {request.menu_item_id} not found.",
        )

    # Ensure patient exists or create them.
    patient_id = before_metadata["patient_id"]
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        patient = Patient(id=patient_id)
        db.add(patient)
        db.commit()
        db.refresh(patient)

    # Create meal directory and move images.
    meal_date = before_metadata["date"]
    start_time = before_metadata["time"]
    end_time = after_metadata["time"]

    meal_dir_name = f"{patient_id}_{meal_date}_{start_time.replace(':', '')}"
    meal_dir = IMAGES_DIR / meal_dir_name
    meal_dir.mkdir(parents=True, exist_ok=True)

    # Copy images to meal directory.
    before_rgb_dest = meal_dir / f"before_{RGB_FILENAME}"
    before_depth_dest = meal_dir / f"before_{DEPTH_FILENAME}"
    after_rgb_dest = meal_dir / f"after_{RGB_FILENAME}"
    after_depth_dest = meal_dir / f"after_{DEPTH_FILENAME}"

    shutil.copy(before_path / RGB_FILENAME, before_rgb_dest)
    shutil.copy(before_path / DEPTH_FILENAME, before_depth_dest)
    shutil.copy(after_path / RGB_FILENAME, after_rgb_dest)
    shutil.copy(after_path / DEPTH_FILENAME, after_depth_dest)

    # Create the meal record.
    new_meal = Meal(
        date=date.fromisoformat(meal_date),
        start_time=time.fromisoformat(start_time),
        end_time=time.fromisoformat(end_time),
        before_weight=before_metadata["weight"],
        after_weight=after_metadata["weight"],
        before_rgb_path=str(before_rgb_dest.relative_to(BACKEND_DIR)),
        before_depth_path=str(before_depth_dest.relative_to(BACKEND_DIR)),
        after_rgb_path=str(after_rgb_dest.relative_to(BACKEND_DIR)),
        after_depth_path=str(after_depth_dest.relative_to(BACKEND_DIR)),
        patient_id=patient_id,
        menu_item_id=request.menu_item_id,
    )
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)

    # Delete the used entries from the upload.
    shutil.rmtree(before_path)
    shutil.rmtree(after_path)

    return {
        "id": new_meal.id,
        "date": new_meal.date.isoformat(),
        "start_time": new_meal.start_time.strftime('%H:%M'),
        "end_time": new_meal.end_time.strftime('%H:%M'),
        "before_weight": new_meal.before_weight,
        "after_weight": new_meal.after_weight,
        "patient_id": new_meal.patient_id,
        "menu_item_id": new_meal.menu_item_id,
    }


# DELETE endpoint to delete a meal.
@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, db: Session = Depends(get_db)) -> None:
    """Deletes a meal.

    Removes a meal record and its associated images from storage.

    Args:
        meal_id: The ID of the meal to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the meal does not exist.
    """
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal {meal_id} not found.",
        )

    # Delete associated images.
    for path_str in [
        meal.before_rgb_path,
        meal.before_depth_path,
        meal.after_rgb_path,
        meal.after_depth_path,
    ]:
        image_path = BACKEND_DIR / path_str
        if image_path.exists():
            image_path.unlink()

    # Try to delete the meal directory if empty.
    if meal.before_rgb_path:
        meal_dir = (BACKEND_DIR / meal.before_rgb_path).parent
        if meal_dir.exists() and not any(meal_dir.iterdir()):
            meal_dir.rmdir()

    # Delete the meal record.
    db.delete(meal)
    db.commit()


# === Helpers ===

def _get_upload_directory(upload_id: str) -> Path:
    """Gets an upload directory.

    Args:
        upload_id: Name of the upload directory.

    Returns:
        Path to the upload directory.

    Raises:
        HTTPException: If the upload directory does not exist.
    """

    # Store the path to the upload directory.
    upload_directory = UPLOAD_DIR / upload_id

    # Check if the upload directory exists.
    if not upload_directory.exists() or not upload_directory.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload directory '{upload_id}' not found.",
        )

    return upload_directory


def _load_metadata(folder: Path) -> Dict[str, Any]:
    """Loads metadata from a snapshot folder.

    Args:
        folder: The folder containing the metadata file.

    Returns:
        A dictionary with patient_id, date, time, and weight.

    Raises:
        HTTPException: If the metadata is missing or invalid.
    """
    metadata_path = folder / METADATA_FILENAME

    if not metadata_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing metadata in '{folder.name}'.",
        )

    try:
        with metadata_path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        return {
            "patient_id": int(data["patient_id"]),
            "date": str(data["date"]),
            "time": str(data["time"]),
            "weight": float(data["weight"]),
        }
    except (json.JSONDecodeError, KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid metadata in '{folder.name}'.",
        )
