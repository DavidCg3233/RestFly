from django.db import models

# NOTA: En un módulo analítico como 'reportes', muchas veces no se requieren 
# modelos de base de datos propios, ya que la información se extrae de las 
# tablas de ventas, productos y pedidos. 
# 
# Si a futuro deseas guardar un registro de reportes exportados, usarías algo así:

"""
class ReporteExportado(models.Model):
    id_reporte = models.AutoField(primary_key=True)
    nombre_reporte = models.CharField(max_length=100)
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    url_archivo = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'reporte_exportado'
"""
pass