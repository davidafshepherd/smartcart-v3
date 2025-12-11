from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, Session, sessionmaker

from app.constants import BACKEND_DIR


# SQLite database URL.
DATABASE_PATH = BACKEND_DIR / "smartcart.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create the SQLAlchemy engine.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Enable foreign key support for SQLite.
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign keys in SQLite."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

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
