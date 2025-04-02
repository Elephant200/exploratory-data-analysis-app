import base64
import logging
import os
from typing import List, Dict
import uuid
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from google import genai
from google.genai import types
import markdown2
import asyncio
from asgiref.sync import async_to_sync

from .gemini_client import get_response, upload_file_to_gemini

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CHAT_TITLE = "Exploratory Data Analysis with Google Gemini"
WELCOME_MESSAGE = "Welcome to the EDA chatbot! Upload a file to get started, or ask me anything about data analysis!"

with open("system_prompt.txt", "r") as f:
    SYSTEM_PROMPT = f.read()

# Simulating a database with an in-memory list
chat_history: types.ContentListUnion = [
    types.Content(parts=[types.Part.from_text(text=WELCOME_MESSAGE)], role="model")
]

uploaded_file = None

def index(request):
    return render(request, 'index.html')

def about(request):
    return render(request, 'about.html')

def chat(request):
    global chat_history
    chat_history = [
        types.Content(parts=[types.Part.from_text(text=WELCOME_MESSAGE)],
                      role="model")
    ]
    return render(request, 'chat.html', {
        'chat_title': CHAT_TITLE,
        'welcome_message': WELCOME_MESSAGE,
    })

@csrf_exempt
@require_http_methods(["POST"])
def get_chat_response(request):
    message = request.POST.get('message')
    if not message:
        return HttpResponse("No message provided", status=400)

    global chat_history
    chat_history.append(
        types.Content(role="user", parts=[types.Part(text=message)]))

    # Print the chat history for debugging
    print("Chat History before Gemini API call:")
    for item in chat_history:
        print(item.to_json_dict())

    # Use async_to_sync to handle the async call
    bot_response = async_to_sync(get_response)(
        messages=chat_history,
        system_prompt=SYSTEM_PROMPT,
        dataset=uploaded_file
    )

    # Render Markdown to HTML (with safety features)
    bot_response_html = render_html_response(bot_response)

    # Add bot response to chat history
    chat_history.append(types.Content(role="model", parts=bot_response))

    return render(request, 'bot_message.html', {
        'bot_response_html': bot_response_html,
    })

@csrf_exempt
@require_http_methods(["POST"])
def upload_file(request):
    global chat_history, uploaded_file
    try:
        file = request.FILES.get('file')
        if not file:
            return HttpResponse("No file provided", status=400)

        uploaded_file = upload_file_to_gemini(file)
        chat_history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=f"File uploaded: {file.name}")]))

        # Print the chat history after file upload
        print("Chat History after file upload:")
        for item in chat_history:
            print(item.to_json_dict())

        # Use async_to_sync to handle the async call
        bot_response = async_to_sync(get_response)(
            messages=chat_history,
            system_prompt=SYSTEM_PROMPT,
            dataset=uploaded_file
        )

        bot_response_html = render_html_response(bot_response)

        # Add bot response to chat history
        chat_history.append(types.Content(role="model", parts=bot_response))

        return render(request, 'bot_message.html', {
            'bot_response_html': bot_response_html,
        })
    except Exception as e:
        print(e)
        return render(request, 'bot_message.html', {
            'bot_response_html': f"<p><strong>Error:</strong> {str(e)}</p>",
        })

def get_chat_history(request):
    return JsonResponse([message.to_json_dict() for message in chat_history], safe=False)

def clear_history(request):
    global chat_history
    chat_history = [
        types.Content(parts=[types.Part.from_text(text=WELCOME_MESSAGE)],
                      role="model")
    ]
    return JsonResponse({"message": "Chat history cleared"})

def render_html_response(bot_response: Dict[str, str] | List[types.Part]) -> str:
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