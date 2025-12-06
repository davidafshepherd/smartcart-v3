from pydantic import BaseModel
from typing import List


class CommitMeal(BaseModel):
    patient_id: int
    menu_item_id: int
    before_entry_id: str
    after_entry_id: str

class CommitRequest(BaseModel):
    meals: List[CommitMeal]
