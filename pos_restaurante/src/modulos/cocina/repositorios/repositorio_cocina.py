class RepositorioCocina:
    def __init__(self, db_connection):
        self.db = db_connection

    def _dictfetchall(self, cursor):
        """Convierte las filas del cursor de Django en un diccionario"""
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def obtener_pedidos_activos(self, area_filtro=None):
        with self.db.cursor() as cursor:
            where_clauses = [
                "p.id_estado_pedido IN (1, 2)",          
                "edp.nombre_estado_detalle != 'cancelado'" 
            ]
            
            # 🔥 Aquí está la magia de los filtros que me pediste
            if area_filtro:
                if area_filtro.lower() == 'cocina':
                    where_clauses.append("c.nombre_categoria IN ('Comida', 'Comidas Rápidas', 'Postre')")
                elif area_filtro.lower() == 'bar':
                    where_clauses.append("c.nombre_categoria = 'Bebida'")

            where_str = " AND ".join(where_clauses)

            query = f"""
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
                    c.nombre_categoria
                FROM pedido p
                JOIN mesa m ON p.id_mesa = m.id_mesa
                JOIN usuario u ON p.id_usuario = u.id_usuario
                JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
                JOIN producto prod ON dp.id_producto = prod.id_producto
                JOIN estado_detalle_pedido edp ON dp.id_estado_detalle = edp.id_estado_detalle
                JOIN categoria_producto c ON prod.id_categoria = c.id_categoria
                WHERE {where_str}
                ORDER BY p.fecha_pedido ASC
            """
            cursor.execute(query)
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

    # 🔥 AHORA SÍ ESTÁ DENTRO DE LA CLASE 🔥
    def actualizar_estado_pedido(self, id_pedido, nuevo_estado_id):
        with self.db.cursor() as cursor:
            # SÓLO actualizamos el estado en cocina (detalle_pedido)
            query = """
                UPDATE detalle_pedido 
                SET id_estado_detalle = %s
                WHERE id_pedido = %s
            """
            cursor.execute(query, (nuevo_estado_id, id_pedido))
                        
            return cursor.rowcount