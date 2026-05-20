from fastapi import APIRouter
from services.firebase_service import firebase_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
def get_all_guests():
    guests = firebase_service.get_all_guests()
    return {"guests": guests}
