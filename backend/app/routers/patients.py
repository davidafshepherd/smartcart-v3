from pathlib import Path
import shutil
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.constants import BACKEND_DIR
from app.db import get_db
from app.models.db_models import Meal, Patient
from app.schemas import (
    CreatePatientRequest, 
    PatientResponse, 
    UpdatePatientRequest,
)


# Create a new API router to group patient-related endpoints.
router = APIRouter()


# GET endpoint to retrieve all patients.
@router.get("/", status_code=status.HTTP_200_OK)
def get_patients(db: Session = Depends(get_db)) -> List[PatientResponse]:
    """Retrieves all patients.

    Args:
        db: SQLAlchemy database session.

    Returns:
        A list of all patients.
    """

    # Fetch all patients.
    patients = db.query(Patient).all()

    # Return a list of all patients.
    return [PatientResponse(id=patient.id) for patient in patients]


# GET endpoint to retrieve a single patient.
@router.get("/{patient_id}", status_code=status.HTTP_200_OK)
def get_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
) -> PatientResponse:
    """Retrieves a single patient by ID.

    Args:
        patient_id: The ID of the patient to retrieve.
        db: SQLAlchemy database session.

    Returns:
        The patient with the specified ID.

    Raises:
        HTTPException: If the patient does not exist.
    """

    # Fetch the patient.
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    # Check if the patient exists.
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found.",
        )
    
    # Return the patient.
    return PatientResponse(id=patient.id)


# POST endpoint to create a new patient.
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_patient(
    request: CreatePatientRequest,
    db: Session = Depends(get_db),
) -> PatientResponse:
    """Creates a new patient.

    Args:
        request: A request containing the patient's ID.
        db: SQLAlchemy database session.

    Returns:
        The newly created patient.

    Raises:
        HTTPException: If a patient with the given ID already exists.
    """
    
    # Check if the ID is already in use.
    existing = db.query(Patient).filter(Patient.id == request.id).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient {request.id} already exists.",
        )

    # Create and persist the new patient.
    new_patient = Patient(id=request.id)
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    # Return the newly created patient.
    return PatientResponse(id=new_patient.id)


# PUT endpoint to update a patient's ID.
@router.put("/{patient_id}", status_code=status.HTTP_200_OK)
def update_patient(
    patient_id: int,
    request: UpdatePatientRequest,
    db: Session = Depends(get_db),
) -> PatientResponse:
    """Updates a patient's ID.

    Args:
        patient_id: The ID of the patient to update.
        request: A request containing the patient's new ID.
        db: SQLAlchemy database session.

    Returns:
        The updated patient.

    Raises:
        HTTPException: If the patient does not exist or if the new ID is already 
        in use.
    """
    
    # Fetch the patient.
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    # Check if the patient exists.
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found.",
        )

    # If the current ID is the same as the new ID, no update is needed.
    if patient_id == request.id:
        return PatientResponse(id=patient.id)

    # Check if the new ID is already in use.
    conflict = db.query(Patient).filter(Patient.id == request.id).first()
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient {request.id} already exists.",
        )

    # Update and persist the patient.
    patient.id = request.id
    db.commit()
    db.refresh(patient)

    # Return the updated patient.
    return PatientResponse(id=patient.id)


# DELETE endpoint to delete a patient.
@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db)) -> None:
    """Deletes a patient.

    Deletes a patient record, its associated meals and meal image files.

    Args:
        patient_id: The ID of the patient to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the patient does not exist.
    """

    # Fetch the patient.
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    # Check if the patient exists.
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found.",
        )

    # Fetch all meals for this patient to delete their image files.
    meals = db.query(Meal).filter(Meal.patient_id == patient_id).all()

    # Delete meal image files from disk.
    for meal in meals:
        # Get image paths.
        paths = [
            meal.before_rgb_path,
            meal.before_depth_path,
            meal.after_rgb_path,
            meal.after_depth_path,
        ]

        # Delete each image file.
        for path_str in paths:
            if path_str:
                image_path = BACKEND_DIR / path_str
                if image_path.exists():
                    image_path.unlink()

        # Delete the meal's folder.
        if meal.before_rgb_path:
            meal_directory = (BACKEND_DIR / meal.before_rgb_path).parent
            if meal_directory.exists():
                try:
                    meal_directory.rmdir()
                except OSError:
                    pass  # Directory not empty or already deleted.

    # Delete the patient (meals are cascade deleted).
    db.delete(patient)
    db.commit()
