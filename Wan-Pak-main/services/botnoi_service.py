import requests
import logging
from core.config import settings

logger = logging.getLogger(__name__)

class BotnoiService:
    def __init__(self):
        self.api_key = settings.BOTNOI_API_KEY
        # Placeholder endpoint since we don't have the real one yet
        self.outbound_endpoint = "https://api.botnoi.ai/voice/outbound" 

    def trigger_outbound_call(self, phone_number: str, scenario: str) -> dict:
        """
        Mock function to trigger an outbound call via Botnoi Voice API.
        """
        logger.info(f"Triggering mock outbound call to {phone_number} for scenario {scenario}")
        
        # Scenario scripts for TTS (Aura Concierge)
        scripts = {
            "housekeeping": "สวัสดีค่ะ ออร่า จากโรงแรมวันพักค่ะ ไม่ทราบว่าสะดวกให้แม่บ้านเข้าไปทำความสะอาดห้องเวลาไหนคะ?",
            "maintenance": "สวัสดีค่ะ ออร่า จากโรงแรมวันพักค่ะ ช่างซ่อมได้ทำการแก้ไขปัญหาเรียบร้อยแล้ว ขออนุญาตเข้าไปตรวจสอบความเรียบร้อยได้ไหมคะ?",
            "room_service": "สวัสดีค่ะ ออร่า จากโรงแรมวันพักค่ะ อาหารที่สั่งไว้กำลังนำไปเสิร์ฟนะคะ",
            "info": "สวัสดีค่ะ ออร่า จากโรงแรมวันพักค่ะ พรุ่งนี้เป็นวันเช็คเอาท์ ไม่ทราบว่าต้องการให้ช่วยเตรียมรถหรือยกกระเป๋าไหมคะ?",
            "pre_arrival": "สวัสดีค่ะ ออร่า จากโรงแรมวันพักค่ะ พรุ่งนี้คุณมีกำหนดเข้าพักกับเรา ไม่ทราบว่าต้องการเตรียมเตียงเสริมหรือหมอนเพิ่มเติมไหมคะ?"
        }

        script = scripts.get(scenario, "สวัสดีค่ะ ออร่า จากโรงแรมวันพักค่ะ มีอะไรให้รับใช้คะ?")

        payload = {
            "phone_number": phone_number,
            "text": script,
            "voice": "female_1", # Example voice
            "webhook_url": f"{settings.APP_BASE_URL.rstrip('/')}/api/calls/botnoi_webhook"
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Since we don't have the real API, we just mock the successful response
        # try:
        #     response = requests.post(self.outbound_endpoint, json=payload, headers=headers)
        #     response.raise_for_status()
        #     return response.json()
        # except Exception as e:
        #     logger.error(f"Error calling Botnoi API: {e}")
        #     return {"error": str(e)}

        return {
            "status": "success",
            "message": "Mock call triggered successfully",
            "call_id": "mock_call_12345",
            "details": payload
        }

botnoi_service = BotnoiService()
