# src/modulos/tablero/repositorios/repositorio_tablero.py
from django.db import connection

class TableroRepository:
    
    @staticmethod
    def obtener_ventas_dia(fecha_str):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT SUM(total_venta) 
                FROM venta 
                WHERE DATE(fecha_venta) = %s
            """, [fecha_str])
            resultado = cursor.fetchone()[0]
            return float(resultado) if resultado else 0.00

    @staticmethod
    def obtener_conteo_mesas():
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM mesa")
            total = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM mesa m
                JOIN estado_mesa em ON m.id_estado_mesa = em.id_estado_mesa
                WHERE em.nombre_estado_mesa = 'ocupada'
            """)
            ocupadas = cursor.fetchone()[0]
            return ocupadas, total

    @staticmethod
    def obtener_pedidos_pendientes():
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) FROM pedido p
                JOIN estado_pedido ep ON p.id_estado_pedido = ep.id_estado_pedido
                WHERE ep.nombre_estado_pedido IN ('abierto', 'enviado')
            """)
            return cursor.fetchone()[0]

    @staticmethod
    def obtener_alertas_inventario():
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM inventario WHERE stock_actual <= stock_minimo")
            return cursor.fetchone()[0]

    @staticmethod
    def obtener_ventas_semana(fecha_inicio):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT DATE(fecha_venta), SUM(total_venta) 
                FROM venta 
                WHERE fecha_venta >= %s 
                GROUP BY DATE(fecha_venta) 
                ORDER BY DATE(fecha_venta)
            """, [fecha_inicio])
            return cursor.fetchall() # Retorna lista de tuplas (fecha, total)

    @staticmethod
    def obtener_top_platos(fecha_inicio):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT p.nombre_producto, SUM(dp.cantidad) as total_vendido, SUM(dp.cantidad * dp.precio_unitario) as ingresos 
                FROM detalle_pedido dp
                JOIN producto p ON dp.id_producto = p.id_producto
                JOIN pedido pe ON dp.id_pedido = pe.id_pedido
                WHERE pe.fecha_pedido >= %s
                GROUP BY p.id_producto, p.nombre_producto
                ORDER BY total_vendido DESC
                LIMIT 3
            """, [fecha_inicio])
            return cursor.fetchall()

    @staticmethod
    def obtener_ultimas_ventas(limite=5):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT m.numero_mesa, v.total_venta, v.fecha_venta 
                FROM venta v
                JOIN pedido p ON v.id_pedido = p.id_pedido
                JOIN mesa m ON p.id_mesa = m.id_mesa
                ORDER BY v.fecha_venta DESC
                LIMIT %s
            """, [limite])
            return cursor.fetchall()