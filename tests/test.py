from google import genai
from google.genai import types

client = genai.Client()

def turn_on_the_lights():
    """
    Turns on the lights.
    """
    print("Turning on the lights")

def turn_off_the_lights():
    """
    Turns off the lights.
    """
    print("Turning off the lights")


tools = [
    {"code_execution": {}},
    turn_on_the_lights,
    turn_off_the_lights
]

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Hi! What is the largest palindrome made from the product of two 2-digit numbers?",
    config={"tools": tools}
)

for chunk in response:
    print(chunk)