from google import genai
from google.genai import types
import logging
from typing import List, Optional
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_DEFAULT_MODEL = "gemini-3-flash-preview"
TOOLS = [{"code_execution": {}}]

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


class GeminiChatSession:
    """
    Wrapper around the Gemini Chat API that manages a conversation session.
    """
    
    def __init__(self, system_prompt: str, model: str = GEMINI_DEFAULT_MODEL):
        self.model = model
        self.system_prompt = system_prompt
        self.uploaded_file: Optional[types.File] = None
        self.uploaded_file_name: Optional[str] = None
        self._chat = self._create_chat()
    
    def _create_chat(self):
        """Create a new chat session with the configured system prompt."""
        return client.chats.create(
            model=self.model,
            config=types.GenerateContentConfig(
                system_instruction=self.system_prompt,
                tools=TOOLS
            )
        )
    
    def send_message(self, message: str) -> List[types.Part]:
        """
        Send a message and get a response.
        
        Args:
            message: The user's message text
            
        Returns:
            List of Part objects containing the response
        """
        try:
            logger.debug(f"Sending message: {message[:100]}...")
            response = self._chat.send_message(message)
            logger.debug(f"Response received: {response.text[:100] if response.text else 'No text'}...")
            return response.candidates[0].content.parts
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return [types.Part.from_text(text=f"Sorry, I ran into an error: {str(e)}")]
    
    def send_message_with_file(self, message: str, file: types.File) -> List[types.Part]:
        """
        Send a message along with a file reference.
        
        Args:
            message: The user's message text
            file: The uploaded file object from Gemini
            
        Returns:
            List of Part objects containing the response
        """
        try:
            logger.debug(f"Sending message with file: {message[:100]}...")
            response = self._chat.send_message([
                types.Part.from_uri(file_uri=file.uri, mime_type=file.mime_type),
                message
            ])
            logger.debug(f"Response received: {response.text[:100] if response.text else 'No text'}...")
            return response.candidates[0].content.parts
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return [types.Part.from_text(text=f"Sorry, I ran into an error: {str(e)}")]
    
    def upload_file(self, file, filename: str) -> types.File:
        """
        Upload a file to Gemini and store the reference.
        
        Args:
            file: File-like object to upload
            filename: Original filename for display
            
        Returns:
            The uploaded File object
        """
        self.uploaded_file = client.files.upload(
            file=file,
            config=types.UploadFileConfig(
                mime_type="text/csv",
                display_name=filename
            )
        )
        self.uploaded_file_name = filename
        logger.info(f"File uploaded: {self.uploaded_file.name}")
        return self.uploaded_file
    
    def get_history(self) -> List[types.Content]:
        """Get the conversation history."""
        return self._chat.get_history()
    
    def reset(self):
        """Reset the chat session, clearing history and uploaded files."""
        self.uploaded_file = None
        self.uploaded_file_name = None
        self._chat = self._create_chat()
        logger.info("Chat session reset")
