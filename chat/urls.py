from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('chat/', views.chat, name='chat'),
    path('chat/response/', views.get_chat_response, name='get_chat_response'),
    path('chat/upload/', views.upload_file, name='upload_file'),
    path('api/chat_history/', views.get_chat_history, name='get_chat_history'),
    path('api/clear_history/', views.clear_history, name='clear_history'),
] 