import logging
import json
from groq import Groq
from core.config import settings

logger = logging.getLogger(__name__)

class NLPService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        try:
            self.client = Groq(api_key=self.api_key)
        except Exception as e:
            logger.error(f"Error initializing Groq client: {e}")
            self.client = None

    def analyze_intent(self, text: str, scenario: str) -> dict:
        """
        Analyzes the user's transcribed text to extract intent and relevant details using Groq (Llama 3.1).
        """
        if not self.client:
            return {
                "error": "Groq client not initialized. Check API Key.",
                "raw_text": text,
                "intent": "unknown",
                "extracted_data": {}
            }

        logger.info(f"Analyzing intent for scenario: {scenario}, text: {text}")

        system_prompt = f"""
        คุณคือ AI ระบบวิเคราะห์ความต้องการ (Intent Analysis) สำหรับโรงแรม 'Wan-Pak'
        ลูกค้าเพิ่งตอบกลับมาจากบริบท (Scenario): {scenario}
        
        วิเคราะห์ข้อความต่อไปนี้ และส่งกลับเป็นรูปแบบ JSON เท่านั้น
        รูปแบบ JSON ที่ต้องการ:
        {{
            "intent": "ชื่อ intent เช่น housekeeping, maintenance, room_service, info, pre_arrival, หรือ unknown",
            "sentiment": "positive, neutral, หรือ negative",
            "extracted_data": {{
                "time": "เวลาที่ลูกค้าต้องการ (ถ้ามี) เช่น 10:00, บ่ายสอง",
                "items": "สิ่งของที่ลูกค้าต้องการ (เช่น ผ้าเช็ดตัว, น้ำเปล่า)",
                "quantity": "จำนวนที่ต้องการ ให้ตอบเป็นตัวเลขเท่านั้น (เช่น 1, 2, 3)",
                "unit": "หน่วยของสิ่งของ (ถ้ามี) เช่น ขวด, ผืน",
                "notes": "หมายเหตุเพิ่มเติม (ถ้ามี)"
            }}
        }}
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": text,
                    }
                ],
                model="llama-3.1-8b-instant", # Using the fast 8b model
                temperature=0.0, # low temp for consistent JSON output
                response_format={"type": "json_object"}
            )
            
            result_str = chat_completion.choices[0].message.content
            result_json = json.loads(result_str)
            logger.info(f"Intent analysis result: {result_json}")
            return result_json
            
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            return {
                "error": str(e),
                "raw_text": text,
                "intent": "error",
                "extracted_data": {}
            }

nlp_service = NLPService()
