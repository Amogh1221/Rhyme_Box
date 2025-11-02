"""
Configuration settings for Rhyme Box application.
Loads environment variables from .env file and provides typed settings.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Force reload environment variables (useful for testing)
load_dotenv(override=True)

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./rhyme_box.db")
    
    # JWT authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "replace_this_with_a_random_secret")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # RAG (AI poem generation) configuration
    RAG_PERSIST_DIR: str = os.getenv("RAG_PERSIST_DIR", str(Path(__file__).parent.parent / "poem_chroma_bge_db"))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")  # OpenRouter API key
    
    # Cloudinary (image hosting) configuration
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # Email configuration (for password reset)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@rhymebox.com")
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    
    # Environment detection
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8000")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

# Debug output (only in development)
if settings.DEBUG:
    print(f"\n{'='*60}")
    print(f"⚙️  CONFIGURATION LOADED")
    print(f"{'='*60}")
    print(f"🔑 API Key: {'Configured' if settings.OPENAI_API_KEY else 'Missing'}")
    print(f"☁️  Cloudinary: {'Configured' if settings.CLOUDINARY_CLOUD_NAME else 'Missing'}")
    print(f"⏰ Token expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
    print(f"🌍 Environment: {settings.ENVIRONMENT}")
    print(f"{'='*60}\n")

# Disable verbose database logging in production
if settings.ENVIRONMENT == "production":
    import logging
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
