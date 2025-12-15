from sqlalchemy import (
    Column,
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db import Base


class Meal(Base):
    """A hospital meal consumed by a patient.

    Attributes:
        id (int): Unique identifier for the meal.
        date (date): Date when the meal was consumed.
        start_time (time): Start time of the meal.
        end_time (time): End time of the meal.
        before_weight (float): Weight of the meal before consumption.
        after_weight (float): Weight of the meal after consumption.
        before_rgb_path (str): Path to the pre-meal RGB image.
        before_depth_path (str): Path to the pre-meal depth image.
        after_rgb_path (str): Path to the post-meal RGB image.
        after_depth_path (str): Path to the post-meal depth image.
        patient (Patient): Patient who consumed the meal.
        menu_item (MenuItem): Menu item that describes the meal.
        patient_id (int): Foreign key referencing the associated patient.
        menu_item_id (int): Foreign key referencing the associated menu item.
    """

    # Table name.
    __tablename__ = "meals"

    # Prevent duplicate meals.
    __table_args__ = (
        UniqueConstraint(
            "patient_id", 
            "date", 
            "start_time", 
            "end_time",
            name="uq_meal_patient_date_time",
        ),
    )

    # Primary key for the meal record.
    id = Column(Integer, primary_key=True, index=True)

    # Meal metadata.
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Meal weights.
    before_weight = Column(Float, nullable=False)
    after_weight = Column(Float, nullable=False)

    # Image file paths.
    before_rgb_path = Column(String, nullable=False)
    before_depth_path = Column(String, nullable=False)
    after_rgb_path = Column(String, nullable=False)
    after_depth_path = Column(String, nullable=False)

    # Many-to-one relationship: multiple meals can have the same patient.
    patient = relationship(
        "Patient",
        back_populates="meals",
        lazy="selectin",  # Load patients for all meals.
    )

    # Many-to-one: multiple meals can be described by the same menu item.
    menu_item = relationship(
        "MenuItem",
        back_populates="meals",
        lazy="selectin",  # Load menu items for all meals.
    )

    # Foreign key linking to patient.
    patient_id = Column(
        Integer, 
        ForeignKey(
            "patients.id", 
            ondelete="CASCADE",  # If patient is deleted, delete meals
            onupdate="CASCADE",  # If patient is updated, update meals.
        ),
        nullable=False,
    )

    # Foreign key linking to menu item.
    menu_item_id = Column(
        Integer, 
        ForeignKey(
            "menu.id", 
            ondelete="RESTRICT",  # If meal exists, don't let menu item be deleted.
        ),
        nullable=False,
    )
