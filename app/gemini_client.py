from google import genai
from google.genai import types
import logging
from typing import List

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_DEFAULT_MODEL = "gemini-2.0-flash"

# Configure OpenAI client
client = genai.Client()

async def get_response(
    messages: types.ContentListUnion,
    system_prompt: str = "You are a helpful assistant that always answers questions.",
    model: str = GEMINI_DEFAULT_MODEL,
) -> List[types.Part]:
    """
    Asynchronous function to get a chat response from OpenAI's ChatGPT, considering chat history.

    Args:
        messages (ContentListUnion): List of previous messages, each a Message object with 'role' and 'content'
        system_prompt (str): The system message to set the behavior of the assistant
        model (str): The Gemini model to use. Defaults to gemini-2.0-flash
    
    Returns:
        list: A list of Part objects containing the response
    """
    try:
        response = await client.aio.models.generate_content(
            model=model,
            contents=messages,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        return response.candidates[0].content.to_json_dict()["parts"]
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return {"error": str(e)}