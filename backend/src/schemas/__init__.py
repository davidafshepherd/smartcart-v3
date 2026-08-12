from .analysis import (
    ComputeNutritionRequest,
    ComputeNutritionResponse,
    FoodMask,
    FoodMass,
    FoodNutrition,
    FoodVolume,
    MealNutrition,
    Point,
    SAM3AssistedPointsRequest,
    SAM3AssistedTextRequest,
    SAM3AutomatedRequest,
    SAM3Response,
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
from .nutrition import (
    CreateNutritionReportRequest,
    NutritionReportResponse,
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
    "ComputeNutritionRequest",
    "ComputeNutritionResponse",
    "FoodMask",
    "FoodMass",
    "FoodNutrition",
    "FoodVolume",
    "MealNutrition",
    "Point",
    "SAM3AssistedPointsRequest",
    "SAM3AssistedTextRequest",
    "SAM3AutomatedRequest",
    "SAM3Response",

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

    # Nutrition.
    "CreateNutritionReportRequest",
    "NutritionReportResponse",

    # Patients.
    "CreatePatientRequest",
    "PatientResponse",
    "UpdatePatientRequest",

    # Meal snapshots.
    "InvalidSnapshotResponse",
    "MealSnapshotResponse",
    "UploadResponse",
]
