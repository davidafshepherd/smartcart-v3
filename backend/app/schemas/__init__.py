from .foods import (
    FoodBriefResponse,
    FoodResponse,
)
from .meals import (
    CreateMealRequest,
    MealResponse,
    UpdateMealRequest,
)
from .menu import (
    CreateMenuItemRequest,
    MenuItemResponse,
    UpdateMenuItemRequest,
)
from .patients import (
    CreatePatientRequest,
    PatientResponse,
    UpdatePatientRequest,
)
from .snapshots import (
    InvalidSnapshotResponse,
    MealSnapshotResponse,
    UploadResponse,
)


# Pydantic schemas for API request/response validation.
__all__ = [
    # Foods.
    "FoodBriefResponse",
    "FoodResponse",

    # Meals.
    "CreateMealRequest",
    "MealResponse",
    "UpdateMealRequest",

    # Meal snapshots.
    "InvalidSnapshotResponse",
    "MealSnapshotResponse",
    "UploadResponse",

    # Menu.
    "CreateMenuItemRequest",
    "MenuItemResponse",
    "UpdateMenuItemRequest",

    # Patients.
    "CreatePatientRequest",
    "PatientResponse",
    "UpdatePatientRequest",
]
