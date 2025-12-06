from fastapi import APIRouter, status, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from typing import List, Dict, Any, Optional
from app.models.db_models import Meal

# Create a new API router to group meal-related endpoints
router = APIRouter()

