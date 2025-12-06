from app.constants import BACKEND_DIR
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from collections.abc import Generator


# Path to the SQLite database
DATABASE_PATH = BACKEND_DIR / "smartcart.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Session factory for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Provides a database session to each FastAPI request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
