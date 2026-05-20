import os
import logging
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

class STTService:
    def __init__(self):
        # We use a smaller model for speed, but can be upgraded to 'large-v3' if needed.
        # compute_type "int8" helps run it faster on CPU/limited memory.
        self.model_size = "base" 
        logger.info(f"Loading faster-whisper model: {self.model_size}")
        try:
            self.model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
        except Exception as e:
            logger.error(f"Error loading Whisper model: {e}")
            self.model = None

    def transcribe_audio(self, audio_file_path: str) -> str:
        """
        Transcribes an audio file using faster-whisper.
        """
        if not self.model:
            return "Error: Whisper model not loaded."

        if not os.path.exists(audio_file_path):
            return f"Error: File not found {audio_file_path}"

        logger.info(f"Transcribing audio: {audio_file_path}")
        
        try:
            # We enforce language='th' for Thai
            segments, info = self.model.transcribe(audio_file_path, beam_size=5, language="th")
            
            transcript = ""
            for segment in segments:
                transcript += segment.text + " "
            
            logger.info(f"Transcription complete: {transcript.strip()}")
            return transcript.strip()
        except Exception as e:
            logger.error(f"Error during transcription: {e}")
            return f"Error transcribing audio: {str(e)}"

stt_service = STTService()
