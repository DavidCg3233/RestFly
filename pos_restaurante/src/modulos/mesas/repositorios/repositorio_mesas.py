from django.db import connection

class RepositorioMesas:
    
    @staticmethod
    def dictfetchall(cursor):
        """Convierte los rows del cursor a diccionarios."""
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    @staticmethod
    def obtener_mesas_y_estados():
        with connection.cursor() as cursor:
            # Traemos los pedidos en estado Abierto (1) o Enviado (2)
            # Y excluimos por completo las mesas con estado 'eliminada'
            query = """
                SELECT
                    m.id_mesa, m.numero_mesa, m.capacidad, em.nombre_estado_mesa,
                    p.id_pedido, p.id_usuario
                FROM mesa m
                INNER JOIN estado_mesa em ON m.id_estado_mesa = em.id_estado_mesa
                LEFT JOIN pedido p ON m.id_mesa = p.id_mesa 
                    AND p.id_estado_pedido IN (1, 2) 
                WHERE em.nombre_estado_mesa != 'eliminada'
            """
            cursor.execute(query)
            return RepositorioMesas.dictfetchall(cursor)

    @staticmethod
    def obtener_productos_menu():
        with connection.cursor() as cursor:
            query = """
                SELECT
                    p.id_producto, p.nombre_producto, p.descripcion, p.precio,
                    p.id_estado_producto, ep.nombre_estado_producto, c.nombre_categoria
                FROM producto p
                INNER JOIN categoria_producto c ON p.id_categoria = c.id_categoria
                INNER JOIN estado_producto ep ON p.id_estado_producto = ep.id_estado_producto
                WHERE ep.nombre_estado_producto != 'inactivo'
            """
            cursor.execute(query)
            return RepositorioMesas.dictfetchall(cursor)

    @staticmethod
    def obtener_detalle_pedido(id_pedido):
        with connection.cursor() as cursor:
            # 🔥 CORREGIDO: Añadimos 'dp.notas' a la lista de campos que solicitamos
            query = """
                SELECT 
                    dp.id_producto, pr.nombre_producto, dp.cantidad, dp.precio_unitario, dp.notas
                FROM detalle_pedido dp
                INNER JOIN producto pr ON dp.id_producto = pr.id_producto
                WHERE dp.id_pedido = %s
            """
            cursor.execute(query, [id_pedido])
            return RepositorioMesas.dictfetchall(cursor)

    @staticmethod
    def actualizar_estado_mesa(id_mesa, id_estado_mesa):
        with connection.cursor() as cursor:
            query = "UPDATE mesa SET id_estado_mesa = %s WHERE id_mesa = %s"
            cursor.execute(query, [id_estado_mesa, id_mesa])

    @staticmethod
    def crear_mesa(numero_mesa, capacidad):
        """
        🛡️ CREACIÓN INTELIGENTE: Crea la mesa o la reactiva si ya existía 
        en el historial de 'eliminadas', respetando la restricción UNIQUE.
        """
        with connection.cursor() as cursor:
            # 1. Verificar si la mesa ya existe físicamente en la base de datos
            query_verificar = """
                SELECT m.id_mesa, em.nombre_estado_mesa 
                FROM mesa m
                INNER JOIN estado_mesa em ON m.id_estado_mesa = em.id_estado_mesa
                WHERE m.numero_mesa = %s 
                LIMIT 1
            """
            cursor.execute(query_verificar, [numero_mesa])
            row = cursor.fetchone()
            
            if row:
                id_mesa, nombre_estado = row
                
                if nombre_estado == 'eliminada':
                    # 🔥 ¡RESURRECCIÓN! La mesa existía en el historial oculta. 
                    # La volvemos a activar ('libre') y actualizamos su capacidad por si cambió.
                    query_reactivar = """
                        UPDATE mesa 
                        SET id_estado_mesa = (SELECT id_estado_mesa FROM estado_mesa WHERE nombre_estado_mesa = 'libre' LIMIT 1),
                            capacidad = %s
                        WHERE id_mesa = %s
                    """
                    cursor.execute(query_reactivar, [capacidad, id_mesa])
                    return True
                else:
                    # La mesa ya está activa en el restaurante (libre, ocupada, etc.)
                    # Lanzamos un error controlado para que el backend lo responda adecuadamente
                    raise ValueError(f"La mesa número {numero_mesa} ya está activa en el sistema.")
            
            # 2. Si la mesa nunca ha existido en la historia del software, se crea desde cero
            query_insertar = """
                INSERT INTO mesa (numero_mesa, capacidad, id_estado_mesa)
                VALUES (
                    %s, %s, 
                    (SELECT id_estado_mesa FROM estado_mesa WHERE nombre_estado_mesa = 'libre' LIMIT 1)
                )
            """
            cursor.execute(query_insertar, [numero_mesa, capacidad])
            return True
    
    @staticmethod
    def obtener_pedido_abierto_por_mesa(id_mesa):
        with connection.cursor() as cursor:
            query = "SELECT id_pedido FROM pedido WHERE id_mesa = %s AND id_estado_pedido = 1 LIMIT 1"
            cursor.execute(query, [id_mesa])
            row = cursor.fetchone()
            return row[0] if row else None

    @staticmethod
    def crear_pedido(id_mesa, id_usuario):
        with connection.cursor() as cursor:
            query = """
                INSERT INTO pedido (id_mesa, id_usuario, id_estado_pedido)
                VALUES (%s, %s, 1)
            """
            cursor.execute(query, [id_mesa, id_usuario])
            cursor.execute("SELECT LAST_INSERT_ID()")
            return cursor.fetchone()[0]

    @staticmethod
    def agregar_detalles_pedido(id_pedido, items):
        with connection.cursor() as cursor:
            # 5 Columnas: id_pedido (1), id_producto (2), cantidad (3), precio_unitario (4), id_estado_detalle (5), notas (6)
            query = """
                INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, id_estado_detalle, notas)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            for item in items:
                # 6 Valores mapeados uno a uno con los %s del query
                cursor.execute(query, [
                    id_pedido,                      # 1
                    item['id_producto'],            # 2
                    item['cantidad'],               # 3
                    item['precio_unitario'],        # 4
                    1,                              # 5 (id_estado_detalle activo)
                    item.get('notas', '')           # 6
                ])
    
    @staticmethod
    def eliminar_mesa(id_mesa):
        """🛡️ BORRADO LÓGICO INTELIGENTE: Busca o crea el estado 'eliminada' dinámicamente."""
        with connection.cursor() as cursor:
            # Buscamos si existe el estado 'eliminada'
            cursor.execute("SELECT id_estado_mesa FROM estado_mesa WHERE nombre_estado_mesa = 'eliminada' LIMIT 1")
            row = cursor.fetchone()
            
            if row:
                id_estado = row[0]
            else:
                # Si no existe en los catálogos, lo insertamos al vuelo para proteger la integridad
                cursor.execute("INSERT INTO estado_mesa (nombre_estado_mesa) VALUES ('eliminada')")
                cursor.execute("SELECT LAST_INSERT_ID()")
                id_estado = cursor.fetchone()[0]
            
            # Executamos el borrado lógico seguro
            cursor.execute("UPDATE mesa SET id_estado_mesa = %s WHERE id_mesa = %s", [id_estado, id_mesa])

    @staticmethod
    def anular_pedido(id_pedido):
        """🛡️ AUDITORÍA DE PEDIDO: Cambia estados a cancelado buscando dinámicamente los IDs."""
        with connection.cursor() as cursor:
            # 1. Buscamos el ID exacto de 'cancelado' para pedidos principales
            cursor.execute("SELECT id_estado_pedido FROM estado_pedido WHERE nombre_estado_pedido = 'cancelado' LIMIT 1")
            row_p = cursor.fetchone()
            id_cancelado_pedido = row_p[0] if row_p else 4
            
            # 2. Buscamos o creamos el estado 'cancelado' para la cocina (detalle_pedido)
            cursor.execute("SELECT id_estado_detalle FROM estado_detalle_pedido WHERE nombre_estado_detalle = 'cancelado' LIMIT 1")
            row_d = cursor.fetchone()
            
            if row_d:
                id_cancelado_detalle = row_d[0]
            else:
                cursor.execute("INSERT INTO estado_detalle_pedido (nombre_estado_detalle) VALUES ('cancelado')")
                cursor.execute("SELECT LAST_INSERT_ID()")
                id_cancelado_detalle = cursor.fetchone()[0]
            
            # 3. Aplicamos la actualización lógica al pedido principal
            cursor.execute("UPDATE pedido SET id_estado_pedido = %s WHERE id_pedido = %s", [id_cancelado_pedido, id_pedido])
            
            # 4. Aplicamos la actualización a los ítems para avisar correctamente a la cocina
            cursor.execute("UPDATE detalle_pedido SET id_estado_detalle = %s WHERE id_pedido = %s", [id_cancelado_detalle, id_pedido])