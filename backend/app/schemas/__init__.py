from .analysis import (
    Point,
    Box,
    PointGroup,
    BoxGroup,
    OWLv2Request,
    OWLv2SAHIRequest,
    OWLv2Response,
    PointsRequest,
    BoxRequest,
    Mask,
    SAM2Response,
    ComputeNutritionRequest,
    FoodVolume,
    FoodMass,
    MealNutrition,
    FoodNutrition,
    ComputeNutritionResponse,
)
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
    # Analysis.
    "Point",
    "Box",
    "PointGroup",
    "BoxGroup",
    "OWLv2Request",
    "OWLv2SAHIRequest",
    "OWLv2Response",
    "PointsRequest",
    "BoxRequest",
    "Mask",
    "SAM2Response",
    "ComputeNutritionRequest",
    "FoodVolume",
    "FoodMass",
    "MealNutrition",
    "FoodNutrition",
    "ComputeNutritionResponse",

    # Foods.
    "FoodBriefResponse",
    "FoodResponse",

    # Meals.
    "CreateMealRequest",
    "MealResponse",
    "UpdateMealRequest",

    # Menu.
    "CreateMenuItemRequest",
    "MenuItemResponse",
    "UpdateMenuItemRequest",

    # Patients.
    "CreatePatientRequest",
    "PatientResponse",
    "UpdatePatientRequest",

    # Meal snapshots.
    "InvalidSnapshotResponse",
    "MealSnapshotResponse",
    "UploadResponse",
]
