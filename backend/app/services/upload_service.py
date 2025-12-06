from app.db import BACKEND_DIR
from dataclasses import dataclass, asdict
from fastapi import UploadFile, HTTPException, status
from typing import Dict, Any, Tuple, List
import uuid
from app.schemas import CommitRequest
from sqlalchemy.orm import Session
from pathlib import Path
import zipfile
import shutil
import json
from datetime import date, time
from PIL import Image


# Define the directories where the meal snapshots + meal images will be stored.
UPLOAD_DIR = BACKEND_DIR / "uploads" 
IMAGES_DIR = BACKEND_DIR / "meal_images"

# Create the directories if missing.
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# Define the names of the metadata files, the RGB images and the depth images.
METADATA_FILENAME = "metadata.json"
RGB_FILENAME = "rgb.png"
DEPTH_FILENAME = "depth.jpeg"

@dataclass
class MealSnapshot:
    """Represents the state of a meal at a specific point in time.

    Attributes:
        id: Unique identifier for the snapshot.
        patient_id: ID of the patient who consumed the meal.
        date_str: Date of the snapshot.
        time_str: Time of the snapshot.
        weight: Weight of the meal.
        rgb_path: Path (relative to BACKEND_DIR) to an RGB image of the meal.
        depth_path: Path (relative to BACKEND_DIR) to a depth image of the meal.
    """

    id: str
    patient_id: int
    date_str: date
    time_str: time
    weight: float
    rgb_path: Path
    depth_path: Path

    def abs_rgb_path(self) -> Path:
        """Returns the absolute path to the RGB image."""
        return BACKEND_DIR / self.rgb_path
    
    def abs_depth_path(self) -> Path:
        """Returns the absolute path to the depth image."""
        return BACKEND_DIR / self.depth_path

@dataclass
class InvalidSnapshot:
    """Represents an invalid meal snapshot.

    Attributes:
        folder: Name of the folder containing the meal snapshot.
        error: Reason why the meal snapshot is not valid.
    """
    
    folder: str
    error: str


# === Upload functions (used by routers) ===
        
async def store_upload(file: UploadFile) -> Dict[str, Any]:
    """Stores the meal snapshots within an uploaded ZIP file.

    Extracts all folders within an uploaded ZIP file into a directory named 
    "{upload_id"} within the "uploads" directory. A list of meal snapshots and 
    a list of invalid snapshots is then created from each extracted folder.

    Args:
        file: The ZIP file uploaded by the user.
    
    Returns:
        A dictionary containing the upload ID, a list of each meal snapshot and
        a list of each invalid snapshot.

    Raises:
        HTTPException: If the file is not a ZIP file, if the ZIP file is invalid
        or if the ZIP file contains no valid meal snapshot.
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
    extract_zip_file(file, upload_directory)

    # Create a list of meal snapshots and invalid snapshots.
    entries, invalid_entries = build_meal_snapshots(upload_directory)

    # Check if the list of meal snapshots is not empty.
    if not entries:
        safe_delete(upload_directory)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "No valid meal snapshot was found in the ZIP file.",
                "invalid_entries": [asdict(e) for e in invalid_entries],
            },
        )

    return {
        "upload_id": upload_id, 
        "entries": [asdict(e) for e in entries],
        "invalid_entries": [asdict(e) for e in invalid_entries],
    }


# === Helpers ===

def safe_delete(path: Path) -> None:
    """Safely deletes a directory or file.
    
    Args:
        path: Path to the directory or file.
    """

    if path.is_dir():
        shutil.rmtree(path)  # Delete directory.
    elif path.exists():
        path.unlink()        # Delete file.


def extract_zip_file(file: UploadFile, directory: Path) -> None:
    """Extracts an uploaded ZIP file into a given directory.

    Args:
        file: The uploaded ZIP file.
        directory: The directory to extract the ZIP file to.

    Raises:
        HTTPException: If the ZIP file is invalid.
    """

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


def build_meal_snapshots(
    upload_directory: Path
) -> Tuple[List[MealSnapshot], List[InvalidSnapshot]]:
    """Builds a list of meal snapshots from an uploaded ZIP file.

    Given a directory containing the folders extracted from an uploaded ZIP 
    file, a list of meal snaphshots is created from each extracted folder. If 
    a meal snapshot cannot be created from an extracted folder, an invalid 
    snapshot is created instead and the extracted folder is then deleted.

    Args:
        upload_directory: The directory containing the extracted folders. 

    Returns:
        A list of each meal snapshot and a list of each invalid snapshot.
    """

    # Create lists to store each meal snapshot and each invalid snapshot.
    upload_entries = []
    invalid_entries = []
    
    # Iterate over each folder in the ZIP file.
    for folder in sorted(upload_directory.iterdir()):
        # Delete the folder if the folder is a file.
        if folder.is_file():
            invalid_entry = InvalidSnapshot(
                folder=folder.name, 
                error="Unexpected file in the ZIP file."
            )
            invalid_entries.append(invalid_entry)
            safe_delete(folder)
            continue

        # Delete the folder if the folder is a filesystem.
        if not folder.is_dir():
            invalid_entry = InvalidSnapshot(
                folder=folder.name, 
                error="Unexpected filesystem in the ZIP file."
            )
            invalid_entries.append(invalid_entry)
            safe_delete(folder)
            continue
 
        # Create a meal snapshot from the folder.
        try:
            upload_entry = build_meal_snapshot(folder)
            upload_entries.append(upload_entry)
        except HTTPException as exception:
            invalid_entry = InvalidSnapshot(
                folder=folder.name, 
                error=str(exception.detail),
            )
            invalid_entries.append(invalid_entry)
            safe_delete(folder)
            continue

    return upload_entries, invalid_entries


def build_meal_snapshot(folder: Path) -> MealSnapshot:
    """Builds a meal snapshot from an extracted folder.

    Given a folder extracted from an uploaded ZIP file, a meal snaphshot is 
    created from the extracted folder's metadata file, RGB image and depth 
    image. If a meal snapshot cannot be created from the extracted folder, an 
    HTTPException detailing why the meal snapshot cannot be created is raised.

    Args:
        folder: The extracted folder. 

    Returns:
        The meal snapshot.

    Raises:
        HTTPException: If there is an issue with the metadata or the images.
    """

    # Store the patient ID, meal date, meal time meal weight and image paths.
    patient_id, meal_date, meal_time, meal_weight = get_metadata(folder)
    rgb_path, depth_path = get_image_paths(folder)

    # Store the image paths relative to BACKEND_DIR.
    rgb_relative_path = rgb_path.relative_to(BACKEND_DIR)
    depth_relative_path = depth_path.relative_to(BACKEND_DIR)

    return MealSnapshot(
        folder.name,
        patient_id,
        meal_date,
        meal_time,
        meal_weight,
        rgb_relative_path,
        depth_relative_path
    )


def get_metadata(folder: Path) -> Tuple[int, date, time, float]:
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
        A tuple containing the patient ID, snapshot date, snapshot time and meal
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
            detail=f"Missing {METADATA_FILENAME} in '{folder.name}'.",
        )
    
    # Load the JSON object.
    try:
        with metadata_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON in '{METADATA_FILENAME}' in '{folder.name}'.",
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
            detail=f"Incomplete or invalid {METADATA_FILENAME} in '{folder.name}'.",
        )
    
    # Convert the date and the time into their expected data types.
    try:
        meal_date = date.fromisoformat(date_str)
        meal_time = time.fromisoformat(time_str)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date/time in {METADATA_FILENAME} in '{folder.name}'.",
        )
    
    return patient_id, meal_date, meal_time, weight


def get_image_paths(folder: Path) -> Tuple[Path, Path]:
    """Gets a meal snapshot's image paths.
    
    Given a folder extracted from an uploaded ZIP file, the RGB and depth images
    within the extracted folder are located and their paths are retrieved.

    Args:
        folder: The extracted folder.

    Returns:
        A tuple containing the paths to the RGB and depth images, respectively.

    Raises:
        HTTPException: If the images are missing, misnamed or invalid.
    """

    # Store the paths to the RGB image and the depth image.
    rgb_path = folder / RGB_FILENAME
    depth_path = folder / DEPTH_FILENAME

    # Check if the RGB image exists.
    if not rgb_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing {RGB_FILENAME} in '{folder.name}'.",
        )
    
    # Check if the depth image exists.
    if not depth_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing {DEPTH_FILENAME} in '{folder.name}'.",
        )
    
    # Check if the RGB image and the depth image are valid images.
    validate_image(rgb_path)
    validate_image(depth_path)

    return rgb_path, depth_path
    

def validate_image(path: Path) -> None:
    """Verifies if a file is a valid image.
    
    Args:
        path: Path to the file.

    Raises:
        HTTPException: If a file is not a valid image.
    """

    try:
        with Image.open(path) as img:
            img.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{path.name}' is not a valid image."
        )


def get_upload_directory(upload_id: str) -> Path:
    """Gets an upload directory.

    Args:
    upload_id: Name of the upload directory.

    Returns:
        Path to the upload directory.
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

