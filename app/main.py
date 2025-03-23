import os
import logging

from dotenv import load_dotenv

from fastapi import FastAPI, Form, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from google import genai
from google.genai import types

import markdown2
from typing import List, Dict
import uuid

from app.gemini_client import get_response

load_dotenv()

CHAT_TITLE = "Exploratory Data Analysis with Google Gemini"
WELCOME_MESSAGE = "Welcome to the EDA chatbot! Ask me anything about data analysis."
SYSTEM_PROMPT = """
You are a helpful data analysis assistant.
"""

app = FastAPI()

templates_directory = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=templates_directory)

# Mount the static directory
static_directory = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_directory), name="static")

# Simulating a database with an in-memory list
chat_history: types.ContentListUnion = []

# Get the absolute path to the project root
project_root = os.path.dirname(os.path.abspath(__file__))

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "chat.html",
        {
            "request": request,
            "chat_title": CHAT_TITLE,
            "welcome_message": WELCOME_MESSAGE,
        },
    )

@app.post("/chat")
async def chat(request: Request, message: str = Form(...)) -> HTMLResponse:
    # Get response from Gemini using prepared messages
    bot_response = await get_response(
        messages=chat_history,
        system_prompt=SYSTEM_PROMPT,
    )[0]["text"]

    # Render Markdown to HTML (with safety features)
    bot_response_html = markdown2.markdown(bot_response, safe_mode="escape")

    # Add user message and bot response to chat history
    chat_history.append(types.Content(role="user", parts=types.Part(text=message)))
    chat_history.append(types.Content(role="model", parts=[bot_response]))

    message_id = str(uuid.uuid4())

    response_html = templates.TemplateResponse(
        "bot_message.html",
        {
            "request": request,
            "bot_response_html": bot_response_html,
            "message_id": message_id,
        },
    )

    return response_html


@app.get("/api/chat_history")
async def get_chat_history() -> List[Dict[str, str]]:
    return [message.model_dump() for message in chat_history]


# Optional: Add a route to clear chat history (for testing/demo purposes)
@app.get("/api/clear_history")
async def clear_history() -> Dict[str, str]:
    chat_history.clear()
    return {"message": "Chat history cleared"}