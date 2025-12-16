from contextlib import asynccontextmanager
import csv
import shutil
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.constants import NUTRITION_CSV_PATH, UPLOAD_DIR
from app.db import Base, engine, SessionLocal
from app.models.db_models import Food, MealSnapshot
from app.routers import analysis, foods, images, meals, menu, patients, uploads


# Create the tables if they don't exist already.
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages application startup and shutdown."""
    _cleanup_snapshots()  # Startup.
    _load_nutrition_dataset() 
    yield
    _cleanup_snapshots()  # Shutdown.


# Create the FastAPI application with a lifespan handler.
app = FastAPI(lifespan=lifespan)

# Allow the Next.js frontend to call the FastAPI backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the application's API routers.
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
app.include_router(foods.router, prefix="/foods", tags=["foods"])
app.include_router(images.router, prefix="/images", tags=["images"])
app.include_router(menu.router, prefix="/menu", tags=["menu"])
app.include_router(meals.router, prefix="/meals", tags=["meals"])
app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(uploads.router, prefix="/uploads", tags=["uploads"])


# === Helpers ===

def _cleanup_snapshots() -> None:
    "Deletes all meal snapshots from the database and disk."

    # Delete all meal snapshots from the database.
    db = SessionLocal()
    try:
        db.query(MealSnapshot).delete()
        db.commit()
    finally:
        db.close()
    
    # Delete all meal snapshots from disk.
    if UPLOAD_DIR.exists():
        shutil.rmtree(UPLOAD_DIR)


def _load_nutrition_dataset() -> None:
    """Loads nutrition data from CSV into the foods table."""

    # SQLAlchemy database session.
    db = SessionLocal()

    try:
        # Check if the foods table is not empty.
        existing_count = db.query(Food).count()
        if 0 < existing_count:
            print(f"Foods table already contains {existing_count} records, skipping load.")
            return

        # Check if the nutrition dataset exists.
        if not NUTRITION_CSV_PATH.exists():
            print(f"Warning: Nutrition dataset not found at {NUTRITION_CSV_PATH}.")
            return

        # Read and parse the nutrition dataset.
        print(f"Loading nutrition data from {NUTRITION_CSV_PATH}.")
        with open(NUTRITION_CSV_PATH, "r", encoding="utf-8-sig") as f:
            # Create a reader to read the nutrition dataset.
            reader = csv.DictReader(f, delimiter=";")

            # Create a dictionary to remove duplicate foods.
            foods_dict = {}

            # Iterate over each food in the nutrition dataset.
            for row in reader:
                # Get the food's name.
                food_name = row["Food Name"].lower()
                short_name = food_name.split(',')[0].strip()

                # Skip the food if we have already seen its name.
                if food_name in foods_dict:
                    continue
                    
                # Store the food if we have not seen its name.
                foods_dict[food_name] = _create_food(food_name, short_name, row)
            
            # Create a list of the foods to add to the database.
            foods_to_add = list(foods_dict.values())

        # Bulk insert the foods into the database.
        db.bulk_save_objects(foods_to_add)
        db.commit()

        # Complete reading and parsing the nutrition dataset.
        print(f"Successfully loaded {len(foods_to_add)} foods into the database.")

    except Exception as e:
        print(f"Error loading nutrition data: {e}")
        db.rollback()
    finally:
        db.close()


def _create_food(food_name: str, short_name: str, row: dict) -> Food:
    """Creates a Food ORM object from a row in the nutrition dataset.

    Args:
        food_name: The name of the food.
        short_name: The shortened name of the food.
        row: The row in the nutrition dataset.

    Returns:
        The Food ORM object.
    """

    return Food(
        food_name=food_name,
        short_name=short_name,
        density=_parse_float(row.get("Food Density", "")),
        protein=_parse_float(row.get("PROT", "")),
        fat=_parse_float(row.get("FAT", "")),
        carbohydrate=_parse_float(row.get("CHO", "")),
        kcal=_parse_float(row.get("KCALS", "")),
        kj=_parse_float(row.get("KJ", "")),
        sugar=_parse_float(row.get("TOTSUG", "")),
        fibre=_parse_float(row.get("AOACFIB", "")),
        saturated_fat=_parse_float(row.get("SATFOD", "")),
        sodium=_parse_float(row.get("NA", "")),
        potassium=_parse_float(row.get("K", "")),
        calcium=_parse_float(row.get("CA", "")),
        magnesium=_parse_float(row.get("MG", "")),
        phosphorus=_parse_float(row.get("P", "")),
        iron=_parse_float(row.get("FE", "")),
        copper=_parse_float(row.get("CU", "")),
        zinc=_parse_float(row.get("ZN", "")),
        selenium=_parse_float(row.get("SE", "")),
        iodine=_parse_float(row.get("I", "")),
        retinol=_parse_float(row.get("RET", "")),
        carotene=_parse_float(row.get("CAREQU", "")),
        vitamin_d=_parse_float(row.get("VITD", "")),
        vitamin_e=_parse_float(row.get("VITE", "")),
        vitamin_k1=_parse_float(row.get("VITK1", "")),
        thiamin=_parse_float(row.get("THIA", "")),
        riboflavin=_parse_float(row.get("RIBO", "")),
        niacin=_parse_float(row.get("NIAC", "")),
        vitamin_b6=_parse_float(row.get("VITB6", "")),
        vitamin_b12=_parse_float(row.get("VITB12", "")),
        folate=_parse_float(row.get("FOLT", "")),
        vitamin_c=_parse_float(row.get("VITC", "")),
    )


def _parse_float(value: str) -> Optional[float]:
    """Parses a string from the nutrition dataset as a float.

    Args:
        value: The string value from the nutrition dataset.

    Returns:
        The parsed float or None if the string is not a float.
    """

    # Check if the value is not empty, "N" or "Tr".
    if not value or value.strip() in ("", "N", "Tr"):
        return None

    # Parse the string as a float.
    try:
        return float(value.replace(",", "."))  # Handle European decimal format.
    except ValueError:
        return None
