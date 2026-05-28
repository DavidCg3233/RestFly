from django.urls import path
from .controladores.mesas_controlador import ControladorMesas

app_name = 'mesas'

urlpatterns = [
    # Rutas limpias (el prefijo 'api/mesas/' ya viene desde el urls.py principal)
    path('estado-inicial/', ControladorMesas.manejar_estado_inicial, name='api_estado_inicial'),
    path('estado-mesa/', ControladorMesas.manejar_estado_mesa, name='api_estado_mesa'),
    path('crear/', ControladorMesas.manejar_crear_mesa, name='api_crear_mesa'),
    path('enviar-comanda/', ControladorMesas.manejar_enviar_comanda, name='api_enviar_comanda'),
    path('eliminar/', ControladorMesas.manejar_eliminar_mesa, name='api_eliminar_mesa'),
    
    # 🔥 NUEVA RUTA: Recibe id_mesa e id_pedido para cancelar y liberar de una
    path('anular-pedido/', ControladorMesas.manejar_anular_pedido, name='api_anular_pedido'),
]