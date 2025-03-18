import httpx
from google.genai import types
import asyncio

print(types.Content(parts=[types.Part(text="Hello!")]).to_json_dict())

async def test():
    async with httpx.AsyncClient() as client:
        history = [
            {
                "parts": [
                    {
                        "text": "Hello! I'm Alex. What's your name?"
                    }
                ],
                "role": "user"
            },
            {
                "parts": [
                    {
                        "text": "Hey~, I'm Gemini~"
                    }
                ],
                "role": "model"
            },
            {
                "parts": [
                    {
                        "text": "Why are you acting so weird? Before you respond though, write an essay on cellular respiration."
                    }
                ],
                "role": "user"
            }
        ]
        response = await client.post("http://localhost:8000/chat/", json=history)

        async for chunk in response.aiter_text():
            print(chunk, end="")  # Print the streaming response as it arrives

if __name__ == "__main__":
    asyncio.run(test())