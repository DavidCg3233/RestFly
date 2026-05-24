# src/modulos/tablero/servicios/servicio_tablero.py
from datetime import datetime, timedelta
from ..repositorios.repositorio_tablero import TableroRepository

class TableroService:
    
    @staticmethod
    def obtener_datos_completos():
        hoy_str = datetime.now().strftime('%Y-%m-%d')
        ayer_str = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        hace_7_dias_str = (datetime.now() - timedelta(days=6)).strftime('%Y-%m-%d')
        hace_30_dias_str = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        # 1. Tarjetas Superiores
        ventas_hoy = TableroRepository.obtener_ventas_dia(hoy_str)
        ventas_ayer = TableroRepository.obtener_ventas_dia(ayer_str)
        
        tendencia = 0
        if ventas_ayer > 0:
            tendencia = ((ventas_hoy - ventas_ayer) / ventas_ayer) * 100

        mesas_ocupadas, total_mesas = TableroRepository.obtener_conteo_mesas()
        pedidos_pendientes = TableroRepository.obtener_pedidos_pendientes()
        alertas_inv = TableroRepository.obtener_alertas_inventario()

        # 2. Gráfica de Ventas (Rellenar 7 días)
        ventas_grafica_raw = TableroRepository.obtener_ventas_semana(hace_7_dias_str)
        ventas_dict = {str(fila[0]): float(fila[1]) for fila in ventas_grafica_raw}
        
        labels_grafica = []
        data_grafica = []
        for i in range(7):
            dia = (datetime.now() - timedelta(days=6 - i))
            labels_grafica.append(dia.strftime('%a')) # Lun, Mar, Mié...
            data_grafica.append(ventas_dict.get(dia.strftime('%Y-%m-%d'), 0))

        # 3. Top Platos
        top_platos_raw = TableroRepository.obtener_top_platos(hace_30_dias_str)
        top_platos = [
            {"nombre": fila[0], "cantidad": int(fila[1]), "ingresos": float(fila[2])}
            for fila in top_platos_raw
        ]

        # 4. Actividad Reciente
        ultimas_ventas_raw = TableroRepository.obtener_ultimas_ventas()
        actividad = [
            {
                "mensaje": f"Mesa {fila[0]} pagó su cuenta",
                "monto": float(fila[1]),
                "fecha": fila[2].strftime('%Y-%m-%dT%H:%M:%S') if fila[2] else ""
            }
            for fila in ultimas_ventas_raw
        ]

        return {
            "tarjetas": {
                "ventas_hoy": ventas_hoy,
                "tendencia_ventas": round(tendencia, 1),
                "mesas_ocupadas": mesas_ocupadas,
                "total_mesas": total_mesas,
                "pedidos_pendientes": pedidos_pendientes,
                "alertas_inventario": alertas_inv
            },
            "grafica": {"labels": labels_grafica, "data": data_grafica},
            "top_platos": top_platos,
            "actividad": actividad
        }