from sqlalchemy import Column, ForeignKey, Float, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class MealFood(Base):
    """Associates a meal with foods from the McCance & Widdowson dataset.

    Attributes:
        meal_id (int): Foreign key referencing the associated meal.
        food_code (str): Foreign key referencing the associated food. 
        grams_before (float): Weight of the food before consumption.
        grams_after (float): Weight of the food after consumption.
        grams_consumed (float): Amount of the food consumed.
        meal (Meal): 
        food (Food):
    """

    # Table name.
    __tablename__ = "meal_foods"

    # Composite primary key for the meal food record.
    meal_id = Column(
        Integer,
        ForeignKey("meals.id", ondelete="CASCADE"),
        primary_key=True,
    )
    food_code = Column(
        String,
        ForeignKey("foods.food_code", ondelete="RESTRICT"),
        primary_key=True,
    )

    # Food weights.
    grams_before = Column(Float, nullable=True)
    grams_after = Column(Float, nullable=True)
    grams_consumed = Column(Float, nullable=True)

    # ORM relationships.
    meal = relationship("Meal", back_populates="meal_foods")
    food = relationship("Food", back_populates="meal_foods")
