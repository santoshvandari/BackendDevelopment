import json
from dotenv import load_dotenv
import os

load_dotenv()


class ConfigurationError(Exception):
    pass


def get_required_env(key: str) -> str:
    value = os.getenv(key)
    if value is None:
        raise ConfigurationError(f"{key} environment variable is not set")
    return value


def get_optional_env(key: str, default: str) -> str:
    return os.getenv(key, default)


class Settings:
    def __init__(self):
        # Database settings
        self.DATABASE_URL: str = get_required_env("DATABASE_URL")

        # CORS settings
        self.CORS_ORIGINS: str = get_required_env("CORS_ORIGINS")

        # JWT settings
        self.SECRET_KEY: str = get_required_env("SECRET_KEY")
        self.ALGORITHM: str = get_optional_env("ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
            get_optional_env("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
        )  # Default 24 hours

        # Single Admin User settings (passed individually via .env)
        self.ADMIN_USERNAME: str = get_required_env("ADMIN_USERNAME")
        self.ADMIN_HASHED_PASSWORD: str = get_required_env("ADMIN_HASHED_PASSWORD")
        self.ADMIN_FULL_NAME: str = get_optional_env("ADMIN_FULL_NAME", "")
        self.ADMIN_EMAIL: str = get_optional_env("ADMIN_EMAIL", "")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


try:
    settings = Settings()
except ConfigurationError as e:
    # Re-raise with more context
    raise ConfigurationError(
        f"Failed to load configuration: {e}\n"
        "Please ensure all required environment variables are set in your .env file."
    ) from e
