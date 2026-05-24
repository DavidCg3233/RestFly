from django.urls import path
from src.modulos.reportes.controladores.controlador_reporte import obtener_datos_reportes

urlpatterns = [
    # Ruta base para obtener las estadísticas filtradas por fecha
    path('', obtener_datos_reportes, name='obtener_datos_reportes'),
]