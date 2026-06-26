import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "senverbalis"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 15

    @property
    def DATABASE_URL(self) -> str:
        env_url = os.environ.get("DATABASE_URL")
        if env_url:
            return env_url
        # Si DB_HOST est 'db' (Docker) ou si on a configuré PostgreSQL spécifiquement
        if os.environ.get("DB_HOST") == "db" or self.DB_HOST == "db":
            return (
                f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        # Par défaut en local hors Docker, utiliser SQLite pour simplifier le lancement
        return "sqlite:///./senverbalis.db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
