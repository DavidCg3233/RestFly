from django.urls import path
from .controladores.mesas_controlador import ControladorMesas

app_name = 'mesas'

urlpatterns = [
    # Rutas para el frontend vía Fetch/AJAX (Retornan JSON)
    path('api/estado-inicial/', ControladorMesas.manejar_estado_inicial, name='api_estado_inicial'),
    path('api/estado-mesa/', ControladorMesas.manejar_estado_mesa, name='api_estado_mesa'),
    
    # Endpoint corregido para creación de mesas
    path('api/crear/', ControladorMesas.manejar_crear_mesa, name='api_crear_mesa'),
    path('api/enviar-comanda/', ControladorMesas.manejar_enviar_comanda, name='api_enviar_comanda'),
]