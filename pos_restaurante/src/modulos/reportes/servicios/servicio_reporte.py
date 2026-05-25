from datetime import datetime, timedelta
from ..repositorios.repositorio_reporte import RepositorioReporte

class ServicioReporte:

    @staticmethod
    def generar_reporte_ventas_diarias(fecha_inicio, fecha_fin):
        # 1. Validaciones de negocio
        if not fecha_inicio or not fecha_fin:
            # Si no envían fechas, tomamos por defecto los últimos 7 días
            hoy = datetime.now()
            hace_una_semana = hoy - timedelta(days=7)
            fecha_inicio = hace_una_semana.strftime('%Y-%m-%d')
            fecha_fin = hoy.strftime('%Y-%m-%d')

        # 2. Consultar al repositorio
        ventas_raw = RepositorioReporte.obtener_ventas_por_rango(fecha_inicio, fecha_fin)

        # 3. Formatear y calcular totales (Lógica extra)
        total_periodo = sum(item['total'] for item in ventas_raw)

        return {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "total_periodo": total_periodo,
            "detalle_diario": ventas_raw
        }

    @staticmethod
    def generar_reporte_productos_top(limite):
        # Validar que el límite no sea una locura
        if limite <= 0 or limite > 50:
            limite = 10
            
        productos_raw = RepositorioReporte.obtener_productos_mas_vendidos(limite)
        return productos_raw