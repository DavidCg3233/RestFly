from django.urls import path
from .controladores.controlador_usuario import UsuarioControllerView

urlpatterns = [
    path('', UsuarioControllerView.as_view(), name='api_usuarios'),
]