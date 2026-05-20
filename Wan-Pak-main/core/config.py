import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aura AI Voice Concierge"
    
    # API Keys (Placeholders)
    BOTNOI_API_KEY: str = os.getenv("BOTNOI_API_KEY", "your_botnoi_api_key_here")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "your_groq_api_key_here")
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
    APP_BASE_URL: str = os.getenv("APP_BASE_URL", "http://localhost:8000")

settings = Settings()
