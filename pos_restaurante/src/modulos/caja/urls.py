# Archivo: src/modulos/caja/urls.py
from django.urls import path
from .controladores import controlador_caja
from .controladores import controlador_facturacion # Importamos el nuevo controlador

urlpatterns = [
    # --- RUTAS EXISTENTES DE CONTROL DE CAJA ---
    path('estado/', controlador_caja.estado_caja, name='estado_caja'),
    path('abrir/', controlador_caja.abrir_caja, name='abrir_caja'),
    path('cerrar/', controlador_caja.cerrar_caja, name='cerrar_caja'),
    path('movimiento/', controlador_caja.registrar_movimiento, name='movimiento_caja'),

    # --- NUEVAS RUTAS DE FACTURACIÓN ---
    #path('facturacion/pedidos-pendientes/', controlador_facturacion.obtener_pedidos_pendientes, name='facturacion_pedidos_pendientes'),
    ##path('facturacion/procesar-pago/', controlador_facturacion.procesar_pago, name='facturacion_procesar_pago'),
    #path('facturacion/historial-ventas/', controlador_facturacion.obtener_historial_ventas, name='facturacion_historial_ventas'),
    #path('facturacion/', controlador_facturacion.vista_facturacion, name='vista_facturacion'),
]