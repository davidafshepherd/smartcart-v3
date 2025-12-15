from datetime import date, time
import json
from pathlib import Path
import shutil
from typing import List, Tuple
import uuid
import zipfile

from fastapi import APIRouter, Depends, File, HTTPException, status, UploadFile
from dataclasses import dataclass
from PIL import Image
from sqlalchemy.orm import Session

from app.constants import (
    BACKEND_DIR,
    DEPTH_FILENAME,
    METADATA_FILENAME,
    RGB_FILENAME,
    UPLOAD_DIR,
)
from app.db import get_db
from app.schemas import (
    InvalidSnapshotResponse,
    MealSnapshotResponse, 
    UploadResponse,
)
from app.models.db_models import MealSnapshot


# Create a new API router to group upload-related endpoints.
router = APIRouter()


@dataclass
class InvalidSnapshot:
    """Represents an invalid meal snapshot.

    Attributes:
        folder: Name of the folder containing the meal snapshot.
        error: Reason why the meal snapshot is not valid.
    """
    
    folder: str
    error: str


# POST endpoint to upload a ZIP file.
@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_zip(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """Stores the meal snapshots within an uploaded ZIP file.

    Extracts all folders within an uploaded ZIP file into a directory named 
    "{upload_id}" within the "uploads" directory. A list of meal snapshots and 
    a list of invalid snapshots is then created from each extracted folder.

    Args:
        file: The ZIP file uploaded by the user.
        db: SQLAlchemy database session.
    
    Returns:
        An upload response containing the upload ID, the list of meal snapshots
        and the list of invalid snapshots.

    Raises:
        HTTPException: If the file is not a ZIP file or if the ZIP file is 
            invalid.
    """

    # Check if the uploaded file is a ZIP file.
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a ZIP file.",
        )
    
    # Create a directory to store the ZIP file's contents.
    upload_id = uuid.uuid4().hex
    upload_directory = UPLOAD_DIR / upload_id
    upload_directory.mkdir(parents=True, exist_ok=False)

    # Extract the ZIP file into the upload directory.
    _extract_zip_file(file, upload_directory)

    # Create a list of meal snapshots and invalid snapshots.
    snapshots = _build_meal_snapshots(upload_directory, upload_id, db)
    meal_snapshots, invalid_snapshots = snapshots

    # Delete upload directory if no meal snapshots were created.
    if not meal_snapshots:
        _safe_delete(upload_directory)

    # Create an upload response containing the upload ID and the snapshots.
    upload_response = UploadResponse(
        upload_id=upload_id, 
        meal_snapshots=[
            MealSnapshotResponse.model_validate(s) 
            for s in meal_snapshots
        ],
        invalid_snapshots=[
            InvalidSnapshotResponse(folder=s.folder, error=s.error) 
            for s in invalid_snapshots
        ],
    )

    # Return the upload response.
    return upload_response


# GET endpoint to retrieve all meal snapshots belonging to an upload.
@router.get("/{upload_id}/snapshots", status_code=status.HTTP_200_OK)
def get_upload_snapshots(
    upload_id: str,
    db: Session = Depends(get_db),
) -> List[MealSnapshotResponse]:
    """Retrieves all meal snapshots belonging to an upload.
    
    Args:
        upload_id: The ID of the upload.
        db: SQLAlchemy database session.

    Returns:
        A list of the meal snapshots.
    """

    # Fetch the meal snapshots.
    snapshots = (
        db.query(MealSnapshot)
        .filter(MealSnapshot.upload_id == upload_id)
        .all()
    )

    # Return a list of the meal snapshots.
    return [MealSnapshotResponse.model_validate(s) for s in snapshots]


# DELETE endpoint to delete a meal snapshot.
@router.delete("/snapshots/{snapshot_id}")
def delete_snapshot(snapshot_id: int, db: Session = Depends(get_db)) -> None:
    """Deletes a meal snapshot.

    Deletes a meal snapshot from the database and its associated files from 
    disk.

    Args:
        snapshot_id: The ID of the meal snapshot to delete.
        db: SQLAlchemy database session.

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
            detail=f"Snapshot {snapshot_id} not found.",
        )

    # Delete the meal snapshot's folder and its files from disk.
    snapshot_directory = UPLOAD_DIR / snapshot.upload_id / snapshot.folder
    shutil.rmtree(snapshot_directory)

    # Delete the meal snapshot's record from the database.
    db.delete(snapshot)
    db.commit()
    

# DELETE endpoint to delete all meal snapshots belonging to an upload.
@router.delete("/{upload_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_upload(upload_id: str, db: Session = Depends(get_db)) -> None:
    """Deletes all meal snapshots belonging to an upload.

        Deletes all meal snapshots belonging to an upload from the database and 
        their associated files from disk.

    Args:
        upload_id: The ID of the upload.
        db: SQLAlchemy database session.
    """

    # Delete the upload's meal snapshots from the database.
    db.query(MealSnapshot).filter(MealSnapshot.upload_id == upload_id).delete()
    db.commit()

    # Delete the upload's folder and its files from disk.
    upload_directory = UPLOAD_DIR / upload_id
    shutil.rmtree(upload_directory)


# === Helpers ===

def _safe_delete(path: Path) -> None:
    """Safely deletes a directory or file."""
    if path.is_dir():
        shutil.rmtree(path)  # Delete directory.
    elif path.exists():
        path.unlink()        # Delete file.


def _extract_zip_file(file: UploadFile, directory: Path) -> None:
    """Extracts an uploaded ZIP file into a given directory."""
    try:
        file.file.seek(0)   
        with zipfile.ZipFile(file.file) as zip_ref:
            zip_ref.extractall(directory)        
    except zipfile.BadZipFile as exception:
        shutil.rmtree(directory)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid ZIP file.",
        ) from exception


def _build_meal_snapshots(
    upload_directory: Path,
    upload_id: str,
    db: Session,
) -> Tuple[List[MealSnapshot], List[InvalidSnapshot]]:
    """Builds a list of meal snapshots from an uploaded ZIP file.

    Given a directory containing the folders extracted from an uploaded ZIP 
    file, a list of meal snaphshots is created from each extracted folder. If 
    a meal snapshot cannot be created from an extracted folder, an invalid 
    snapshot is created instead and the extracted folder is then deleted.

    Args:
        upload_directory: The directory containing the extracted folders. 
        upload_id: The name of the directory containing the extracted folders.
        db: SQLAlchemy database session.

    Returns:
        The list of meal snapshots and the list invalid snapshots.
    """

    # Create lists to store each meal snapshot and each invalid snapshot.
    meal_snapshots = []
    invalid_snapshots = []
    
    # Iterate over each folder in the ZIP file.
    for folder in sorted(upload_directory.iterdir()):
        # Delete the folder if the folder is a file.
        if not folder.is_dir():
            invalid_snapshots.append(InvalidSnapshot(
                folder=folder.name, 
                error="Unexpected file in the ZIP file."
            ))
            _safe_delete(folder)
            continue
 
        # Create a meal snapshot from the folder.
        try:
            meal_snapshot = _build_meal_snapshot(folder, upload_id, db)
            meal_snapshots.append(meal_snapshot)
        except HTTPException as exception:
            invalid_snapshots.append(InvalidSnapshot(
                folder=folder.name, 
                error=str(exception.detail),
            ))
            _safe_delete(folder)
            continue

    # Return the list of meal snapshots and the list of invalid snapshots.
    return meal_snapshots, invalid_snapshots


def _build_meal_snapshot(
    folder: Path,
    upload_id: str,
    db: Session,
) -> MealSnapshot:
    """Builds a meal snapshot from an extracted folder.

    Given a folder extracted from an uploaded ZIP file, a meal snaphshot is 
    created from the extracted folder's metadata file, RGB image and depth 
    image. If a meal snapshot cannot be created from the extracted folder, an 
    HTTPException detailing why the meal snapshot cannot be created is raised.

    Args:
        folder: The extracted folder.
        upload_id: The name of the directory containing the extracted folder.
        db: SQLAlchemy database session. 

    Returns:
        The meal snapshot.

    Raises:
        HTTPException: If there is an issue with the metadata or the images.
    """

    # Get the metadata.
    patient_id, meal_date, meal_time, meal_weight = _get_metadata(folder)

    # Get the image paths.
    rgb_path, depth_path = _get_image_paths(folder)

    # Get the image paths relative to BACKEND_DIR.
    rgb_relative_path = str(rgb_path.relative_to(BACKEND_DIR))
    depth_relative_path = str(depth_path.relative_to(BACKEND_DIR))

    # Create the meal snapshot.
    snapshot = MealSnapshot(
        upload_id=upload_id,
        folder=folder.name,
        date=meal_date,
        time=meal_time,
        patient_id=patient_id,
        weight=meal_weight,
        rgb_path=rgb_relative_path,
        depth_path=depth_relative_path,
    )

    # Persist the meal snapshot.
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    # Return the meal snapshot.
    return snapshot


def _get_metadata(folder: Path) -> Tuple[int, date, time, float]:
    """Gets a meal snapshot's metadata.
     
    Given a folder extracted from an uploaded ZIP file, a JSON object 
    (containing data describing a meal snapshot) is loaded from the extracted 
    folder's metadata file and is validated.

    The JSON object must follow the format:
        {
          "patient_id": 34340602,
          "date": "2025-11-28",
          "time": "17:00",
          "weight": 450.0
        }

    Args:
        folder: The extracted folder.

    Returns:
        The patient ID, the snapshot date, the snapshot time and the meal 
        weight.

    Raises:
        HTTPException: If the metadata file is missing, malformed or invalid.
    """

    # Store the path to the metadata file.
    metadata_path = folder / METADATA_FILENAME

    # Check if the metadata file exists.
    if not metadata_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing '{METADATA_FILENAME}'.",
        )
    
    # Load the JSON object.
    try:
        with metadata_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON in '{METADATA_FILENAME}'.",
        )
    
    # Extract the fields.
    try:
        patient_id = int(data["patient_id"])
        date_str = str(data["date"])
        time_str = str(data["time"])
        weight = float(data["weight"])
    except (KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid '{METADATA_FILENAME}'.",
        )
    
    # Convert the date and time into their expected data types.
    try:
        meal_date = date.fromisoformat(date_str)
        meal_time = time.fromisoformat(time_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date or time in '{METADATA_FILENAME}'.",
        )
    
    # Return the patient ID, the snapshot date and time and the meal weight.
    return patient_id, meal_date, meal_time, weight


def _get_image_paths(folder: Path) -> Tuple[Path, Path]:
    """Gets a meal snapshot's image paths.
    
    Given a folder extracted from an uploaded ZIP file, the RGB and depth images
    within the extracted folder are located and their paths are retrieved.

    Args:
        folder: The extracted folder.

    Returns:
        The path to the RGB image and the path to the depth image.

    Raises:
        HTTPException: If the images are missing, misnamed or invalid.
    """

    # Store the paths to the RGB image and to the depth image.
    rgb_path = folder / RGB_FILENAME
    depth_path = folder / DEPTH_FILENAME

    # Check if the RGB image exists.
    if not rgb_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing '{RGB_FILENAME}'.",
        )
    
    # Check if the depth image exists.
    if not depth_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing '{DEPTH_FILENAME}'.",
        )
    
    # Check if the RGB image and the depth image are valid images.
    _validate_image(rgb_path)
    _validate_image(depth_path)

    # Return the paths to the RGB image and to the depth image.
    return rgb_path, depth_path
    

def _validate_image(path: Path) -> None:
    """Verifies if a file is a valid image."""
    try:
        with Image.open(path) as img:
            img.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{path.name}' is not a valid image.",
        )
