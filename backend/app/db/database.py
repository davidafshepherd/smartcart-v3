from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from collections.abc import Generator


# Path to the SQLite database.
BACKEND_DIR = Path(__file__).resolve().parents[2]
DATABASE_PATH = BACKEND_DIR / "smartcart.db"

# SQLite database URL.
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create the SQLAlchemy engine.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create a session factory for generating database sessions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for defining ORM models (tables).
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Provides a database session to each FastAPI request."""

    db = SessionLocal()  # Create a new database session.
    try:
        yield db         # Provide the session to the request handler.
    finally:
        db.close()       # Ensure the session is closed after the request.
