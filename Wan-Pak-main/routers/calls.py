import os
import shutil
from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks, HTTPException
from pydantic import BaseModel
from services.botnoi_service import botnoi_service
from services.stt_service import stt_service
from services.nlp_service import nlp_service
from services.firebase_service import firebase_service
import logging
import threading

logger = logging.getLogger(__name__)

router = APIRouter()
MAX_CONCURRENT_OUTBOUND_CALLS = 3
_active_outbound_calls = 0
_outbound_calls_lock = threading.Lock()

class TriggerCallRequest(BaseModel):
    room_number: str
    phone_number: str
    scenario: str

class RingBellRequest(BaseModel):
    room_number: str
    scenario: str | None = None

import asyncio
from services.nlp_service import nlp_service

def build_notification_target(scenario: str | None) -> tuple[str, str]:
    scenario_key = (scenario or "").lower()
    mapping = {
        "housekeeping": ("housekeeping", "แม่บ้าน"),
        "maintenance": ("maintenance", "ช่างซ่อมบำรุง"),
        "room_service": ("room_service", "รูมเซอร์วิส"),
    }
    return mapping.get(scenario_key, ("staff", "พนักงาน"))

def try_acquire_outbound_slot() -> bool:
    global _active_outbound_calls
    with _outbound_calls_lock:
        if _active_outbound_calls >= MAX_CONCURRENT_OUTBOUND_CALLS:
            return False
        _active_outbound_calls += 1
        return True

def release_outbound_slot():
    global _active_outbound_calls
    with _outbound_calls_lock:
        _active_outbound_calls = max(0, _active_outbound_calls - 1)

@router.get("/capacity")
def outbound_capacity():
    with _outbound_calls_lock:
        active_calls = _active_outbound_calls
    return {
        "status": "success",
        "channels": {
            "web_qr_guest_bell": "/guest/ring",
            "staff_mobile_app": "/api/tickets + push",
            "ai_call_webhook": "/api/calls/botnoi_webhook",
        },
        "outbound": {
            "active_calls": active_calls,
            "max_concurrent_calls": MAX_CONCURRENT_OUTBOUND_CALLS,
            "available_slots": max(0, MAX_CONCURRENT_OUTBOUND_CALLS - active_calls),
        },
    }

async def simulate_call_completion(room_number: str, scenario: str):
    """Simulate the webhook response from Botnoi after a few seconds for demonstration."""
    try:
        await asyncio.sleep(4) # Wait 4 seconds to simulate call duration
    
        # Mock transcript based on scenario
        mock_transcripts = {
            "housekeeping": "ให้แม่บ้านเข้ามาตอนสิบโมงเช้าเลยจ้า",
            "maintenance": "โอเคครับ เข้ามาดูตอนนี้ได้เลย",
            "room_service": "ขอน้ำเปล่าเพิ่มสองขวดด้วยนะ",
            "info": "โอเคขอบคุณครับ ช่วยเตรียมรถให้ด้วยตอนเที่ยง",
            "pre_arrival": "ขอหมอนเพิ่มสองใบครับ"
        }
        transcript = mock_transcripts.get(scenario, "โอเคครับ")
        
        # 2. NLP / Intent Classification
        nlp_result = nlp_service.analyze_intent(transcript, scenario)
        
        # 3. Create Ticket
        ticket = firebase_service.create_ticket(room_number, scenario, nlp_result)
        logger.info(f"Mock ticket created for demonstration: {ticket}")
        if "ticket_id" in ticket:
            topic, department = build_notification_target(scenario)
            title = f"งานใหม่ {department}: ห้อง {room_number}"
            body = f"Scenario: {scenario} | Intent: {nlp_result.get('intent')}"
            firebase_service.send_push_notification(
                title,
                body,
                topic=topic,
                data={
                    "ticket_id": ticket.get("ticket_id", ""),
                    "room_number": room_number,
                    "scenario": scenario,
                    "department": department,
                },
            )
    finally:
        release_outbound_slot()

@router.post("/trigger_call")
def trigger_call(request: TriggerCallRequest, background_tasks: BackgroundTasks):
    """
    Trigger an outbound call using Botnoi API based on scenario.
    """
    if not try_acquire_outbound_slot():
        raise HTTPException(
            status_code=429,
            detail=f"Outbound calls are busy (max {MAX_CONCURRENT_OUTBOUND_CALLS} concurrent calls). Please retry shortly.",
        )
    logger.info(f"Received request to trigger call for room {request.room_number}")
    try:
        result = botnoi_service.trigger_outbound_call(request.phone_number, request.scenario)
    except Exception:
        release_outbound_slot()
        raise
    
    # Add simulation task so the user can see tickets appearing in the UI!
    background_tasks.add_task(simulate_call_completion, request.room_number, request.scenario)
    
    return {"status": "success", "data": result}

@router.post("/ring")
def ring_guest(request: RingBellRequest, background_tasks: BackgroundTasks):
    """
    One-button outbound trigger: room only. Phone number is resolved from guest data.
    """
    if not try_acquire_outbound_slot():
        raise HTTPException(
            status_code=429,
            detail=f"Outbound calls are busy (max {MAX_CONCURRENT_OUTBOUND_CALLS} concurrent calls). Please retry shortly.",
        )

    guest = firebase_service.get_guest_by_room(request.room_number)
    if not guest:
        release_outbound_slot()
        raise HTTPException(status_code=404, detail=f"Guest not found for room {request.room_number}")

    phone_number = guest.get("phone_number")
    if not phone_number:
        release_outbound_slot()
        raise HTTPException(status_code=400, detail=f"Room {request.room_number} has no phone number")

    scenario = request.scenario or guest.get("preferred_scenario") or "housekeeping"
    logger.info(f"Ring bell outbound request for room {request.room_number} -> {phone_number} ({scenario})")
    try:
        result = botnoi_service.trigger_outbound_call(phone_number, scenario)
    except Exception:
        release_outbound_slot()
        raise
    background_tasks.add_task(simulate_call_completion, request.room_number, scenario)

    return {
        "status": "success",
        "message": "Outbound call triggered from ring bell",
        "room_number": request.room_number,
        "phone_number": phone_number,
        "scenario": scenario,
        "data": result,
    }

def process_webhook_audio(audio_path: str, room_number: str, scenario: str):
    """
    Background task to process audio, find intent, and create ticket.
    """
    logger.info(f"Processing webhook audio for room {room_number}")
    
    # 1. Speech-to-Text
    transcript = stt_service.transcribe_audio(audio_path)
    
    # 2. NLP / Intent Classification
    nlp_result = nlp_service.analyze_intent(transcript, scenario)
    
    # 3. Create Ticket
    ticket = firebase_service.create_ticket(room_number, scenario, nlp_result)
    
    # 4. Push Notification to Staff
    if "ticket_id" in ticket:
        topic, department = build_notification_target(scenario)
        title = f"งานใหม่ {department}: ห้อง {room_number}"
        body = f"Scenario: {scenario} | Intent: {nlp_result.get('intent')} | Note: {nlp_result.get('extracted_data', {}).get('notes', '')}"
        firebase_service.send_push_notification(
            title,
            body,
            topic=topic,
            data={
                "ticket_id": ticket.get("ticket_id", ""),
                "room_number": room_number,
                "scenario": scenario,
                "department": department,
            },
        )

    # Clean up audio file
    if os.path.exists(audio_path):
        os.remove(audio_path)

@router.post("/botnoi_webhook")
async def botnoi_webhook(
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    room_number: str = Form(...),
    scenario: str = Form(...)
):
    """
    Webhook to receive audio from Botnoi when the call finishes.
    """
    logger.info(f"Received webhook for room {room_number}")
    
    # Save the uploaded audio file temporarily
    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, audio_file.filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(audio_file.file, buffer)
        
    # Process the audio in the background to avoid blocking the webhook response
    background_tasks.add_task(process_webhook_audio, temp_path, room_number, scenario)
    
    return {"status": "success", "message": "Webhook received and processing started."}

class BotnoiInboundPayload(BaseModel):
    transcript: str
    phone_number: str | None = None
    room_number: str | None = "Unknown"
    scenario: str | None = "inbound_call"

def process_inbound_transcript(payload: BotnoiInboundPayload):
    logger.info(f"Processing inbound transcript for room {payload.room_number}")
    
    # 1. NLP / Intent Classification using Groq
    nlp_result = nlp_service.analyze_intent(payload.transcript, payload.scenario)
    
    # 2. Create Ticket in Firebase
    ticket = firebase_service.create_ticket(payload.room_number, payload.scenario, nlp_result)
    
    # 3. Push Notification to Staff Mobile App
    if "ticket_id" in ticket:
        topic, department = build_notification_target(payload.scenario)
        title = f"สายเข้าใหม่ (Inbound): ห้อง {payload.room_number}"
        items = nlp_result.get('extracted_data', {}).get('items', '')
        qty = nlp_result.get('extracted_data', {}).get('quantity', '')
        body = f"ความต้องการ: {items} {qty} | Intent: {nlp_result.get('intent')}"
        firebase_service.send_push_notification(
            title,
            body,
            topic=topic,
            data={
                "ticket_id": ticket.get("ticket_id", ""),
                "room_number": payload.room_number or "",
                "scenario": payload.scenario or "",
                "department": department,
            },
        )

@router.post("/inbound_webhook")
async def inbound_webhook(payload: BotnoiInboundPayload, background_tasks: BackgroundTasks):
    """
    Webhook to receive JSON transcript from Botnoi Inbound calls.
    """
    logger.info(f"Received inbound webhook: {payload}")
    
    # Process in background to return 200 OK to Botnoi immediately
    background_tasks.add_task(process_inbound_transcript, payload)
    
    return {"status": "success", "message": "Inbound transcript received"}
