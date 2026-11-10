import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
LEGAL_DATA_DIR = BASE_DIR.parent / "legal_data"
RAW_DATA_DIR = LEGAL_DATA_DIR / "raw"
PROCESSED_DATA_DIR = LEGAL_DATA_DIR / "processed"
UPLOADS_DIR = BASE_DIR / "uploads"

# Ensure directories exist
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Explicitly load .env from backend/.env and workspace root .env
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

# Prevent httpx SSLKEYLOGFILE permission errors on Windows
os.environ.pop("SSLKEYLOGFILE", None)

class Settings(BaseSettings):
    PROJECT_NAME: str = "NyayaSuno – Voice-First AI Legal Information Assistant"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "nyayasuno-super-secret-jwt-key-2026-prod-dev")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # AI & Gemini API
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    GEMINI_EMBEDDING_MODEL: str = "models/text-embedding-004"

    # Supabase (PostgreSQL & Auth)
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY", None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", None)
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", None)

    # Voice / STT / TTS - Wispr Flow (Scaler x Wispr Flow Hackathon Primary Engine)
    WISPR_FLOW_API_KEY: Optional[str] = os.getenv("WISPR_FLOW_API_KEY", None)
    WISPR_FLOW_API_URL: str = os.getenv("WISPR_FLOW_API_URL", "https://platform-api.wisprflow.ai/api/v1/dash/api")
    WISPR_FLOW_WARMUP_URL: str = os.getenv("WISPR_FLOW_WARMUP_URL", "https://platform-api.wisprflow.ai/api/v1/dash/warmup_dash")

    # Secondary Speech Fallbacks
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", None)
    WHISPER_API_KEY: Optional[str] = os.getenv("WHISPER_API_KEY", None)
    BHASHINI_USER_ID: Optional[str] = os.getenv("BHASHINI_USER_ID", None)
    BHASHINI_API_KEY: Optional[str] = os.getenv("BHASHINI_API_KEY", None)
    BHASHINI_PIPELINE_ID: Optional[str] = os.getenv("BHASHINI_PIPELINE_ID", None)

    # Allowed CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://nyayasuno.vercel.app",
        "*"
    ]

    class Config:
        env_file = [str(BASE_DIR / ".env"), str(BASE_DIR.parent / ".env"), ".env"]
        extra = "allow"

settings = Settings()
