from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.models.db_models import Patient
from app.schemas import PatientResponse, CreatePatientRequest, UpdatePatientRequest


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
    patients = db.query(Patient).all()
    return [PatientResponse(id=p.id) for p in patients]


# GET endpoint to retrieve a single patient.
@router.get("/{patient_id}", status_code=status.HTTP_200_OK)
def get_patient(patient_id: int, db: Session = Depends(get_db)) -> PatientResponse:
    """Retrieves a single patient by ID.

    Args:
        patient_id: The ID of the patient to retrieve.
        db: SQLAlchemy database session.

    Returns:
        The patient with the specified ID.

    Raises:
        HTTPException: If the patient does not exist.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found.",
        )
    
    return PatientResponse(id=patient.id)


# POST endpoint to create a new patient.
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_patient(
    request: CreatePatientRequest,
    db: Session = Depends(get_db),
) -> PatientResponse:
    """Creates a new patient.

    Args:
        request: The request containing the patient ID.
        db: SQLAlchemy database session.

    Returns:
        The newly created patient.

    Raises:
        HTTPException: If the patient already exists.
    """
    # Check if the patient already exists.
    existing = db.query(Patient).filter(Patient.id == request.patient_id).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient {request.patient_id} already exists.",
        )

    # Create the new patient.
    new_patient = Patient(id=request.patient_id)
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

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
        patient_id: The current ID of the patient to update.
        request: The request containing the new patient ID.
        db: SQLAlchemy database session.

    Returns:
        The updated patient.

    Raises:
        HTTPException: If the patient does not exist or if the new ID is 
            already in use.
    """
    # Check if the patient exists.
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found.",
        )

    # If the new ID is the same as the current ID, no update is needed.
    if request.new_patient_id == patient_id:
        return PatientResponse(id=patient.id)

    # Check if the new ID is already in use.
    conflict = db.query(Patient).filter(Patient.id == request.new_patient_id).first()
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient {request.new_patient_id} already exists.",
        )

    # Update the patient's ID.
    patient.id = request.new_patient_id
    db.commit()
    db.refresh(patient)

    return PatientResponse(id=patient.id)


# DELETE endpoint to delete a patient.
@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db)) -> None:
    """Deletes a patient.

    Removes a patient and their associated meals via CASCADE.

    Args:
        patient_id: The ID of the patient to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the patient does not exist.
    """
    # Check if the patient exists.
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found.",
        )

    # Delete the patient.
    db.delete(patient)
    db.commit()
