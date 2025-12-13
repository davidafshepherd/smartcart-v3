from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class MenuItem(Base):
    """The contents of a hospital meal.

    Attributes:
        id (int): Unique identifier for the menu item.
        name (str): Human-readable name of the menu item.
        foods (list[MenuItemFood]): Foods used by the menu item.
        meals (list[Meal]): Meals described by the menu item.
    """

    # Table name.
    __tablename__ = "menu"

    # Primary key for the menu item record.
    id = Column(Integer, primary_key=True, index=True)

    # Human-readable name of the menu item (e.g. "Chicken & Veg").
    name = Column(String, nullable=False)

    # Many-to-many relationship: a menu item can use multiple foods.
    foods = relationship(
        "Food",
        secondary="menu_item_foods",  # Association table.
        back_populates="menu_items",
        lazy="selectin",  # Load foods for all menu items.
    )

    # One-to-many relationship: a menu item can describe multiple meals.
    meals = relationship("Meal", back_populates="menu_item")
