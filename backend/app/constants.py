from pathlib import Path


# Define the directories where the meal snapshots + meal images will be stored.
BACKEND_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BACKEND_DIR / "uploads"
IMAGES_DIR = BACKEND_DIR / "meal_images"

# Create the directories if missing.
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# Define the names of the metadata file, the RGB image and the depth image.
METADATA_FILENAME = "metadata.json"
RGB_FILENAME = "rgb.png"
DEPTH_FILENAME = "depth.jpeg"

