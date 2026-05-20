import logging
import datetime
import uuid
import os
import requests
import firebase_admin
from firebase_admin import credentials, firestore, messaging
from core.config import settings

logger = logging.getLogger(__name__)

class FirebaseService:
    def __init__(self):
        self.initialized = False
        self.db = None
        
        # Try to initialize Firebase Admin SDK
        if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            try:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.initialized = True
                logger.info("Firebase Admin initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase Admin: {e}")
        else:
            logger.warning(f"Firebase credentials file not found at {settings.FIREBASE_CREDENTIALS_PATH}. Running in mock mode.")
            
        # For mock storage when Firebase is not initialized
        self.mock_tickets = {}
        self.mock_push_tokens = set()
        self.mock_guests = self._default_mock_guests()

    def _default_mock_guests(self) -> list[dict]:
        return [
            {
                "room_number": "101",
                "guest_name": "คุณวิชาญ สุขใจ",
                "phone_number": "+66810000001",
                "preferred_scenario": "housekeeping",
                "check_out_date": "2024-05-15",
                "status": "checked-in",
            },
            {
                "room_number": "204",
                "guest_name": "Mr. John Doe",
                "phone_number": "+66810000002",
                "preferred_scenario": "room_service",
                "check_out_date": "2024-05-13",
                "status": "checked-in",
            },
            {
                "room_number": "402",
                "guest_name": "คุณสมหญิง จันทร์เพ็ญ",
                "phone_number": "+66810000003",
                "preferred_scenario": "maintenance",
                "check_out_date": "2024-05-14",
                "status": "checked-in",
            },
        ]

    def create_ticket(self, room_number: str, scenario: str, nlp_result: dict) -> dict:
        """
        Creates a ticket in Firestore. If not initialized, stores in mock dict.
        """
        ticket_id = str(uuid.uuid4())
        ticket_data = {
            "ticket_id": ticket_id,
            "room_number": room_number,
            "scenario": scenario,
            "intent": nlp_result.get("intent", "unknown"),
            "extracted_data": nlp_result.get("extracted_data", {}),
            "status": "pending", # pending, accepted, completed
            "created_at": datetime.datetime.utcnow().isoformat(),
            "updated_at": datetime.datetime.utcnow().isoformat()
        }
        
        if self.initialized and self.db:
            try:
                self.db.collection('tickets').document(ticket_id).set(ticket_data)
                logger.info(f"Ticket {ticket_id} created in Firestore.")
            except Exception as e:
                logger.error(f"Error creating ticket in Firestore: {e}")
                return {"error": str(e)}
        else:
            # Mock mode
            self.mock_tickets[ticket_id] = ticket_data
            logger.info(f"Ticket {ticket_id} created in MOCK storage.")
            
        return ticket_data

    def send_push_notification(self, title: str, body: str, topic: str = "staff", data: dict | None = None) -> bool:
        """
        Sends push notifications to staff via FCM topic and Expo tokens.
        """
        fcm_sent = False
        expo_sent = False

        if self.initialized:
            try:
                message_data = {k: str(v) for k, v in (data or {}).items()}
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=body,
                    ),
                    topic=topic,
                    data=message_data,
                )
                response = messaging.send(message)
                logger.info(f"Successfully sent FCM message: {response}")
                fcm_sent = True
            except Exception as e:
                logger.error(f"Error sending FCM message: {e}")
        else:
            logger.info(f"MOCK FCM Push Notification - Topic: {topic} | Title: {title} | Body: {body}")

        expo_tokens = self.get_expo_push_tokens()
        if expo_tokens:
            payload = []
            for token in expo_tokens:
                payload.append({
                    "to": token,
                    "title": title,
                    "body": body,
                    "sound": "default",
                    "channelId": "default",
                    "priority": "high",
                    "data": data or {},
                })
            try:
                response = requests.post(
                    "https://exp.host/--/api/v2/push/send",
                    json=payload,
                    headers={
                        "Accept": "application/json",
                        "Accept-encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                    timeout=10,
                )
                response.raise_for_status()
                expo_sent = True
            except Exception as e:
                logger.error(f"Error sending Expo push notification: {e}")
        else:
            logger.info("No Expo push tokens registered yet.")

        return fcm_sent or expo_sent or not self.initialized

    def register_expo_push_token(self, token: str) -> bool:
        if not token:
            return False

        if self.initialized and self.db:
            try:
                self.db.collection("push_tokens").document(token).set(
                    {
                        "token": token,
                        "platform": "expo",
                        "updated_at": datetime.datetime.utcnow().isoformat(),
                    },
                    merge=True,
                )
                return True
            except Exception as e:
                logger.error(f"Error registering Expo push token: {e}")
                return False

        self.mock_push_tokens.add(token)
        return True

    def get_expo_push_tokens(self) -> list[str]:
        if self.initialized and self.db:
            try:
                docs = self.db.collection("push_tokens").where("platform", "==", "expo").stream()
                return [doc.to_dict().get("token") for doc in docs if doc.to_dict().get("token")]
            except Exception as e:
                logger.error(f"Error reading Expo push tokens: {e}")
                return []
        return list(self.mock_push_tokens)
            
    def get_all_tickets(self):
        """
        Retrieves all tickets.
        """
        if self.initialized and self.db:
            try:
                docs = self.db.collection('tickets').stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Error fetching tickets: {e}")
                return []
        else:
            return list(self.mock_tickets.values())
            
    def update_ticket_status(self, ticket_id: str, new_status: str):
        """
        Updates the status of a ticket.
        """
        if self.initialized and self.db:
            try:
                doc_ref = self.db.collection('tickets').document(ticket_id)
                doc_ref.update({
                    "status": new_status,
                    "updated_at": datetime.datetime.utcnow().isoformat()
                })
                return True
            except Exception as e:
                logger.error(f"Error updating ticket: {e}")
                return False
        else:
            if ticket_id in self.mock_tickets:
                self.mock_tickets[ticket_id]["status"] = new_status
                self.mock_tickets[ticket_id]["updated_at"] = datetime.datetime.utcnow().isoformat()
                return True
            return False

    def get_all_staff(self):
        if not self.initialized or not self.db:
            return []
        try:
            docs = list(self.db.collection('staff').stream())
            if not docs:
                mock_staff = [
                    {"id": "1", "name": "สมหญิง รักสะอาด", "role": "แม่บ้าน (Housekeeping)", "shift": "08:00 - 17:00", "status": "checked-in"},
                    {"id": "2", "name": "สมชาย ใจดี", "role": "แม่บ้าน (Housekeeping)", "shift": "08:00 - 17:00", "status": "pending"},
                    {"id": "3", "name": "วิชัย ซ่อมเก่ง", "role": "ช่างซ่อมบำรุง (Maintenance)", "shift": "10:00 - 19:00", "status": "checked-in"}
                ]
                for s in mock_staff:
                    self.db.collection('staff').document(s["id"]).set(s)
                return mock_staff
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Error fetching staff: {e}")
            return []

    def update_staff(self, staff_id: str, data: dict):
        if not self.initialized or not self.db:
            return False
        try:
            self.db.collection('staff').document(staff_id).set(data, merge=True)
            return True
        except Exception as e:
            logger.error(f"Error updating staff: {e}")
            return False

    def get_all_guests(self):
        if not self.initialized or not self.db:
            return self.mock_guests
        try:
            docs = list(self.db.collection('guests').stream())
            if not docs:
                for g in self.mock_guests:
                    self.db.collection('guests').document(g["room_number"]).set(g)
                return self.mock_guests
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Error fetching guests: {e}")
            return []

    def get_guest_by_room(self, room_number: str) -> dict | None:
        if not room_number:
            return None

        room_key = str(room_number).strip()
        if not self.initialized or not self.db:
            return next((g for g in self.mock_guests if g.get("room_number") == room_key), None)

        try:
            doc = self.db.collection("guests").document(room_key).get()
            if doc.exists:
                return doc.to_dict()

            matches = self.db.collection("guests").where("room_number", "==", room_key).limit(1).stream()
            for guest in matches:
                return guest.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error fetching guest by room {room_key}: {e}")
            return None

    def get_analytics_summary(self):
        tickets = self.get_all_tickets()
        total_calls = len(tickets)
        completed = sum(1 for t in tickets if t.get('status') == 'completed')
        escalated = sum(1 for t in tickets if t.get('status') == 'escalated')
        
        success_rate = round((completed / total_calls * 100) if total_calls > 0 else 0)
        escalation_rate = round((escalated / total_calls * 100) if total_calls > 0 else 0)
        
        intents = {}
        for t in tickets:
            intent = t.get('scenario', 'unknown')
            intents[intent] = intents.get(intent, 0) + 1
            
        return {
            "total_calls": total_calls,
            "success_rate": f"{success_rate}%",
            "escalation_rate": f"{escalation_rate}%",
            "avg_talk_time": "45 วินาที",
            "top_scenarios": intents
        }

firebase_service = FirebaseService()
