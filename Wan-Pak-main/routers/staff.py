from fastapi import APIRouter
from pydantic import BaseModel
from services.firebase_service import firebase_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class StaffUpdate(BaseModel):
    name: str | None = None
    shift: str | None = None
    status: str | None = None

class RegisterPushTokenRequest(BaseModel):
    token: str

@router.get("/")
def get_all_staff():
    staff = firebase_service.get_all_staff()
    return {"staff": staff}

@router.patch("/{staff_id}")
def update_staff(staff_id: str, data: StaffUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    success = firebase_service.update_staff(staff_id, update_data)
    if success:
        return {"status": "success", "message": "Staff updated"}
    return {"status": "error", "message": "Failed to update staff"}

@router.post("/push-token")
def register_push_token(payload: RegisterPushTokenRequest):
    success = firebase_service.register_expo_push_token(payload.token)
    if success:
        return {"status": "success", "message": "Push token registered"}
    return {"status": "error", "message": "Failed to register push token"}
