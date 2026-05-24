# src/modulos/tablero/urls.py
from django.urls import path
from .controladores.controlador_tablero import api_resumen_tablero

urlpatterns = [
    path('resumen/', api_resumen_tablero, name='api_resumen_tablero'),
]