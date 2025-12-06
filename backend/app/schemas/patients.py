"""Pydantic schemas for patients."""

from pydantic import BaseModel


class PatientResponse(BaseModel):
    """Response schema for a patient."""
    id: int


class CreatePatientRequest(BaseModel):
    """Request schema for creating a patient."""
    patient_id: int


class UpdatePatientRequest(BaseModel):
    """Request schema for updating a patient's ID."""
    new_patient_id: int

