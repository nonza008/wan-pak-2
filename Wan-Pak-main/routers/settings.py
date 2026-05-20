import os
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

class SettingsUpdate(BaseModel):
    groq_api_key: str | None = None
    botnoi_api_key: str | None = None

@router.get("/")
def get_settings():
    return {
        "groq_api_key": settings.GROQ_API_KEY if settings.GROQ_API_KEY != "your_groq_api_key_here" else "",
        "botnoi_api_key": settings.BOTNOI_API_KEY if settings.BOTNOI_API_KEY != "your_botnoi_api_key_here" else "",
    }

@router.post("/")
def update_settings(data: SettingsUpdate):
    # Update settings object in memory
    if data.groq_api_key is not None:
        settings.GROQ_API_KEY = data.groq_api_key
        # Re-initialize the groq client
        from services.nlp_service import nlp_service
        from groq import Groq
        try:
            if data.groq_api_key:
                nlp_service.client = Groq(api_key=data.groq_api_key)
            else:
                nlp_service.client = None
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}")
            
    if data.botnoi_api_key is not None:
        settings.BOTNOI_API_KEY = data.botnoi_api_key
        
    # Write to .env file to persist
    env_lines = []
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            env_lines = f.readlines()
            
    keys_to_update = {"GROQ_API_KEY": settings.GROQ_API_KEY, "BOTNOI_API_KEY": settings.BOTNOI_API_KEY}
    
    new_env_lines = []
    for line in env_lines:
        updated = False
        for k, v in list(keys_to_update.items()):
            if line.startswith(f"{k}="):
                new_env_lines.append(f"{k}={v}\n")
                del keys_to_update[k]
                updated = True
                break
        if not updated:
            new_env_lines.append(line)
            
    # Add any remaining keys that weren't in the file
    for k, v in keys_to_update.items():
        if v and v != "your_botnoi_api_key_here" and v != "your_groq_api_key_here":
            new_env_lines.append(f"{k}={v}\n")
            
    with open(".env", "w", encoding="utf-8") as f:
        f.writelines(new_env_lines)
        
    return {"status": "success", "message": "Settings updated successfully"}
