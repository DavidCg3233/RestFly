from django.urls import path
from .controladores.controlador_inventario import ControladorInventario

urlpatterns = [
    path('insumos/', ControladorInventario.manejar_insumos, name='api_insumos'),
    path('platos/', ControladorInventario.manejar_platos, name='api_platos'),
]