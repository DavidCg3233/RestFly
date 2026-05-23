# C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\cocina\urls.py

from django.urls import path
from .controladores.cocina_controlador import ControladorCocina

urlpatterns = [
    # La ruta real será: http://127.0.0.1:8000/api/cocina/pedidos/
    path('pedidos/', ControladorCocina.manejar_obtener_pedidos, name='cocina_obtener_pedidos'),
    
    # La ruta real será: http://127.0.0.1:8000/api/cocina/avanzar/
    path('avanzar/', ControladorCocina.manejar_avanzar_pedido, name='cocina_avanzar_pedido'),
]