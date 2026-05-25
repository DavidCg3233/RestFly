from django.urls import path
from .controladores import controlador_reporte

urlpatterns = [
    path('ventas-diarias/', controlador_reporte.api_ventas_diarias, name='api_ventas_diarias'),
    path('productos-top/', controlador_reporte.api_productos_top, name='api_productos_top'),
    path('inventario-estado/', controlador_reporte.api_inventario_estado, name='api_inventario_estado'),
    path('gastos/', controlador_reporte.api_gastos, name='api_gastos'),
    
    # 🔥 LA NUEVA RUTA ADAPTADA A TU CONTROLADOR:
    path('exportar-excel/', controlador_reporte.api_exportar_excel, name='api_exportar_excel'),
]