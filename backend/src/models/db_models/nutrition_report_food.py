from sqlalchemy import Column, Float, ForeignKey, Integer, PrimaryKeyConstraint
from sqlalchemy.orm import relationship

from src.db import Base


class NutritionReportFood(Base):
    __tablename__ = "nutrition_report_foods"

    # FK to NutritionReport's shared PK (meal_id)
    report_meal_id = Column(
        Integer,
        ForeignKey("nutrition_reports.meal_id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )

    # FK to Foods table
    food_id = Column(
        Integer,
        ForeignKey("foods.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )

    # grams consumed for this food within this report
    mass = Column(Float, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("report_meal_id", "food_id"),  # use this only if food appears max once per report
    )

    report = relationship("NutritionReport", back_populates="food_items")
    food = relationship("Food", back_populates="nutrition_report_items")
