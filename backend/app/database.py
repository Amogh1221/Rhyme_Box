"""
Database connection and session management.
Configures SQLAlchemy engine with connection pooling for PostgreSQL/SQLite.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Remove async driver notation if present (fixes compatibility issues)
database_url = settings.DATABASE_URL.replace("+asyncpg", "")

# Configure connection arguments based on database type
connect_args = {}
if database_url.startswith("sqlite"):
    # SQLite: allow multi-threaded access
    connect_args = {"check_same_thread": False}
elif database_url.startswith("postgresql"):
    # PostgreSQL: set connection timeout for cloud databases
    connect_args = {"connect_timeout": 10}

# Create database engine with connection pooling
engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_size=10,              # Max concurrent connections
    max_overflow=20,           # Extra connections when pool full
    pool_pre_ping=True,        # Verify connections before using
    echo=settings.DEBUG        # Log SQL queries in debug mode
)

# Session factory for database operations
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)

# Base class for all database models
Base = declarative_base()

def get_db():
    """
    Dependency function for FastAPI routes.
    Provides database session and ensures cleanup after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
