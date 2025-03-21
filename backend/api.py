import os
import json

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
import uvicorn

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")

app = FastAPI()

client = genai.Client(api_key = API_KEY)

with open("system_instruction.txt", "r") as f:
    SYSTEM_INSTRUCTION = f.read()

CONFIG = types.GenerateContentConfig(
    system_instruction=SYSTEM_INSTRUCTION
)

@app.post("/chat/")
async def get_response_stream(contents: types.ContentListUnion) -> StreamingResponse:
    """
    Streams Gemini response based on full chat history.

    Args:
        contents (ContentListUnion): The user's chat history, including messages from both the user and the model. This must include the latest message.

    Returns:
        StreamingResponse: A FastAPI compatible streaming response containing the model's response as newline separated JSON objects, each containing parts like text.
    """
    try:
        async def stream_response():
            async for chunk in await client.aio.models.generate_content_stream(
                        model="gemini-2.0-flash",
                        contents=contents,
                        config=CONFIG,
                    ):
                yield json.dumps(chunk.to_json_dict()) + "\n"
            
        return StreamingResponse(content=stream_response(), media_type="application/x-ndjson")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)