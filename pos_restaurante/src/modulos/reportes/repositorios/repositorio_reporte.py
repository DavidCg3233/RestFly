from django.db import connection

class RepositorioReporte:

    @staticmethod
    def obtener_ventas_por_rango(fecha_inicio, fecha_fin):
        """Agrupa las ventas por fecha en un rango específico."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    DATE(fecha_venta) AS fecha, 
                    SUM(total_venta) AS total_dia,
                    COUNT(id_venta) AS cantidad_transacciones
                FROM venta
                WHERE DATE(fecha_venta) >= %s AND DATE(fecha_venta) <= %s
                GROUP BY DATE(fecha_venta)
                ORDER BY fecha ASC
            """, [fecha_inicio, fecha_fin])
            
            resultados = []
            for fecha, total, cantidad in cursor.fetchall():
                resultados.append({
                    "fecha": fecha.isoformat() if fecha else None,
                    "total": float(total),
                    "transacciones": cantidad
                })
            return resultados

    @staticmethod
    def obtener_productos_mas_vendidos(limite):
        """Calcula cuáles son los platos que más se piden."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    pr.nombre_producto,
                    SUM(dp.cantidad) AS cantidad_total,
                    SUM(dp.cantidad * dp.precio_unitario) AS ingresos_generados
                FROM detalle_pedido dp
                INNER JOIN producto pr ON dp.id_producto = pr.id_producto
                INNER JOIN pedido p ON dp.id_pedido = p.id_pedido
                INNER JOIN venta v ON p.id_pedido = v.id_pedido
                GROUP BY pr.id_producto, pr.nombre_producto
                ORDER BY cantidad_total DESC
                LIMIT %s
            """, [limite])
            
            resultados = []
            for nombre, cantidad, ingresos in cursor.fetchall():
                resultados.append({
                    "producto": nombre,
                    "cantidad_vendida": int(cantidad),
                    "ingresos": float(ingresos)
                })
            return resultados