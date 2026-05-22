from django.urls import path
from .controladores import controlador_usuario

urlpatterns = [
    path('', controlador_usuario.UsuarioControllerView.as_view(), name='api_usuarios'),
]