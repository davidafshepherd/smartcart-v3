from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from typing import List, Dict
from app.models.db_models import Patient

# Create a new API router to group patient-related endpoints.
router = APIRouter()


# GET endpoint to retrieve all patient IDs.
@router.get("/", status_code=status.HTTP_200_OK)
def get_patient_ids(
    db: Session = Depends(get_db)
) -> List[Dict[str, int]]:
    """Retrieves all patient IDs.

    Fetches all patient records stored in the database and returns their IDs.

    Args:
        db (Session): SQLAlchemy database session.

    Returns:
        A list of dictionaries, each containing a patient ID under the key "id".
    """

    patients = db.query(Patient).all()
    return [{"id": p.id} for p in patients]


# POST endpoint to create a new patient.
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
) -> Dict[str, int]:
    """Creates a new patient.

    Inserts a new patient record into the database. The patient's ID is provided
    by the client. The ID must not be already in use.

    Args:
        patient_id: The ID to assign to the new patient.
        db: SQLAlchemy database session.

    Returns:
        A dictionary containing the created patient ID under the key "id".

    Raises:
        HTTPException: If a patient with the given ID already exists.
    """

    # Check if the patient ID is already in use.    
    existing = db.query(Patient).filter(Patient.id == patient_id).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Patient {patient_id} already exists.",
        )
    
    # Create and persist the new patient.
    new_patient = Patient(id=patient_id)
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {"id": new_patient.id}


# PUT endpoint to update a patient's ID.
@router.put("/{patient_id}", status_code=status.HTTP_200_OK)
def update_patient_id(
    patient_id: int,
    new_patient_id: int,
    db: Session = Depends(get_db),
) -> Dict[str, int]:
    """Updates a patient ID.

    Updates the ID of an existing patient record. The current ID must exist and
    the new ID must not be alread in use. Foreign key references are updated 
    automatically via ON UPDATE CASCADE.

    Args:
        patient_id: The current ID of the patient.
        new_patient_id: The new ID to assign to the patient.
        db: SQLAlchemy database session.
    
    Returns:
        A dictionary containing the updated patient ID under the key "id".

    Raises:
        HTTPException: If the patient does not exist or if the new ID is already
        assigned to another patient.
    """

    # Check if the current patient ID exists.
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found.",
        )
    
    # If the new ID matches the current ID, no change is needed.
    if new_patient_id == patient_id:
        return {"id": patient.id}

    # Check if the new patient ID is already in use.    
    conflict = db.query(Patient).filter(Patient.id == new_patient_id).first()
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Patient {patient_id} already exists.",
        )
    
    # Update and persist the patient's ID.
    patient.id = new_patient_id
    db.commit()
    db.refresh(patient)

    return {"id": patient.id}


# DELETE endpoint to delete a patient.
@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Deletes a patient.

    Deletes a patient record stored in the database using the given ID. The ID 
    must exist. Related meals are removed automatically via ON DELETE CASCADE.
    
    Args:
        patient_id: The ID of the patient to delete.
        db: SQLAlchemy database session.

    Raises:
        HTTPException: If the patient does not exist.
    """

    # Checks if the patient ID exists.
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found.",
        )
    
    # Delete the patient and commit the change.
    db.delete(patient)
    db.commit()
