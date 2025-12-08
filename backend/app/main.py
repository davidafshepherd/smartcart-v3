from contextlib import asynccontextmanager
import shutil

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.constants import UPLOAD_DIR
from app.db import Base, engine, SessionLocal
from app.models.db_models import MealSnapshot
from app.routers import meals, menu, patients, uploads


# Create tables if they don't exist already.
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages application startup and shutdown."""
    _cleanup_snapshots()  # Startup.
    yield
    _cleanup_snapshots()  # Shutdown.


def _cleanup_snapshots():
    "Deletes all meal snapshots from the database and disk."

    # Delete all meal snapshots from the database.
    db = SessionLocal()
    try:
        db.query(MealSnapshot).delete()
        db.commit()
    finally:
        db.close()
    
    # Delete all meal snapshots from disk.
    if UPLOAD_DIR.exists():
        shutil.rmtree(UPLOAD_DIR)


# Create the FastAPI application with a lifespan handler.
app = FastAPI(lifespan=lifespan)

# Allow the Next.js frontend to call the FastAPI backend.
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Register the application's API routers.
app.include_router(menu.router, prefix="/menu", tags=["menu"])
app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(meals.router, prefix="/meals", tags=["meals"])
app.include_router(uploads.router, prefix="/uploads", tags=["uploads"])