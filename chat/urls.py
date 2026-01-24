from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('chat/', views.chat, name='chat'),
    path('api/chat/response/', views.get_chat_response, name='get_chat_response'),
    path('api/chat/stream/', views.stream_chat_response, name='stream_chat_response'),
    path('api/chat/upload/', views.upload_file, name='upload_file'),
    path('api/chat/history/', views.get_chat_history, name='get_chat_history'),
    path('api/chat/clear_history/', views.clear_history, name='clear_history'),
] 