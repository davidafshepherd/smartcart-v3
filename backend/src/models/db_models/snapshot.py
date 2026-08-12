from sqlalchemy import Column, Date, Float, Integer, String, Time

from src.db import Base


class MealSnapshot(Base):
    """The state of a meal at a specific point in time.

    Attributes:
        id (int): Unique identifier for the snapshot.
        upload_id (str): ID of the upload that the snapshot belongs to.
        folder (str): Name of the folder that contains the snapshot's files.
        date (date): Date of the snapshot.
        time (time): Time of the snaphot.
        patient_id (int): ID of the patient who consumed the meal.
        weight (float): Weight of the meal.
        rgb_path (str): Path to the meal RGB image.
        depth_path (str): Path to the meal depth image.
    """

    # Table name.
    __tablename__ = "snapshots"

    # Primary key for the snapshot record.
    id = Column(Integer, primary_key=True, index=True)

    # Snapshot location.
    upload_id = Column(String, nullable=False, index=True)
    folder = Column(String, nullable=False)

    # Snapshot date and time.
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)

    # ID of the patient who consumed the meal.
    patient_id = Column(Integer, nullable=False)

    # Meal weight.
    weight = Column(Float, nullable=False)

    # Image file paths.
    rgb_path = Column(String, nullable=False)
    depth_path = Column(String, nullable=False)
