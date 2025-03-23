from google import genai
from google.genai import types
import logging
from typing import Any, List, Literal

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_DEFAULT_MODEL = "gemini-2.0-flash"

TOOLS = [
    {"code_execution": {}}
]

# Configure OpenAI client
client = genai.Client()

async def get_response(
    messages: List[types.Content],
    system_prompt: str = "You are a helpful assistant that always answers questions.",
    model: str = GEMINI_DEFAULT_MODEL,
) -> List[types.Part]:
    """
    Asynchronous function to get a chat response from OpenAI's ChatGPT, considering chat history.

    Args:
        messages (ContentListUnion): List of previous messages, each a Content object with role and parts
        system_prompt (str): The system message to set the behavior of the assistant
        model (str): The Gemini model to use. Defaults to gemini-2.0-flash
    
    Returns:
        list: A list of Part objects containing the response
    """
    try:
        logger.info(messages)

        response = await client.aio.models.generate_content(
            model=model,
            contents=messages,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=TOOLS
            )
        )
        
        logger.info(response.to_json_dict())
        return response.candidates[0].content.parts
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return [types.Part.from_text(text=f"Sorry, I ran into an error: {str(e)}")]


def upload_file_to_gemini(file) -> types.File:
    """
    Upload a file to Google Gemini.
    """
    return client.files.upload(file=file, config=types.UploadFileConfig(mime_type="text/csv"))