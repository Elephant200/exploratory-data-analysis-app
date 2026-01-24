from google import genai
from google.genai import types
import logging
from typing import List, Optional, BinaryIO, Generator, Dict, Any
import os
import io
import json
import csv
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_DEFAULT_MODEL = "gemini-3-flash-preview"
TOOLS = [{"code_execution": {}}]

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

SUPPORTED_EXTENSIONS = {'.csv', '.tsv', '.json', '.xlsx', '.xls', '.txt'}
MIME_TYPES = {
    '.csv': 'text/csv',
    '.tsv': 'text/tab-separated-values',
    '.json': 'application/json',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.txt': 'text/plain',
}


def convert_to_csv(file_content: bytes, filename: str) -> tuple[bytes, str]:
    """
    Convert various file formats to CSV for Gemini processing.
    
    Args:
        file_content: Raw file bytes
        filename: Original filename to determine format
        
    Returns:
        Tuple of (csv_bytes, original_extension)
    """
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == '.csv':
        return file_content, ext
    
    if ext == '.tsv':
        content = file_content.decode('utf-8')
        output = io.StringIO()
        reader = csv.reader(io.StringIO(content), delimiter='\t')
        writer = csv.writer(output)
        for row in reader:
            writer.writerow(row)
        return output.getvalue().encode('utf-8'), ext
    
    if ext == '.json':
        data = json.loads(file_content.decode('utf-8'))
        output = io.StringIO()
        if isinstance(data, list) and len(data) > 0:
            if isinstance(data[0], dict):
                writer = csv.DictWriter(output, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
            else:
                writer = csv.writer(output)
                for item in data:
                    writer.writerow([item] if not isinstance(item, list) else item)
        elif isinstance(data, dict):
            writer = csv.writer(output)
            writer.writerow(data.keys())
            writer.writerow(data.values())
        return output.getvalue().encode('utf-8'), ext
    
    if ext in ('.xlsx', '.xls'):
        try:
            import pandas as pd
            df = pd.read_excel(io.BytesIO(file_content))
            return df.to_csv(index=False).encode('utf-8'), ext
        except ImportError:
            logger.error("pandas not available for Excel conversion")
            raise ValueError("Excel file support requires pandas with openpyxl")
    
    if ext == '.txt':
        content = file_content.decode('utf-8')
        lines = content.strip().split('\n')
        if lines:
            first_line = lines[0]
            if '\t' in first_line:
                delimiter = '\t'
            elif ',' in first_line:
                delimiter = ','
            elif ';' in first_line:
                delimiter = ';'
            else:
                output = io.StringIO()
                writer = csv.writer(output)
                for line in lines:
                    writer.writerow([line])
                return output.getvalue().encode('utf-8'), ext
            
            output = io.StringIO()
            reader = csv.reader(io.StringIO(content), delimiter=delimiter)
            writer = csv.writer(output)
            for row in reader:
                writer.writerow(row)
            return output.getvalue().encode('utf-8'), ext
        return file_content, ext
    
    raise ValueError(f"Unsupported file type: {ext}")


class GeminiChatSession:
    """
    Wrapper around the Gemini Chat API that manages a conversation session.
    """
    
    def __init__(self, system_prompt: str, model: str = GEMINI_DEFAULT_MODEL):
        self.model = model
        self.system_prompt = system_prompt
        self.uploaded_file: Optional[types.File] = None
        self.uploaded_file_name: Optional[str] = None
        self.has_file_uploaded: bool = False
        self.file_sent_to_chat: bool = False
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
            # Message first, then file reference - so model sees question before file context
            response = self._chat.send_message([
                message,
                types.Part.from_uri(file_uri=file.uri, mime_type=file.mime_type)
            ])
            logger.debug(f"Response received: {response.text[:100] if response.text else 'No text'}...")
            return response.candidates[0].content.parts
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return [types.Part.from_text(text=f"Sorry, I ran into an error: {str(e)}")]

    def _process_stream_chunk(self, chunk) -> Generator[Dict[str, Any], None, None]:
        """Process a single stream chunk and yield content parts."""
        try:
            if not chunk or not chunk.candidates:
                return
            
            candidate = chunk.candidates[0]
            if not candidate.content or not candidate.content.parts:
                return
                
            for part in candidate.content.parts:
                if hasattr(part, 'text') and part.text:
                    yield {"type": "text", "content": part.text}
                elif hasattr(part, 'executable_code') and part.executable_code:
                    yield {"type": "code", "content": part.executable_code.code}
                elif hasattr(part, 'code_execution_result') and part.code_execution_result:
                    yield {"type": "result", "content": part.code_execution_result.output}
                elif hasattr(part, 'inline_data') and part.inline_data:
                    try:
                        image_data = base64.b64encode(
                            part.inline_data.data if isinstance(part.inline_data.data, bytes) 
                            else part.inline_data.data
                        ).decode("utf-8")
                        yield {"type": "image", "content": image_data}
                    except Exception as e:
                        logger.error(f"Error encoding image: {e}")
                        yield {"type": "error", "content": f"Error encoding image: {str(e)}"}
        except Exception as e:
            logger.warning(f"Error processing chunk: {e}")
            # Don't yield error for individual chunk failures, continue with stream

    def send_message_stream(self, message: str) -> Generator[Dict[str, Any], None, None]:
        """
        Stream message responses as structured chunks.
        
        Args:
            message: The user's message text
            
        Yields:
            Dict with 'type' and 'content' keys for each response part
        """
        try:
            logger.debug(f"Streaming message: {message[:100]}...")
            stream = self._chat.send_message_stream(message)
            
            for chunk in stream:
                yield from self._process_stream_chunk(chunk)
                
        except json.JSONDecodeError as e:
            logger.error(f"Gemini API returned invalid JSON: {str(e)}")
            yield {"type": "error", "content": "The API returned an invalid response. This may be due to server overload. Please try again."}
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Gemini streaming error: {error_msg}")
            
            # Provide more helpful error messages
            if "overloaded" in error_msg.lower() or "capacity" in error_msg.lower():
                yield {"type": "error", "content": "The model is currently overloaded. Please try again in a moment."}
            elif "quota" in error_msg.lower():
                yield {"type": "error", "content": "API quota exceeded. Please try again later."}
            else:
                yield {"type": "error", "content": f"Sorry, I ran into an error: {error_msg}"}

    def send_message_with_file_stream(self, message: str, file: types.File) -> Generator[Dict[str, Any], None, None]:
        """
        Stream message responses with a file reference.
        
        Args:
            message: The user's message text
            file: The uploaded file object from Gemini
            
        Yields:
            Dict with 'type' and 'content' keys for each response part
        """
        try:
            logger.debug(f"Streaming message with file: {message[:100]}...")
            # Message first, then file reference - so model sees question before file context
            stream = self._chat.send_message_stream([
                message,
                types.Part.from_uri(file_uri=file.uri, mime_type=file.mime_type)
            ])
            
            for chunk in stream:
                yield from self._process_stream_chunk(chunk)
                
        except json.JSONDecodeError as e:
            logger.error(f"Gemini API returned invalid JSON: {str(e)}")
            yield {"type": "error", "content": "The API returned an invalid response. This may be due to server overload. Please try again."}
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Gemini streaming error: {error_msg}")
            
            # Provide more helpful error messages
            if "overloaded" in error_msg.lower() or "capacity" in error_msg.lower():
                yield {"type": "error", "content": "The model is currently overloaded. Please try again in a moment."}
            elif "quota" in error_msg.lower():
                yield {"type": "error", "content": "API quota exceeded. Please try again later."}
            else:
                yield {"type": "error", "content": f"Sorry, I ran into an error: {error_msg}"}
    
    def upload_file(self, file: BinaryIO, filename: str) -> types.File:
        """
        Upload a file to Gemini and store the reference.
        Converts non-CSV files to CSV format before uploading.
        
        Args:
            file: File-like object to upload
            filename: Original filename for display
            
        Returns:
            The uploaded File object
        """
        if self.has_file_uploaded:
            raise ValueError("A file has already been uploaded. Please reload to upload a new file.")
        
        file_content = file.read()
        csv_content, original_ext = convert_to_csv(file_content, filename)
        
        self.uploaded_file = client.files.upload(
            file=io.BytesIO(csv_content),
            config=types.UploadFileConfig(
                mime_type="text/csv",
                display_name=filename
            )
        )
        self.uploaded_file_name = filename
        self.has_file_uploaded = True
        logger.info(f"File uploaded: {self.uploaded_file.name} (converted from {original_ext})")
        return self.uploaded_file
    
    def get_history(self) -> List[types.Content]:
        """Get the conversation history."""
        return self._chat.get_history()
    
    def reset(self):
        """Reset the chat session, clearing history and uploaded files."""
        self.uploaded_file = None
        self.uploaded_file_name = None
        self.has_file_uploaded = False
        self.file_sent_to_chat = False
        self._chat = self._create_chat()
        logger.info("Chat session reset")
