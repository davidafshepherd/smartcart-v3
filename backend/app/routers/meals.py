import shutil
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.constants import (
    BACKEND_DIR,
    DEPTH_FILENAME,
    IMAGES_DIR,
    RGB_FILENAME,
    UPLOAD_DIR,
)
from app.db import get_db
from app.models.db_models import Meal, MealSnapshot, MenuItem, Patient
from app.schemas import (
    CreateMealRequest, 
    MealResponse, 
    MenuItemResponse, 
    PatientResponse, 
    UpdateMealRequest,
)


# Create a new API router to group meal-related endpoints.
router = APIRouter()


# GET endpoint to retrieve all meals.
@router.get("/", status_code=status.HTTP_200_OK)
def get_meals(db: Session = Depends(get_db)) -> List[MealResponse]:
    """Retrieves all meals.

    Args:
        db: SQLAlchemy database session.

    Returns:
        A list of all meals.
    """

    # Fetch all meals.
    meals = db.query(Meal).all()

    # Return a list of all meals.
    return [_meal_to_response(meal) for meal in meals]


# GET endpoint to retrieve a single meal.
@router.get("/{meal_id}", status_code=status.HTTP_200_OK)
def get_meal(meal_id: int, db: Session = Depends(get_db)) -> MealResponse:
    """Retrieves a single meal by ID.

    Args:
        meal_id: The ID of the meal to retrieve.
        db: SQLAlchemy database session.

    Returns:
        The meal with the specified ID.
    
    Raises:
        HTTPException: If the meal does not exist.    
    """

    # Fetch the meal.
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    
    # Check if the meal exists.
    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal {meal_id} not found.",
        )
    
    # Return the meal.
    return _meal_to_response(meal)


# POST endpoint to create a new meal.
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_meal(
    request: CreateMealRequest,
    db: Session = Depends(get_db),
) -> MealResponse:
    """Creates a new meal from two matched meal snapshots.

    Args:
        request: A request containing the ID of the meal snapshot taken before 
            the meal was consumed, the ID of the meal snapshot taken after the 
            meal was consumed and the ID of the meal's menu item.
        db: SQLAlchemy database session.

    Returns:
        The newly created meal.

    Raises:
        HTTPException: If the meal snapshots don't exist or can't be validated
        or if a meal with the same patient ID, date, start time and end time 
        already exists.
    """

    # Fetch the before meal snapshot and the after meal snapshot.
    before_snapshot = _get_snapshot(request.before_snapshot_id, "Before", db)
    after_snapshot = _get_snapshot(request.after_snapshot_id, "After", db)
    
    # Validate the meal snapshots.
    _validate_snapshots(before_snapshot, after_snapshot)

    # Fetch any meal with the same patient ID, date and time range.
    existing = (
        db.query(Meal)
        .filter(
            Meal.patient_id == before_snapshot.patient_id,
            Meal.date == before_snapshot.date,
            Meal.start_time == before_snapshot.time,
            Meal.end_time == after_snapshot.time,
        )
        .first()
    )

     # Check if a meal with the same patient ID, date and time range exists.
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A meal with the same patient ID, date and time range already exists.",
        )

    # Fetch the meal's menu item.
    menu_item = (
        db.query(MenuItem)
        .filter(MenuItem.id == request.menu_item_id)
        .first()
    )
    
    # Check if the menu item exists.
    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item {request.menu_item_id} not found.",
        )

    # Fetch the meal's patient.
    patient = _get_patient(before_snapshot.patient_id, db)

    # Save the meal's images to permanent storage.
    image_paths = _save_images(before_snapshot, after_snapshot)

    # Create the new meal.
    new_meal = Meal(
        date=before_snapshot.date,
        start_time=before_snapshot.time,
        end_time=after_snapshot.time,
        before_weight=before_snapshot.weight,
        after_weight=after_snapshot.weight,
        before_rgb_path=image_paths["before_rgb"],
        before_depth_path=image_paths["before_depth"],
        after_rgb_path=image_paths["after_rgb"],
        after_depth_path=image_paths["after_depth"],
        patient_id=patient.id,
        menu_item_id=request.menu_item_id,
    )
    db.add(new_meal)

    # Delete the meal snapshots.
    _delete_snapshots(before_snapshot, after_snapshot, db=db)

    # Persist the new meal.
    db.commit()
    db.refresh(new_meal)

    # Return the newly created meal.
    return _meal_to_response(new_meal)


# PUT endpoint to update a meal.
@router.put("/{meal_id}", status_code=status.HTTP_200_OK)
def update_meal(
    meal_id: int,
    request: UpdateMealRequest,
    db: Session = Depends(get_db),
) -> MealResponse:
    """Updates a meal.

    Args:
        meal_id: The ID of the meal to update.
        request: A request containing the meal's new patient and/or menu item.
        db: SQLAlchemy database session.

    Returns:
        The updated meal.

    Raises:
        HTTPException: If the meal does not exist.
    """
    
    # Fetch the meal.
    meal = db.query(Meal).filter(Meal.id == meal_id).first()

    # Check if the meal exists.
    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal {meal_id} not found.",
        )
    
    # Update the meal's patient if requested.
    if request.patient_id is not None:
        patient = (
            db.query(Patient)
            .filter(Patient.id == request.patient_id)
            .first()
        )
        if patient is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient {request.patient_id} not found.",
            )
        
        # Check for duplicate meal (same patient, date and time range).
        if request.patient_id != meal.patient_id:
            existing_meal = (
                db.query(Meal)
                .filter(
                    Meal.patient_id == request.patient_id,
                    Meal.date == meal.date,
                    Meal.start_time == meal.start_time,
                    Meal.end_time == meal.end_time,
                )
                .first()
            )
            if existing_meal is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Patient {request.patient_id} already has a meal on {meal.date} from {meal.start_time} to {meal.end_time}.",
                )
        
        meal.patient_id = patient.id

    # Update the meal's menu item if requested.
    if request.menu_item_id is not None:
        menu_item = (
            db.query(MenuItem)
            .filter(MenuItem.id == request.menu_item_id)
            .first()
        )
        if menu_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Menu item {request.menu_item_id} not found.",
            )
        meal.menu_item_id = menu_item.id
    
    # Persist the meal.
    db.commit()
    db.refresh(meal)

    # Return the updated meal.
    return _meal_to_response(meal)


# DELETE endpoint to delete a meal.
@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, db: Session = Depends(get_db)) -> None:
    """Deletes a meal.

    Deletes a meal record and its associated images from disk.

    Args:
        meal_id: The ID of the meal to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the meal does not exist.
    """

    # Fetch the meal.
    meal = db.query(Meal).filter(Meal.id == meal_id).first()

    # Check if the meal exists.
    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal {meal_id} not found.",
        )
    
    # Delete the meal's images from disk.
    meal_directory = (BACKEND_DIR / meal.before_rgb_path).parent
    shutil.rmtree(meal_directory)

    # Delete the meal and commit the change.
    db.delete(meal)
    db.commit()


# === Helpers ===

def _meal_to_response(meal: Meal) -> MealResponse:
    """Converts a Meal ORM object into a MealResponse Pydantic schema.
    
    Args:
        meal: The Meal ORM object.
    
    Returns:
        A MealResponse Pydantic schema.
    """

    return MealResponse(
        id=meal.id,
        date=meal.date,
        start_time=meal.start_time,
        end_time=meal.end_time,
        before_weight=meal.before_weight,
        after_weight=meal.after_weight,
        before_rgb_path=meal.before_rgb_path,
        before_depth_path=meal.before_depth_path,
        after_rgb_path=meal.after_rgb_path,
        after_depth_path=meal.after_depth_path,
        patient=PatientResponse(id=meal.patient.id),
        menu_item=MenuItemResponse(
            id=meal.menu_item.id, 
            name=meal.menu_item.name, 
            ingredients=meal.menu_item.ingredients,
        ),
    )


def _get_snapshot(snapshot_id: int, label: str, db: Session) -> MealSnapshot:
    """Retrieves a meal snapshot by ID.

    Args:
        id: The ID of the meal snapshot to retrieve.
        label: 'Before' if the snapshot was taken before the meal was consumed.
               'After' if the snapshot was taken after the meal was consumed.
        db: SQLAlchemy database session.

    Returns:
        The meal snapshot with the specified ID.

    Raises:
        HTTPException: If the meal snapshot does not exist.
    """

    # Fetch the meal snapshot.
    snapshot = (
        db.query(MealSnapshot)
        .filter(MealSnapshot.id == snapshot_id)
        .first()
    )

    # Check if the meal snapshot exists.
    if snapshot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{label} meal snapshot {snapshot_id} not found.",
        )
    
    # Return the meal snapshot.
    return snapshot


def _validate_snapshots(before: MealSnapshot, after: MealSnapshot) -> None:
    """Validates that two meal snapshots can be matched as a meal.

    Args:
        before: The snapshot taken before the meal was consumed.
        after: The snapshot taken after the meal was consumed.

    Raises:
        HTTPException: If the meal snapshots can't be validated.    
    """

    # Check if both meal snapshots have the same patient ID.
    if before.patient_id != after.patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The meal snapshots must have the same patient ID.",
        )

    # Check if both meal snapshots have the same date.
    if before.date != after.date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The meal snapshots must have the same date.",
        )

    # Check if the before snapshot was taken before the after snapshot.
    if not (before.time < after.time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 1st snapshot must be taken before the 2nd snapshot.",
        )


def _get_patient(patient_id: int, db: Session) -> Patient:
    """Retrieves an existing patient or creates a new one.

    Args:
        patient_id: The ID of the patient to retrieve or create.
        db: SQLAlchemy database session.

    Returns:
        The retrieved or newly created patient.
    """

    # Fetch the patient.
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    # Create the patient if the patient does not exist.
    if patient is None:
        patient = Patient(id=patient_id)
        db.add(patient)
        db.flush()  # Get the patient's ID without commiting the patient.

    # Return the retrieved or newly created patient.
    return patient


def _save_images(before: MealSnapshot, after: MealSnapshot) -> Dict[str, str]:
    """Saves a meal's images to permanent storage.

    Given a meal's before and after snapshots, the meal's before and after 
    RGB/depth images are moved from the UPLOAD_DIR to the IMAGES_DIR.

    Args:
        before: The snapshot taken before the meal was consumed.
        after: The snapshot taken after the meal was consumed.

    Returns:
        A dictionary containing the paths to each image.
    """

    # Create the directory to store the meal's images.
    patient_id = str(before.patient_id)
    date = before.date.isoformat()
    start_time = before.time.strftime('%H%M')
    end_time = after.time.strftime('%H%M')
    meal_directory = IMAGES_DIR / patient_id / date / f"{start_time}-{end_time}"
    meal_directory.mkdir(parents=True, exist_ok=True)

    # Define the current and desired paths of each image.
    paths = {
        "before_rgb": (
            BACKEND_DIR / before.rgb_path, 
            meal_directory / f"before_{RGB_FILENAME}",
        ),
        "before_depth": (
            BACKEND_DIR / before.depth_path, 
            meal_directory / f"before_{DEPTH_FILENAME}",
        ),
        "after_rgb": (
            BACKEND_DIR / after.rgb_path, 
            meal_directory / f"after_{RGB_FILENAME}",
        ),
        "after_depth": (
            BACKEND_DIR / after.depth_path, 
            meal_directory / f"after_{DEPTH_FILENAME}",
        ),
    }

    # Move each image from its current directory to its desired directory.
    result = {}
    for key, (src, dest) in paths.items():
        shutil.copy(src, dest)
        result[key] = str(dest.relative_to(BACKEND_DIR))
    
    # Return the paths to each image.
    return result


def _delete_snapshots(*snapshots: MealSnapshot, db: Session) -> None:
    """Deletes meal snapshots from the database and from disk.
    
    Args:
        snapshots: The meal snapshots to delete.
        db: SQLAlchemy database session.
    """

    # Iterate over each meal snapshot.
    for snapshot in snapshots:
        # Delete the meal snapshot's folder and its files from disk.
        snapshot_directory = UPLOAD_DIR / snapshot.upload_id / snapshot.folder
        shutil.rmtree(snapshot_directory)

        # Delete the meal snapshot's record from the database.
        db.delete(snapshot)
