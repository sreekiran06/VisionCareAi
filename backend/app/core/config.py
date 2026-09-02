from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    DATABASE_URL: str = "sqlite:///./visioncare.db"
    
    CORS_ORIGINS: Union[str, List[str]] = (
        "http://localhost:3000,"
        "http://localhost:3001,"
        "http://localhost:5173,"
        "http://127.0.0.1:3000,"
        "http://127.0.0.1:5173"
    )

    
    # CV Settings
    EAR_THRESHOLD: float = 0.21
    MAR_THRESHOLD: float = 0.6
    CONSECUTIVE_FRAMES_ALERT: int = 15
    DETECTOR_MODEL_PATH: str = "app/cv/models/shape_predictor_68_face_landmarks.dat"
    
    # Notifications
    NOTIFICATIONS_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    ALERT_EMAIL_FROM: str = ""
    
    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    
    @field_validator("CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
