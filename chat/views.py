import logging
import os
from typing import List, Dict
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from google.genai import types

from .services.gemini import get_response, upload_file_to_gemini
from .utils.markdown import render_html_response

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

# Page views
def index(request):
    return render(request, 'pages/index.html')

def about(request):
    return render(request, 'pages/about.html')

# Chat views
def chat(request):
    global chat_history
    chat_history = [
        types.Content(parts=[types.Part.from_text(text=WELCOME_MESSAGE)],
                      role="model")
    ]
    return render(request, 'chat/chat.html', {
        'chat_title': CHAT_TITLE,
        'welcome_message': WELCOME_MESSAGE,
    })

@require_http_methods(["POST"])
def get_chat_response(request):
    message = request.POST.get('message')
    if not message:
        return HttpResponse("No message provided", status=400)

    global chat_history
    chat_history.append(
        types.Content(role="user", parts=[types.Part(text=message)])
    )
    print([str(x)[:100] for x in chat_history])
    bot_response = get_response(messages=chat_history,
                              system_prompt=SYSTEM_PROMPT,
                              dataset=uploaded_file)

    # Render Markdown to HTML (with safety features)
    bot_response_html = render_html_response(bot_response)

    # Add bot response to chat history
    chat_history.append(types.Content(role="model", parts=bot_response))

    return render(request, 'chat/bot_message.html', {
        'bot_response_html': bot_response_html,
    })

@require_http_methods(["POST"])
def upload_file(request):
    global chat_history, uploaded_file
    try:
        file = request.FILES.get('file')
        if not file:
            return HttpResponse("No file provided", status=400)

        uploaded_file = upload_file_to_gemini(file.file)
        chat_history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=f"File uploaded: {file.name}")]))

        print([str(x)[:100] for x in chat_history])

        bot_response = get_response(messages=chat_history,
                                  system_prompt=SYSTEM_PROMPT,
                                  dataset=uploaded_file)

        bot_response_html = render_html_response(bot_response)

        # Add bot response to chat history
        print([str(x)[:100] for x in chat_history])
        chat_history.append(types.Content(role="model", parts=bot_response))
        print([str(x)[:100] for x in chat_history])

        return render(request, 'chat/bot_message.html', {
            'bot_response_html': bot_response_html,
        })
    except Exception as e:
        print(e)
        return render(request, 'chat/bot_message.html', {
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