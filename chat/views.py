import logging
import os
from typing import List, Dict
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, HttpRequest
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

uploaded_file: types.File | None = None
uploaded_file_name: str | None = None


# ======================================= Page views =======================================
def index(request: HttpRequest) -> HttpResponse:
    return render(request, 'pages/index.html')

def about(request: HttpRequest) -> HttpResponse:
    return render(request, 'pages/about.html')

# ======================================= Chat views =======================================
def chat(request: HttpRequest) -> HttpResponse:
    global chat_history, uploaded_file, uploaded_file_name
    chat_history = [
        types.Content(parts=[types.Part.from_text(text=WELCOME_MESSAGE)],
                      role="model")
    ]
    uploaded_file = None
    uploaded_file_name = None
    return render(request, 'chat/chat.html', {
        'chat_title': CHAT_TITLE,
        'welcome_message': WELCOME_MESSAGE,
    })

@require_http_methods(["POST"])
def get_chat_response(request: HttpRequest) -> HttpResponse:
    message = request.POST.get('message')
    if not message:
        return HttpResponse("No message provided", status=400)

    global chat_history
    chat_history.append(
        types.Content(role="user", parts=[types.Part(text=message)])
    )

    # Print the chat history for debugging
    print("Chat History before Gemini API call:")
    for item in chat_history:
        print(item.to_json_dict())

    bot_response = get_response(messages=chat_history,
                              system_prompt=SYSTEM_PROMPT,
                              dataset=uploaded_file)
    

    # Render Markdown to HTML (with safety features)
    bot_response_html = render_html_response(bot_response, uploaded_file_name)

    # Add bot response to chat history
    chat_history.append(types.Content(role="model", parts=bot_response))

    return render(request, 'chat/bot_message.html', {
        'bot_response_html': bot_response_html,
    })

@require_http_methods(["POST"])
def upload_file(request: HttpRequest) -> HttpResponse:
    global chat_history, uploaded_file
    try:
        file = request.FILES.get('file')
        if not file:
            return HttpResponse("No file provided", status=400)

        uploaded_file_name = file.name
        uploaded_file = upload_file_to_gemini(file.file)
        chat_history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=f"File uploaded: {uploaded_file_name}")]
            )
        )

        # Print the chat history after file upload
        print("Chat History after file upload:")
        for item in chat_history:
            print(item.to_json_dict())

        bot_response = get_response(messages=chat_history,
                                  system_prompt=SYSTEM_PROMPT,
                                  dataset=uploaded_file)
        
        bot_response_html = render_html_response(bot_response, uploaded_file_name)

        # Add bot response to chat history
        chat_history.append(types.Content(role="model", parts=bot_response))

        return render(request, 'chat/bot_message.html', {
            'bot_response_html': bot_response_html,
        })
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        return render(request, 'chat/bot_message.html', {
            'bot_response_html': f"<p><strong>Error:</strong> {str(e)}</p>",
        })

@require_http_methods(["GET"])
def get_chat_history(request: HttpRequest) -> JsonResponse:
    return JsonResponse([message.to_json_dict() for message in chat_history], safe=False)

@require_http_methods(["GET"])
def clear_history(request: HttpRequest) -> JsonResponse:
    global chat_history
    chat_history = [
        types.Content(parts=[types.Part.from_text(text=WELCOME_MESSAGE)],
                      role="model")
    ]
    return JsonResponse({"message": "Chat history cleared"})



# ======================================= Error handlers =======================================
def handle_error(request: HttpRequest, status_code: int, exception: Exception | None = None) -> HttpResponse:
    """
    Generic error handler that can handle any HTTP status code.
    """

    ERROR_MESSAGES = {
        400: "The request was invalid or cannot be processed.",
        403: "You don't have permission to access this resource.",
        404: "The page you're looking for doesn't exist or has been moved.",
        500: "Something went wrong on our end. Please try again later.",
    }
    SHORT_ERROR_TEXTS = {
        400: "Bad Request",
        403: "Permission Denied",
        404: "Page Not Found",
        500: "Server Error",
    }
    
    status_text = SHORT_ERROR_TEXTS.get(status_code, f"Error {status_code}")
    
    error_message = ERROR_MESSAGES.get(status_code, "An unexpected error occurred.")

    context = {
        'status_code': status_code,
        'status_text': status_text, 
        'error_message': error_message,
    }

    if exception:
        context['detail'] = str(exception)
    
    return render(request, 'errors/error.html', context, status=status_code)


def error400(request: HttpRequest, exception: Exception | None = None) -> HttpResponse:
    return handle_error(request, 400, exception)

def error403(request: HttpRequest, exception: Exception | None = None) -> HttpResponse:
    return handle_error(request, 403, exception)

def error404(request: HttpRequest, exception: Exception | None = None) -> HttpResponse:
    return handle_error(request, 404, exception)

def error500(request: HttpRequest, exception: Exception | None = None) -> HttpResponse:
    return handle_error(request, 500, exception) 