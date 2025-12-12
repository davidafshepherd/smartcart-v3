from sqlalchemy import Column, ForeignKey, Integer, String

from app.db import Base


class MenuItemFood(Base):
    """Associates a menu item with foods from the McCance & Widdowson dataset.

    Attributes:
        menu_item_id (int): Foreign key referencing the associated menu item.
        food_code (str): Foreign key referencing the associated food.
    """

    # Table name.
    __tablename__ = "menu_item_foods"

    # Composite primary key for the menu item food record.
    menu_item_id = Column(
        Integer,
        ForeignKey(
            "menu.id", 
            ondelete="CASCADE", # Delete menu item foods when menu item is deleted.
        ),
        primary_key=True,
    )
    food_code = Column(
        String,
        ForeignKey(
            "foods.food_code", 
            ondelete="RESTRICT", # If menu item food
        ),
        primary_key=True,
    )
