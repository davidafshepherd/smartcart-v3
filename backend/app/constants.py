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
RGB_FILENAMES = ["rgb.jpeg", "rgb.jpg"]
DEPTH_FILENAME = "depth.png"

# Define the path to the nutrition dataset CSV file.
NUTRITION_CSV_PATH = BACKEND_DIR / "nutrition_dataset.csv"

# Define the path to the SAM3 model weights.
SAM3_CHECKPOINT_PATH = BACKEND_DIR / "app" / "models" / "sam3" / "sam3.pt"
