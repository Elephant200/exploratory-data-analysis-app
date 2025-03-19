import httpx
from google.genai import types
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        history = [
            {
                "parts": [
                    {
                        "text": input("Prompt > ")
                    }
                ],
                "role": "user"
            }
        ]
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", "http://localhost:8000/chat/", json=history) as response:
                async for line in response.aiter_text():
                    print(line, end="")  # Ensures incremental display

if __name__ == "__main__":
    asyncio.run(test())