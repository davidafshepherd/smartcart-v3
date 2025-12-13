from sqlalchemy import Column, ForeignKey, Integer

from app.db import Base


class MenuItemFood(Base):
    """Associates a menu item with a food from the McCance & Widdowson dataset.

    Attributes:
        menu_item_id (int): Foreign key referencing the associated menu item.
        food_id (int): Foreign key referencing the associated food.
    """

    # Table name.
    __tablename__ = "menu_item_foods"

    # Composite primary key for the menu item food record.
    menu_item_id = Column(
        Integer,
        ForeignKey(
            "menu.id",
            ondelete="CASCADE",  # If menu item is deleted, delete menu item foods.
        ),
        primary_key=True,
    )
    food_id = Column(
        Integer,
        ForeignKey(
            "foods.id",
            ondelete="RESTRICT",  # If menu item food exists, don't let food be deleted.
        ),
        primary_key=True,
    )
