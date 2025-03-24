from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Hi! What is the largest palindrome made from the product of two 2-digit numbers?",
    config=types.GenerateContentConfig(
        tools=[types.Tool(code_execution=types.ToolCodeExecution())]
    )
)
print(response.candidates[0].content.to_json_dict()["parts"])