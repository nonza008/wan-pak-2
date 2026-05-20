from fastapi import APIRouter
from services.firebase_service import firebase_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
def get_analytics():
    summary = firebase_service.get_analytics_summary()
    return summary
