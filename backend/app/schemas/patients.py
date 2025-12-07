from pydantic import BaseModel


class PatientResponse(BaseModel):
    """Response schema for retrieving a patient."""
    id: int


class CreatePatientRequest(BaseModel):
    """Request schema for creating a new patient."""
    id: int


class UpdatePatientRequest(BaseModel):
    """Request schema for updating a patient's ID."""
    id: int
