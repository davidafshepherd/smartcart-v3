from sqlalchemy import Column, ForeignKey, Float, Integer
from sqlalchemy.orm import relationship

from app.db import Base


class MealFood(Base):
    """Associates a meal with a food from the McCance & Widdowson dataset.

    Attributes:
        meal_id (int): Foreign key referencing the associated meal.
        food_id (int): Foreign key referencing the associated food.
        grams_before (float): Weight of the food before consumption.
        grams_after (float): Weight of the food after consumption.
        grams_consumed (float): Amount of the food consumed.
        meal (Meal): The meal that uses the food.
        food (Food): The food used in the meal.
    """

    # Table name.
    __tablename__ = "meal_foods"

    # Composite primary key for the meal food record.
    meal_id = Column(
        Integer,
        ForeignKey(
            "meals.id", 
            ondelete="CASCADE",  # If meal is deleted, delete meal foods.
        ),
        primary_key=True,
    )
    food_id = Column(
        Integer,
        ForeignKey(
            "foods.id",
            ondelete="RESTRICT",  # If meal food exists, don't let food be deleted.
        ),
        primary_key=True,
    )

    # Food weights.
    grams_before = Column(Float, nullable=False)
    grams_after = Column(Float, nullable=False)
    grams_consumed = Column(Float, nullable=False)

    # Many-to-one: multiple meal foods can be used in same meal.
    meal = relationship("Meal", back_populates="meal_foods")

    # Many-to-one: multiple meal foods can use the same food.
    food = relationship("Food", back_populates="meal_foods")
