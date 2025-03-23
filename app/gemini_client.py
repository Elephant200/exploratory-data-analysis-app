from google import genai
from google.genai import types
import logging
from typing import Any, List, Literal

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_DEFAULT_MODEL = "gemini-2.0-flash"

# Configure OpenAI client
client = genai.Client()

async def get_response(
    messages: List[types.Content],
    system_prompt: str = "You are a helpful assistant that always answers questions.",
    model: str = GEMINI_DEFAULT_MODEL,
) -> List[types.Part] | dict[Literal["error"], str]:
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
        if messages is None or len(messages) == 0 or messages[-1].parts is None or len(messages[-1].parts) == 0:
            return [types.Part.from_text(text="Work with me here - I can't answer without a message!")]

        response = await client.aio.models.generate_content(
            model=model,
            contents=messages,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        
        logger.info(response.to_json_dict())
        return response.candidates[0].content.parts
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return [types.Part.from_text(text=f"Sorry, I ran into an error: {str(e)}")]