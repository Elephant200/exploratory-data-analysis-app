import logging
import os
import json
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, HttpRequest, StreamingHttpResponse
from django.views.decorators.http import require_http_methods

from .services.gemini import GeminiChatSession
from .utils.markdown import render_html_response, replace_input_file_name

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CHAT_TITLE = "Exploratory Data Analysis with Google Gemini"
WELCOME_MESSAGE = "Welcome to the EDA chatbot! Upload a file to get started, or ask me anything about data analysis!"

with open("system_prompt.txt", "r") as f:
    SYSTEM_PROMPT = f.read()

chat_session: GeminiChatSession | None = None


def _get_or_create_session() -> GeminiChatSession:
    """Get the current chat session or create a new one."""
    global chat_session
    if chat_session is None:
        chat_session = GeminiChatSession(system_prompt=SYSTEM_PROMPT)
    return chat_session


def index(request: HttpRequest) -> HttpResponse:
    return render(request, 'pages/index.html')


def about(request: HttpRequest) -> HttpResponse:
    return render(request, 'pages/about.html')


def chat(request: HttpRequest) -> HttpResponse:
    global chat_session
    chat_session = GeminiChatSession(system_prompt=SYSTEM_PROMPT)
    return render(request, 'chat/chat.html', {
        'chat_title': CHAT_TITLE,
        'welcome_message': WELCOME_MESSAGE,
    })


@require_http_methods(["POST"])
def get_chat_response(request: HttpRequest) -> HttpResponse:
    message = request.POST.get('message')
    if not message:
        return HttpResponse("No message provided", status=400)

    session = _get_or_create_session()
    
    logger.debug(f"User message: {message}")
    
    # Always include file when one is uploaded (code execution sandbox needs it each turn)
    if session.uploaded_file:
        bot_response = session.send_message_with_file(message, session.uploaded_file)
    else:
        bot_response = session.send_message(message)
    
    bot_response_html = render_html_response(bot_response, session.uploaded_file_name)

    return render(request, 'chat/bot_message.html', {
        'bot_response_html': bot_response_html,
    })


@require_http_methods(["POST"])
def stream_chat_response(request: HttpRequest) -> StreamingHttpResponse:
    """Stream chat responses using Server-Sent Events (SSE)."""
    message = request.POST.get('message')
    if not message:
        def error_stream():
            yield f"data: {json.dumps({'type': 'error', 'content': 'No message provided'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingHttpResponse(error_stream(), content_type='text/event-stream')

    session = _get_or_create_session()
    uploaded_file_name = session.uploaded_file_name
    
    logger.debug(f"Streaming user message: {message}")
    
    def event_stream():
        try:
            # Always include file when one is uploaded (code execution sandbox needs it each turn)
            if session.uploaded_file:
                stream = session.send_message_with_file_stream(message, session.uploaded_file)
            else:
                stream = session.send_message_stream(message)
            
            for chunk in stream:
                # Replace input_file_0.csv with actual filename in content
                if chunk.get('content') and uploaded_file_name:
                    chunk['content'] = replace_input_file_name(chunk['content'], uploaded_file_name)
                
                yield f"data: {json.dumps(chunk)}\n\n"
            
            # Signal completion
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
    return response


@require_http_methods(["POST"])
def upload_file(request: HttpRequest) -> HttpResponse:
    try:
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({"error": "No file provided"}, status=400)

        session = _get_or_create_session()
        
        session.upload_file(file.file, file.name)
        
        return JsonResponse({
            "success": True,
            "filename": file.name,
            "message": f"Uploaded: {file.name}"
        })
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        return JsonResponse({"error": str(e)}, status=400)


@require_http_methods(["GET"])
def get_chat_history(request: HttpRequest) -> JsonResponse:
    session = _get_or_create_session()
    history = session.get_history()
    return JsonResponse([msg.to_json_dict() for msg in history], safe=False)


@require_http_methods(["GET"])
def clear_history(request: HttpRequest) -> JsonResponse:
    global chat_session
    chat_session = GeminiChatSession(system_prompt=SYSTEM_PROMPT)
    return JsonResponse({"message": "Chat history cleared"})


def handle_error(request: HttpRequest, status_code: int, exception: Exception | None = None) -> HttpResponse:
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
