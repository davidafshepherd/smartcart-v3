from pathlib import Path


# Directory paths
BACKEND_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BACKEND_DIR / "uploads"
IMAGES_DIR = BACKEND_DIR / "meal_images"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# File naming conventions
METADATA_FILENAME = "metadata.json"
RGB_FILENAME = "rgb.png"
DEPTH_FILENAME = "depth.jpeg"

