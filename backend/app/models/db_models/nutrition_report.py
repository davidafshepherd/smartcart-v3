from sqlalchemy import Column, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.db import Base


class NutritionReport(Base):
    """A nutrition report for a singular meal.

    Attributes:
        meal_id (int): Unique identifier of the meal.
        kcal (float | None): Energy (kcal) per 100g.
        kj (float | None): Energy (kj) per 100g.
        protein (float | None): Protein (g) per 100g.
        fat (float | None): Fat (g) per 100g.
        carbohydrate (float | None): Carbohydrate (g) per 100g.
        sugar (float | None): Total sugars (g) per 100g.
        fibre (float | None): AOAC fibre (g) per 100g.
        saturated_fat (float | None): Saturated fatty acids (g) per 100g food.
        sodium (float | None): Sodium (mg) per 100g.
        potassium (float | None): Potassium (mg) per 100g.
        calcium (float | None): Calcium (mg) per 100g.
        magnesium (float | None): Magnesium (mg) per 100g.
        phosphorus (float | None): Phosphorus (mg) per 100g.
        iron (float | None): Iron (mg) per 100g.
        copper (float | None): Copper (mg) per 100g.
        zinc (float | None): Zinc (mg) per 100g.
        selenium (float | None): Selenium (µg) per 100g.
        iodine (float | None): Iodine (µg) per 100g.
        retinol (float | None): Retinol (µg) per 100g.
        carotene (float | None): Carotene (µg) per 100g.
        vitamin_d (float | None): Vitamin D (µg) per 100g.
        vitamin_e (float | None): Vitamin E (mg) per 100g.
        vitamin_k1 (float | None): Vitamin K1 (µg) per 100g.
        thiamin (float | None): Thiamin (mg) per 100g.
        riboflavin (float | None): Riboflavin (mg) per 100g.
        niacin (float | None): Niacin (mg) per 100g.
        vitamin_b6 (float | None): Vitamin B6 (mg) per 100g.
        vitamin_b12 (float | None): Vitamin B12 (µg) per 100g.
        folate (float | None): Folate (µg) per 100g.
        vitamin_c (float | None): Vitamin C (mg) per 100g.
    """

    # Table name.
    __tablename__ = "nutrition_reports"

    # Shared PK: same value as meals.id
    meal_id = Column(
        Integer,
        ForeignKey("meals.id", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True,
        index=True,
    )

    # Mass.
    mass = Column(Float, nullable=True)

    # Calories.
    kcal = Column(Float, nullable=True)
    kj = Column(Float, nullable=True)

    # Macronutrients.
    protein = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    carbohydrate = Column(Float, nullable=True)
    sugar = Column(Float, nullable=True)
    fibre = Column(Float, nullable=True)
    saturated_fat = Column(Float, nullable=True)

    # Minerals.
    sodium = Column(Float, nullable=True)
    potassium = Column(Float, nullable=True)
    calcium = Column(Float, nullable=True)
    magnesium = Column(Float, nullable=True)
    phosphorus = Column(Float, nullable=True)
    iron = Column(Float, nullable=True)
    copper = Column(Float, nullable=True)
    zinc = Column(Float, nullable=True)
    selenium = Column(Float, nullable=True)
    iodine = Column(Float, nullable=True)

    # Vitamins.
    retinol = Column(Float, nullable=True)
    carotene = Column(Float, nullable=True)
    vitamin_d = Column(Float, nullable=True)
    vitamin_e = Column(Float, nullable=True)
    vitamin_k1 = Column(Float, nullable=True)
    thiamin = Column(Float, nullable=True)
    riboflavin = Column(Float, nullable=True)
    niacin = Column(Float, nullable=True)
    vitamin_b6 = Column(Float, nullable=True)
    vitamin_b12 = Column(Float, nullable=True)
    folate = Column(Float, nullable=True)
    vitamin_c = Column(Float, nullable=True)

    meal = relationship("Meal", back_populates="nutrition_report")
    
    food_items = relationship(
        "NutritionReportFood",
        back_populates="report",
        cascade="all, delete-orphan",
    )
