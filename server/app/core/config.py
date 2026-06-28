import os
import json
from pydantic_settings import BaseSettings
from typing import Optional, List, Union

def get_cors_origins() -> List[str]:
    origins_str = os.getenv("BACKEND_CORS_ORIGINS")
    default_origins = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "https://neuron-dash.vercel.app"
    ]
    if not origins_str:
        return default_origins
    
    if origins_str.startswith("[") and origins_str.endswith("]"):
        try:
            return json.loads(origins_str)
        except Exception:
            pass
            
    return [o.strip() for o in origins_str.split(",") if o.strip()]

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuronDash AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "SUPER_SECRET_NEURAL_TOKEN_129481" # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    BACKEND_CORS_ORIGINS: List[str] = get_cors_origins()
    
    # DB CONFIGS
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "neurondash"
    DATABASE_URL: Optional[str] = None
    
    # Storage settings
    UPLOAD_DIR: str = "uploads"
    CLEANED_DIR: str = "cleaned"

    # LLM settings
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            # Render PostgreSQL URL starts with postgres://, but SQLAlchemy 2.0 requires postgresql://
            if self.DATABASE_URL.startswith("postgres://"):
                return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
            return self.DATABASE_URL
        return "sqlite:///./neurondash.db"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
