# C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\cocina\repositorios\repositorio_cocina.py

class RepositorioCocina:
    def __init__(self, db_connection):
        self.db = db_connection

    def _dictfetchall(self, cursor):
        """Convierte las filas del cursor de Django en un diccionario"""
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def obtener_pedidos_activos(self):
        with self.db.cursor() as cursor:
            query = """
                SELECT 
                    p.id_pedido, 
                    m.numero_mesa, 
                    u.primer_nombre AS mesero,
                    p.fecha_pedido,
                    dp.id_detalle,
                    prod.nombre_producto,
                    dp.cantidad,
                    dp.notas,
                    edp.nombre_estado_detalle,
                    a.nombre_area
                FROM pedido p
                JOIN mesa m ON p.id_mesa = m.id_mesa
                JOIN usuario u ON p.id_usuario = u.id_usuario
                JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
                JOIN producto prod ON dp.id_producto = prod.id_producto
                JOIN estado_detalle_pedido edp ON dp.id_estado_detalle = edp.id_estado_detalle
                LEFT JOIN area_trabajo a ON prod.id_area = a.id_area
                WHERE p.id_estado_pedido NOT IN (3, 4)
                ORDER BY p.fecha_pedido ASC
            """
            cursor.execute(query)
            # Retornamos usando nuestra función conversora
            return self._dictfetchall(cursor)

    def actualizar_estado_detalles_por_area(self, id_pedido, nombre_area, nuevo_estado_id):
        with self.db.cursor() as cursor:
            query = """
                UPDATE detalle_pedido dp
                JOIN producto prod ON dp.id_producto = prod.id_producto
                JOIN area_trabajo a ON prod.id_area = a.id_area
                SET dp.id_estado_detalle = %s
                WHERE dp.id_pedido = %s AND a.nombre_area = %s
            """
            cursor.execute(query, (nuevo_estado_id, id_pedido, nombre_area))
            return cursor.rowcount

    def actualizar_estado_pedido(self, id_pedido, nuevo_estado_id):
        with self.db.cursor() as cursor:
            query = """
                UPDATE detalle_pedido 
                SET id_estado_detalle = %s
                WHERE id_pedido = %s
            """
            cursor.execute(query, (nuevo_estado_id, id_pedido))
            
            query_pedido = """
                UPDATE pedido
                SET id_estado_pedido = %s
                WHERE id_pedido = %s
            """
            cursor.execute(query_pedido, (nuevo_estado_id, id_pedido))
            return cursor.rowcount