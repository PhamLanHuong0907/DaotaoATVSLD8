from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "ATVSLD Training System"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "atvsld_training"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_LESSON_MODEL: str = "gpt-4o-mini"
    OPENAI_MAX_COMPLETION_TOKENS: int = 16000

    # Kling AI (Video generation)
    KLING_ACCESS_KEY: str = ""
    KLING_SECRET_KEY: str = ""
    KLING_VIDEO_MODEL: str = "kling-v1"
    KLING_VIDEO_DURATION: str = "5"
    KLING_VIDEO_MODE: str = "std"

    # File Upload
    UPLOAD_DIR: str = "./uploads"
    EXPORT_DIR: str = "./exports"
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: list[str] = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".txt"]

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Auth / JWT
    JWT_SECRET: str = "CHANGE_ME_SUPER_SECRET_KEY_ATVSLD_2026"
    JWT_EXPIRE_MINUTES: int = 60 * 12       # access token: 12 hours
    JWT_REFRESH_EXPIRE_DAYS: int = 30       # refresh token: 30 days (remember-me)
    BOOTSTRAP_ADMIN_USERNAME: str = "admin"
    BOOTSTRAP_ADMIN_PASSWORD: str = "admin@123"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
