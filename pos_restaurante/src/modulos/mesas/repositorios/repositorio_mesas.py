# C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\mesas\repositorios\repositorio_mesas.py

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
            query = """
                SELECT 
                    m.id_mesa, m.numero_mesa, m.capacidad, em.nombre_estado_mesa,
                    p.id_pedido, p.id_usuario
                FROM mesa m
                INNER JOIN estado_mesa em ON m.id_estado_mesa = em.id_estado_mesa
                LEFT JOIN pedido p ON m.id_mesa = p.id_mesa AND p.id_estado_pedido = 1
            """
            cursor.execute(query)
            return RepositorioMesas.dictfetchall(cursor)

    @staticmethod
    def obtener_productos_menu():
        with connection.cursor() as cursor:
            query = """
                SELECT 
                    p.id_producto, p.nombre_producto, p.descripcion, p.precio, 
                    a.nombre_area
                FROM producto p
                INNER JOIN area_trabajo a ON p.id_area = a.id_area
                WHERE p.id_estado_producto = 1 -- 1: activo
            """
            cursor.execute(query)
            return RepositorioMesas.dictfetchall(cursor)

    @staticmethod
    def obtener_detalle_pedido(id_pedido):
        with connection.cursor() as cursor:
            query = """
                SELECT 
                    dp.id_producto, pr.nombre_producto, dp.cantidad, dp.precio_unitario
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

    # 👉 AGREGA ESTE NUEVO MÉTODO AQUÍ:
    @staticmethod
    def crear_mesa(numero_mesa, capacidad):
        """
        Inserta de manera directa una nueva mesa en la base de datos de MySQL
        con estado inicial 'libre' (ID 1).
        """
        with connection.cursor() as cursor:
            query = """
                INSERT INTO mesa (numero_mesa, capacidad, id_estado_mesa)
                VALUES (%s, %s, 1)
            """
            cursor.execute(query, [numero_mesa, capacidad])
            return True
    
    @staticmethod
    def obtener_pedido_abierto_por_mesa(id_mesa):
        """Busca si la mesa ya tiene una orden abierta (estado 1)"""
        with connection.cursor() as cursor:
            query = "SELECT id_pedido FROM pedido WHERE id_mesa = %s AND id_estado_pedido = 1 LIMIT 1"
            cursor.execute(query, [id_mesa])
            row = cursor.fetchone()
            return row[0] if row else None

    @staticmethod
    def crear_pedido(id_mesa, id_usuario):
        """Crea el registro principal del pedido en estado 'abierto' (1)"""
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
        """Inserta cada plato del pedido en la BD con estado 'pendiente' (1) para cocina"""
        with connection.cursor() as cursor:
            query = """
                INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, id_estado_detalle)
                VALUES (%s, %s, %s, %s, 1)
            """
            for item in items:
                cursor.execute(query, [id_pedido, item['id_producto'], item['cantidad'], item['precio_unitario']])
    
    @staticmethod
    def eliminar_mesa(id_mesa):
        """Elimina una mesa por su ID en la base de datos"""
        with connection.cursor() as cursor:
            # Nota: Si la mesa tiene pedidos asociados, la BD podría bloquear 
            # el borrado por seguridad (llaves foráneas). ¡Eso es bueno!
            cursor.execute("DELETE FROM mesa WHERE id_mesa = %s", [id_mesa])