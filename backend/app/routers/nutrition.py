from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_

import datetime

from app.db import get_db
from app.models.db_models import Meal, NutritionReport, NutritionReportFood, Patient
from app.schemas import (
    CreateNutritionReportRequest,
    FoodNutrition,
    MealNutrition,
    NutritionReportResponse,
)


# Create a new API router to group nutrition-related endpoints.
router = APIRouter()


# GET endpoint to retrieve a single nutrition report.
@router.get("/{meal_id}", status_code=status.HTTP_200_OK)
def get_nutrition_report(
    meal_id: int,
    db: Session = Depends(get_db),
) -> NutritionReportResponse:
    """Retrieves a nutrition report for a meal.
    
    Args:
        meal_id: The ID of the meal of the nutrition report to retrieve.
        db: SQLAlchemy database session.
    
    Returns:
        The nutrition report for the specified meal.
    
    Raises:
        HTTPException: If the meal or nutrition report does not exist.
    """

    report = db.query(NutritionReport).filter(NutritionReport.meal_id == meal_id).first()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nutrition report for meal {meal_id} not found.",
        )
    
    return _report_to_response(report)

# POST endpoint to create a new nutrition report.
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_nutrition_report(
    request: CreateNutritionReportRequest,
    db: Session = Depends(get_db),
) -> NutritionReportResponse:
    """Creates a new nutrition report.
    
    Args:
        request: A request containing the ID of the nutrition report's meal, 
        the nutritional values of the nutrition report's meal and the 
        nutritional values of the nutrition report's meal's foods.
        db: SQLAlchemy database session.
    
    Returns:
        The newly created nutrition report.
    
    Raises:
        HTTPException: If the meal does not exist.
    """
    
    existing = db.query(NutritionReport).filter(NutritionReport.meal_id == request.meal_id).first()

    # Check if a report with the same meal id exists.
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A nutrition report with the same meal id already exists.",
        )
    
    report_data = request.meal_nutrition.model_dump(exclude_unset=True)
    new_report = NutritionReport(meal_id=request.meal_id, **report_data)

    db.add(new_report)
    db.flush()

    items: list[NutritionReportFood] = []
    for fn in request.food_nutrition:
        item = NutritionReportFood(
            report_meal_id=request.meal_id,
            food_id=fn.food_id,
            mass=fn.mass,
        )
        items.append(item)

    db.add_all(items)
    db.flush()
    
    # Mark the meal as analysed
    meal = db.query(Meal).filter(Meal.id == request.meal_id).first()
    if meal:
        meal.is_analysed = True
    
    db.commit()

    # Return the nutrition report.
    return _report_to_response(new_report)

# DELETE endpoint to delete a meal.
@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition_report(meal_id: int, db: Session = Depends(get_db)) -> None:
    """Deletes a nutrition report.

    Args:
        meal_id: The ID of the nutrition report to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the nutrition report does not exist.
    """

    # Fetch the nutrition report.
    report = db.query(NutritionReport).filter(NutritionReport.meal_id == meal_id).first()

    # Check if the meal exists.
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nutrition report for meal {meal_id} not found.",
        )

    # Mark the meal as not analysed
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if meal:
        meal.is_analysed = False

    # Delete the nutrition report and commit the change.
    db.delete(report)
    db.commit()

@router.get("/patient/{patient_id}")
def get_patient_nutrition(patient_id: int, report_from: str, report_to: str, db: Session = Depends(get_db)) -> dict[str, NutritionReportResponse]:
    """Gets a nutrition reports for a patient over a time period.

    Args:
        patient_id: The ID of the patient to get a report for.
        report_from: The ISO timestamp to get the report from.
        report_to: The ISO timestamp to get the report to.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the patient id doesn't exist.
    """
    
    # first check if patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found.",
        )

    # check datetimes are valid ISO
    try:
        from_dt = datetime.datetime.fromisoformat(report_from)
        to_dt = datetime.datetime.fromisoformat(report_to)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid timestamps or range given.",
        )
    
    # Get analysed meal ids
    relevant_meals = db.query(Meal).filter(and_(
            Meal.is_analysed.is_(True),
            Meal.date.between(from_dt.date(), to_dt.date())
        )).all()

    if relevant_meals is None:
        return {}
    
    all_meals = {}
    for x in relevant_meals:
        all_meals[x.id] = x
    # get all nutrition reports
    relevant_nutrition_reports =  db.query(NutritionReport).filter(NutritionReport.meal_id.in_(all_meals.keys())).all()
    if relevant_nutrition_reports is None:
        return {}
    
    # first set meal id as key
    ret_dict = {}
    for x in relevant_nutrition_reports:
        ret_dict[x.meal_id] = x

    # search meal id key and replace with date
    for k in ret_dict.copy().keys():
        m: Meal = all_meals.get(k, None)
        if m is None:
            ret_dict.pop(k)
            continue
        val = ret_dict[k]
        ret_dict[m.date.strftime("%Y-%m-%d")] = _report_to_response(val)
        ret_dict.pop(k)

    return ret_dict

def _food_to_nutrition(food_item: NutritionReportFood) -> FoodNutrition:
    food = food_item.food
    factor = food_item.mass / 100.0

    data = {
        field: (
            getattr(food, field) * factor
            if getattr(food, field) is not None
            else None
        )
        for field in FoodNutrition.model_fields
        if field not in {"food_id", "mass", "food_name", "short_name"}
    }

    return FoodNutrition(
        food_id=food_item.food_id,
        mass=food_item.mass,
        food_name=food.food_name,
        short_name=food.short_name,
        **data,
    )

def _report_to_response(nutrition_report: NutritionReport) -> NutritionReportResponse:
    return NutritionReportResponse(
        meal_id=nutrition_report.meal_id,
        meal_nutrition=MealNutrition.model_validate(nutrition_report, from_attributes=True),
        food_nutrition=[_food_to_nutrition(item) for item in nutrition_report.food_items]
    )