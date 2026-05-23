# Archivo: src/modulos/caja/urls.py

from django.urls import path
from .controladores import controlador_caja, controlador_facturacion

urlpatterns = [

    # ── Control de Caja ──────────────────────────────────────
    path('panel/',      controlador_caja.vista_control_caja,   name='vista_control_caja'),
    path('estado/',     controlador_caja.estado_caja,          name='estado_caja'),
    path('abrir/',      controlador_caja.abrir_caja,           name='abrir_caja'),
    path('cerrar/',     controlador_caja.cerrar_caja,          name='cerrar_caja'),
    path('movimiento/', controlador_caja.registrar_movimiento, name='movimiento_caja'),

    # ── Facturación ──────────────────────────────────────────
    path('facturacion/pedidos-pendientes/', controlador_facturacion.pedidos_pendientes, name='fac_pedidos_pendientes'),
    path('facturacion/historial-ventas/',   controlador_facturacion.historial_ventas,   name='fac_historial_ventas'),
    path('facturacion/procesar-pago/',      controlador_facturacion.procesar_pago,      name='fac_procesar_pago'),
]