from pydantic_settings import BaseSettings
from typing import Optional, List, Union
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuronDash AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "SUPER_SECRET_NEURAL_TOKEN_129481" # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "https://neuron-dash.vercel.app"
    ]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
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
