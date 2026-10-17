from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "postgresql://shortener:shortener@localhost:5432/shortener"
    redis_url: str = "redis://localhost:6379/0"
    base_url: str = "https://url-shortener-n5z1.onrender.com"
    secret_key: str
    algorithm: str = "HS256"
    access_token_minutes: int = 60
    rate_limit_enabled: bool = True
    cache_enabled: bool = True
    cors_origins: str = "http://localhost:5173"

settings = Settings()