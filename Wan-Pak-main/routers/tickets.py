from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from services.firebase_service import firebase_service



router = APIRouter()



class UpdateStatusRequest(BaseModel):

    status: str # e.g., 'accepted', 'completed'



@router.get("/")

def get_tickets():

    """

    Get all tickets (mock or real Firestore).

    """

    tickets = firebase_service.get_all_tickets()

    return {"status": "success", "tickets": tickets}



@router.patch("/{ticket_id}/status")

def update_ticket_status(ticket_id: str, request: UpdateStatusRequest):

    """

    Update ticket status.

    """

    success = firebase_service.update_ticket_status(ticket_id, request.status)

    if not success:

        raise HTTPException(status_code=404, detail="Ticket not found or error updating")

   

    return {"status": "success", "message": f"Ticket {ticket_id} updated to {request.status}"}
