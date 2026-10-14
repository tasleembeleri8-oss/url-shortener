from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "postgresql://shortener:shortener@localhost:5432/shortener"
    redis_url: str = "redis://localhost:6379/0"
    base_url: str = "http://localhost:8000"
    secret_key: str
    algorithm: str = "HS256"
    access_token_minutes: int = 60

settings = Settings()