from google import genai
from google.genai import types
import logging
from typing import Any, List, Literal
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_DEFAULT_MODEL = "gemini-2.0-flash"

TOOLS = [
    {"code_execution": {}}
]

# Configure Gemini client
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def get_response(
    messages: List[types.Content],
    system_prompt: str = "You are a helpful assistant that always answers questions.",
    dataset: types.File = None,
    *,
    model: str = GEMINI_DEFAULT_MODEL,
) -> List[types.Part]:
    """
    Function to get a chat response from Gemini, considering chat history.

    Args:
        messages (ContentListUnion): List of previous messages, each a Content object with role and parts
        system_prompt (str): The system message to set the behavior of the assistant
        model (str): The Gemini model to use. Defaults to gemini-2.0-flash
    
    Returns:
        list: A list of Part objects containing the response
    """
    try:
        logger.debug("Messages sent to Gemini API:")
        logger.debug(messages)
        print([str(x)[:100] for x in messages])
        response = client.models.generate_content(
            model=model,
            contents=(messages + ([dataset] if dataset is not None else [])),
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=TOOLS
            )
        )
        print([str(x)[:100] for x in messages])
        logger.debug(response.to_json_dict())
        return response.candidates[0].content.parts
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return [types.Part.from_text(text=f"Sorry, I ran into an error: {str(e)}")]


def upload_file_to_gemini(file) -> types.File:
    """
    Upload a file to Google Gemini.
    """
    return client.files.upload(file=file, config=types.UploadFileConfig(mime_type="text/csv")) 