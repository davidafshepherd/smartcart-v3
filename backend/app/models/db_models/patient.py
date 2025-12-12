from sqlalchemy import Column, Integer
from sqlalchemy.orm import relationship

from app.db import Base


class Patient(Base):
    """A hospital patient.

    Attributes:
        id (int): Unique identifier for the patient.
        meals (list[Meal]): Meals consumed by the patient.
    """

    # Table name.
    __tablename__ = "patients"

    # Primary key for the patient record.
    id = Column(Integer, primary_key=True, index=True)

    # One-to-many relationship: a patient can have multiple meals.
    meals = relationship(
        "Meal", 
        back_populates="patient",
        cascade="all, delete-orphan",  # Delete meals if patient is deleted. 
        passive_deletes=True,          # Let the database handle the deletes.
    )
