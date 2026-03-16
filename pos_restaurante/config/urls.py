from django.contrib import admin
from django.urls import path
# Importación desde tu carpeta src
from src.modulos.login.controladores.login_backend import validar_acceso_usuario

urlpatterns = [
    path('admin/', admin.site.urls),
    # Esta es la URL que llama tu login_frontend.js
    path('api/login/', validar_acceso_usuario, name='api_login'),
]