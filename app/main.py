import base64
import logging
import os

from dotenv import load_dotenv

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from google import genai
from google.genai import types

import markdown2
from typing import List, Dict
import uuid

from gemini_client import get_response, upload_file_to_gemini

load_dotenv()

CHAT_TITLE = "Exploratory Data Analysis with Google Gemini"
WELCOME_MESSAGE = "Welcome to the EDA chatbot! Ask me anything about data analysis."
SYSTEM_PROMPT = """
You are a helpful data analysis assistant. 

You perform exploratory analysis based on data the user can upload.

Please perform analysis as soon as the user uploads a file. You may use your own judgment to determine the best way to analyze the data. This should be an AI-driven analysis; make your own research questions and answer them. Include at least one visualization.

Never rewrite the content of the entire dataset; you will run out of tokens.
"""

uploaded_file = None

app = FastAPI()

templates_directory = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=templates_directory)

# Mount the static directory
static_directory = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_directory), name="static")

# Simulating a database with an in-memory list
chat_history: types.ContentListUnion = [
    types.Content(parts=[types.Part.from_text(text=WELCOME_MESSAGE)],
                  role="model")
]

# Get the absolute path to the project root
project_root = os.path.dirname(os.path.abspath(__file__))


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/chat", response_class=HTMLResponse)
async def chat(request: Request) -> HTMLResponse:
    global chat_history
    chat_history = [
        types.Content(parts=[types.Part.from_text(text=WELCOME_MESSAGE)],
                      role="model")
    ]
    return templates.TemplateResponse(
        "chat.html",
        {
            "request": request,
            "chat_title": CHAT_TITLE,
            "welcome_message": WELCOME_MESSAGE,
        },
    )


@app.post("/chat")
async def get_chat_response(
    request: Request, message: str = Form(...)) -> HTMLResponse:
    # Get response from Gemini using chat history
    chat_history.append(
        types.Content(role="user", parts=[types.Part(text=message)]))

    # Print the chat history for debugging
    print("Chat History before Gemini API call:")
    for item in chat_history:
        print(item.to_json_dict())

    bot_response = await get_response(messages=chat_history,
                                      system_prompt=SYSTEM_PROMPT,
                                      dataset=uploaded_file)

    # Render Markdown to HTML (with safety features)
    bot_response_html = render_html_response(bot_response)

    # Add bot response to chat history
    chat_history.append(types.Content(role="model", parts=bot_response))

    message_id = str(uuid.uuid4())

    response_html = templates.TemplateResponse(
        "bot_message.html",
        {
            "request": request,
            "bot_response_html": bot_response_html,
        },
    )

    return response_html


@app.post("/upload")
async def upload_file(
    request: Request, file: UploadFile = File(...)) -> Dict[str, str]:
    """
    Handle file uploads and process datasets.
    """
    global chat_history
    global uploaded_file
    try:
        #contents = await file.read()
        uploaded_file = upload_file_to_gemini(file.file)
        chat_history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=f"File uploaded: {file.filename}")]))

        # Print the chat history after file upload
        print("Chat History after file upload:")
        for item in chat_history:
            print(item.to_json_dict())

        bot_response = await get_response(messages=chat_history,
                                          system_prompt=SYSTEM_PROMPT,
                                          dataset=uploaded_file)

        bot_response_html = render_html_response(bot_response)

        # Add bot response to chat history
        chat_history.append(types.Content(role="model", parts=bot_response))

        message_id = str(uuid.uuid4())

        response_html = templates.TemplateResponse(
            "bot_message.html",
            {
                "request": request,
                "bot_response_html": bot_response_html,
                "message_id": message_id
            },
        )

        return response_html
    except Exception as e:
        print(e)
        return templates.TemplateResponse(
            "bot_message.html",
            {
                "request": request,
                "bot_response_html":
                f"<p><strong>Error:</strong> {str(e)}</p>",
            },
        )


@app.get("/api/chat_history")
async def get_chat_history() -> List[Dict[str, object]]:
    return [message.to_json_dict() for message in chat_history]


# Optional: Add a route to clear chat history (for testing/demo purposes)
@app.get("/api/clear_history")
async def clear_history() -> Dict[str, str]:
    global chat_history
    chat_history = [
        types.Content(parts=[types.Part.from_text(text=WELCOME_MESSAGE)],
                      role="model")
    ]
    return {"message": "Chat history cleared"}


def render_html_response(
        bot_response: Dict[str, str] | List[types.Part]) -> str:
    if type(bot_response) == dict:
        bot_response_html = f"<p><strong>Error:</strong> {bot_response['error']}</p>"
    else:
        bot_response_html = ""
        for part in bot_response:
            print(part.to_json_dict())
            if part.text:
                bot_response_html += markdown2.markdown(
                    part.text,
                    extras=['fenced-code-blocks', 'code-friendly', 'tables'])
            elif part.executable_code:
                bot_response_html += f"<br/>Python Code:<pre><code>{part.executable_code.code}</code></pre><br/>"
            elif part.code_execution_result:
                bot_response_html += f"<br/>Code Output:<pre><code>{part.code_execution_result.output}</code></pre><br/>"
            elif part.inline_data:
                try:
                    base64_data = base64.b64encode(
                        part.inline_data.data).decode("utf-8") if isinstance(
                            part.inline_data.data,
                            bytes) else part.inline_data.data
                    bot_response_html += f'<img src="data:image/png;base64,{base64_data}" alt="Generated Image" style="max-width: 100%; height: auto;"/>'
                except Exception as e:
                    bot_response_html += f"<p><strong>Error:</strong> {part.inline_data}<br/>{e}</p>"
            else:
                bot_response_html += f"<p><strong>Error:</strong> Unknown part type {part}</p>"
    return bot_response_html
