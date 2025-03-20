import httpx
from google.genai import types
import asyncio
import json

async def test():
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
            print("Got response", response, "with status code", response.status_code)
            if response.status_code // 100 != 2:
                print("Error:", response.text)
            else:
                async for chunk in response.aiter_raw():
                    try:
                        data = json.loads(chunk.decode())
                        print(data['candidates'][0]['content']['parts'][0]['text'], end="")
                    except json.JSONDecodeError:
                        print(f"Failed to decode JSON: {chunk}")

if __name__ == "__main__":
    asyncio.run(test())