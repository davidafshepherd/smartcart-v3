from sqlalchemy import Column, Float, String
from sqlalchemy.orm import relationship

from app.db import Base


class Food(Base):
    """A food entry from the McCance & Widdowson's dataset.

    Attributes:
    food_code (str): Unique identifier for the food.
    food_name (str): Human-readable name of the food.
    density (float): Density (g/m^3) of the food.
    kcal (float): Energy (kcal) per 100g.
    kj (float): Energy (kj) per 100g.
    protein (float): Protein (g) per 100g.
    fat (float): Fat (g) per 100g.
    carbohydrate (float): Carbohydate (g) per 100g.
    sugar (float): Total sugars (g) per 100g.
    fibre (float): AOAC fibre (g) per 100g.
    saturated_fat (float): Saturated fatty acids (g) per 100g food.
    sodium (float): Sodium (mg) per 100g.
    potassium (float): Potassium (mg) per 100g.
    calcium (float): Calcium (mg) per 100g.
    magnesium (float): Magnesium (mg) per 100g.
    phosphorus (float): Phosphorus (mg) per 100g.
    iron (float): Iron (mg) per 100g.
    copper (float): Copper (mg) per 100g.
    zinc (float): Zinc (mg) per 100g.
    selenium (float): Selenium (µg) per 100g.
    iodine (float): Iodine (µg) per 100g.
    retinol (float): Retinol (µg) per 100g.
    carotene (float): Carotene (µg) per 100g.
    vitamin_d (float): Vitamin D (µg) per 100g.
    vitamin_e (float): Vitamin E (mg) per 100g.
    vitamin_k1 (float): Vitamin K1 (µg) per 100g.
    thiamin (float): Thiamin (mg) per 100g.
    riboflavin (float): Riboflavin (mg) per 100g.
    niacin (float): Niacin (mg) per 100g.
    vitamin_b6 (float): Vitamin B6 (mg) per 100g.
    vitamin_b12 (float): Vitamin B12 (µg) per 100g.
    folate (float): Folate (µg) per 100g.
    vitamin_c (float): Vitamin C (mg) per 100g.
    menu_items (list[MenuItem]): Menu items that use the food.
    meal_foods (list[MealFood]) Meal foods that use the food.
    """

    # Table name.
    __tablename__ = "foods"

    # Primary key for the food record.
    food_code = Column(String, primary_key=True, index=True)

    # Human-readable name of the food (e.g. "Apples, eating, dried").
    food_name = Column(String, nullable=False, index=True)

    # Density (g / m^3) of the food.
    density = Column(Float, nullable=False)

    # Calories.
    kcal = Column(Float, nullable=False)
    kj = Column(Float, nullable=False)
    
    # Macronutrients.
    protein = Column(Float, nullable=False)
    fat = Column(Float, nullable=False)
    carbohydrate = Column(Float, nullable=False)
    sugar = Column(Float, nullable=False)
    fibre = Column(Float, nullable=False)
    saturated_fat = Column(Float, nullable=False)

    # Minerals.
    sodium = Column(Float, nullable=False)
    potassium = Column(Float, nullable=False)
    calcium = Column(Float, nullable=False)
    magnesium = Column(Float, nullable=False)
    phosphorus = Column(Float, nullable=False)
    iron = Column(Float, nullable=False)
    copper = Column(Float, nullable=False)
    zinc = Column(Float, nullable=False)
    selenium = Column(Float, nullable=False)
    iodine = Column(Float, nullable=False)

    # Vitamins.
    retinol = Column(Float, nullable=False)
    carotene = Column(Float, nullable=False)
    vitamin_d = Column(Float, nullable=False)
    vitamin_e = Column(Float, nullable=False)
    vitamin_k1 = Column(Float, nullable=False)
    thiamin = Column(Float, nullable=False)
    riboflavin = Column(Float, nullable=False)
    niacin = Column(Float, nullable=False)
    vitamin_b6 = Column(Float, nullable=False)
    vitamin_b12 = Column(Float, nullable=False)
    folate = Column(Float, nullable=False)
    vitamin_c = Column(Float, nullable=False)

    # Many-to-many relationship: a food can be used in multiple menu items.
    menu_items = relationship(
        "MenuItem",
        secondary="menu_item_foods",  # Association table.
        back_populates="foods",
    )

    # One-to-many relationship: a food can be used in multiple meal foods.
    meal_foods = relationship("MealFood", back_populates="food")
