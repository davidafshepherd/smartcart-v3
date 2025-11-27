from app.db import Base
from sqlalchemy import Column, Integer
from sqlalchemy.orm import relationship


class Patient(Base):
    """A hospital patient.

    Attributes:
        id (int): Unique identifier for the patient.
        meals (list[Meal]): Meals consumed by the patient.
    """

    __tablename__ = "patients"

    # Primary key for the patient record.
    id = Column(Integer, primary_key=True, index=True)

    # One-to-many relationship: a patient can have multiple meals.
    meals = relationship(
        "Meal", 
        back_populates="patient", 
        cascade="all, delete-orphan",  # Remove meals when patient is deleted. 
        passive_deletes=True,
    )
