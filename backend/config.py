from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:test%40123@localhost:3306/goftustask"
    SECRET_KEY: str = "task-management-secret-key-2024-very-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 365  # 365 days

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
