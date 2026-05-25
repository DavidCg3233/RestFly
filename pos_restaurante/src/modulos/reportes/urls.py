from django.urls import path
from .controladores import controlador_reporte

urlpatterns = [
    # GET /api/reportes/ventas-diarias/?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
    path('ventas-diarias/', controlador_reporte.obtener_ventas_diarias, name='reporte_ventas_diarias'),
    
    # GET /api/reportes/productos-top/
    path('productos-top/', controlador_reporte.obtener_productos_top, name='reporte_productos_top'),
]