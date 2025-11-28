from app.db import BACKEND_DIR
from dataclasses import dataclass, asdict
from typing import Tuple, Dict, Any, List
from datetime import date, time
from fastapi import HTTPException, status, UploadFile
from pathlib import Path
import uuid
import zipfile
import shutil
import json
from PIL import Image


# Define the directories where the meal snapshots + meal images will be stored.
UPLOAD_DIR = BACKEND_DIR / "uploads" 
IMAGES_DIR = BACKEND_DIR / "meal_images"

# Create the directories if missing.
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# Define the names of the metadata file and the RGB/depth images.
METADATA_FILENAME = "metadata.json"
RGB_FILENAME = "rgb.png"
DEPTH_FILENAME = "depth.jpeg"

@dataclass
class MealSnapshot:
    """Represents a valid folder in an uploaded ZIP file.

    A folder is valid if it contains a file with metadata about a meal, 1 RGB 
    image of the meal and 1 depth image of the meal.

    Attributes:
    id: Folder name (unique within the uploaded ZIP file).
    patient_id: Patient ID from the folder's metadata file.
    date_str: Meal date from the folder's metadata file.
    time_str: Meal time from the folder's metadata file.
    weight: Meal weight from the folder's metadata file.
    rgb_path: Path (relative to BACKEND_DIR) to the folder's RGB image.
    depth_path: Path (relative to BACKEND_DIR) to the folder's depth image.
    """
    
    id: str
    patient_id: int
    date_str: date
    time_str: time
    weight: float
    rgb_path: Path
    depth_path: Path

    def abs_rgb_path(self) -> Path:
        """Returns the absolute path to the RGB image in the folder."""
        return BACKEND_DIR / self.rgb_path
    
    def abs_depth_path(self) -> Path:
        """Returns the absolute path to the depth image in the folder."""
        return BACKEND_DIR / self.depth_path

@dataclass
class InvalidSnapshot:
    """Represents an invalid folder in an uploaded ZIP file.

    Attributes:
    folder: Folder name.
    error: Reason as to why the folder is not valid.
    """
    
    folder: str
    error: str


# === Upload service functions (used by routers) ===
        
async def store_upload(file: UploadFile) -> Dict[str, Any]:
    """Stores the meal snapshots within an uploaded ZIP file.

    Extracts all folders of an uploaded ZIP file into the directory named 
    "{upload_id"} within the "uploads" directory. A list of meal snapshots is 
    created from each valid folder and a list of invalid snapshots is created 
    from each invalid folder.

    Args:
        file: The ZIP file uploaded by the user.
    
    Returns:
        A dictionary containing the upload ID, a list of each meal snapshot and
        a list of each invalid snapshot.

    Raises:
        HTTPException: If the file is not a ZIP file or the ZIP file is invalid.
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
                "message": "No valid folders were found in the ZIP file.",
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

    try:
        if path.is_dir():
            shutil.rmtree(path)  # Delete directory.
        elif path.exists():
            path.unlink()        # Delete file.
    except OSError:
        pass


def extract_zip_file(file: UploadFile, directory: Path) -> None:
    """Extracts an uploaded ZIP file into a given directory.

    Args:
        file: The uploaded ZIP file.
        directory: The directory to which the ZIP file is extracted into.

    Raises:
        HTTPException: If the ZIP file is invalid.
    """

    try:
        file.file.seek(0)
        with zipfile.ZipFile(file.file) as zip_ref:
            zip_ref.extractall(directory)
    except zipfile.BadZipFile as exception:
        try:
            shutil.rmtree(directory)
        except OSError:
            pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid ZIP file.",
        ) from exception


def build_meal_snapshots(
    upload_directory: Path
) -> Tuple[List[MealSnapshot], List[InvalidSnapshot]]:
    """Builds a list of meal snapshots.

    Given a directory that contains the folders extracted from an uploaded ZIP 
    file, creates a list of meal snaphshots from each valid folder's metadata 
    file and RGB/depth images, creates a list of invalid snapshots from each 
    invalid folder and deletes any files or invalid folders in the directory.

    Args:
        upload_directory: The directory containing the extracted folders. 

    Returns:
        A tuple of a list of each meal snapshot + a list of each invalid snapshot.
    """

    # Create a list to store each meal snapshot and each invalid snapshot.
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
    """Builds a meal snapshot from a valid folder.

    Creates a meal snapshot from a folder's metadata file and RGB/depth images.

    Args:
        folder: The folder. 

    Returns:
        The meal snapshot.

    Raises:
        HTTPException: If there is an issue with the metadata or images.
    """

    # Store the patient ID, meal date, meal time meal weight and image paths.
    patient_id, meal_date, meal_time, meal_weight = get_metadata(folder)
    rgb_path, depth_path = get_image_paths(folder)

    # Store the relative image paths.
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
    """Gets the JSON object in a metadata.json.

    Loads and validates the JSON object in the metadata.json of a given folder. 
    The folder must contain metadata.json. The object must follow the format:
        {
          "patient_id": 34340602,
          "date": "2025-11-28",
          "time": "17:00",
          "weight": 450.0
        }

    Args:
        folder: The folder containing the metadata.json.

    Returns:
        A tuple containing the patient ID, meal date, meal time and meal weight.

    Raises:
        HTTPException: If the metadata.json is missing, malformed or invalid.
    """

    # Store the path to metadata.json.
    metadata_path = folder / METADATA_FILENAME

    # Check if metadata.json exists.
    if not metadata_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing {METADATA_FILENAME} in '{folder.name}'.",
        )
    
    # Load metadata.json.
    try:
        with metadata_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON in '{METADATA_FILENAME}' in '{folder.name}'.",
        )
    
    # Extract fields.
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
    
    # Convert each field into the expected data type.
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
    """Gets the paths of the RGB/depth images in a valid folder.

    Retrieves the paths of the RGB/depth images in a given folder. The folder 
    must contain an image named "rgb.png" and an image named "depth.jpeg".

    Args:
        folder: The folder to search.

    Returns:
        A tuple containing the paths of the RGB/depth images, respectively.

    Raises:
        HTTPException: If the images are missing, misnamed or invalid.
    """

    # Store the paths to rgb.png and depth.jpeg.
    rgb_path = folder / RGB_FILENAME
    depth_path = folder / DEPTH_FILENAME

    # Check if rgb.png exists.
    if not rgb_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing {RGB_FILENAME} in '{folder.name}'.",
        )
    
    # Check if depth.jpeg exists.
    if not depth_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing {DEPTH_FILENAME} in '{folder.name}'.",
        )
    
    # Check if rgb.png and depth.jpeg are valid images.
    validate_image(rgb_path)
    validate_image(depth_path)

    return rgb_path, depth_path
    

def validate_image(path: Path) -> None:
    """Ensures a file is a valid image.
    
    Args:
        path: Path to the image.
    """

    try:
        with Image.open(path) as img:
            img.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{path.name}' is no a valid image."
        )
