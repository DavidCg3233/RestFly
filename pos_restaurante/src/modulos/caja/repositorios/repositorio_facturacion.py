# Archivo: src/modulos/caja/repositorios/repositorio_facturacion.py

from django.db import connection


class RepositorioFacturacion:

   # =========================================================
    # PEDIDOS PENDIENTES DE COBRO
    # =========================================================

    @staticmethod
    def obtener_pedidos_pendientes():
        """
        Trae pedidos que aún no tienen venta asociada y que no han sido cancelados.
        """
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    p.id_pedido,
                    m.numero_mesa,
                    CONCAT(u.primer_nombre, ' ', u.primer_apellido) AS nombre_mesero,
                    p.fecha_pedido
                FROM pedido p
                INNER JOIN mesa    m  ON p.id_mesa        = m.id_mesa
                INNER JOIN usuario u  ON p.id_usuario     = u.id_usuario
                INNER JOIN estado_pedido ep ON p.id_estado_pedido = ep.id_estado_pedido
                LEFT  JOIN venta   v  ON p.id_pedido      = v.id_pedido
                -- 🔥 EL FIX DEFINITIVO: Lógica inversa 🔥
                WHERE v.id_venta IS NULL 
                    AND ep.nombre_estado_pedido NOT IN ('cancelado', 'pagado')
                ORDER BY p.fecha_pedido ASC
            """)
            pedidos_raw = cursor.fetchall()

            pedidos = []
            for id_pedido, numero_mesa, mesero, fecha_pedido in pedidos_raw:

                # Detalles de cada pedido
                cursor.execute("""
                    SELECT
                        pr.nombre_producto,
                        dp.cantidad,
                        dp.precio_unitario
                    FROM detalle_pedido dp
                    INNER JOIN producto pr ON dp.id_producto = pr.id_producto
                    WHERE dp.id_pedido = %s
                """, [id_pedido])

                items = []
                total = 0.0
                for nombre, cantidad, precio in cursor.fetchall():
                    subtotal_item = int(cantidad) * float(precio)
                    total += subtotal_item
                    items.append({
                        "name":     nombre,
                        "quantity": int(cantidad),
                        "price":    float(precio)
                    })

                pedidos.append({
                    "id":          str(id_pedido),
                    "tableNumber": str(numero_mesa),
                    "waiter":      mesero,
                    "items":       items,
                    "total":       round(total, 2),
                    "fecha":       fecha_pedido.isoformat() if fecha_pedido else None
                })

            return pedidos

    # =========================================================
    # HISTORIAL DE VENTAS DE LA CAJA ACTIVA
    # =========================================================

    @staticmethod
    def obtener_historial_ventas_caja_activa():
        """
        Retorna las ventas procesadas durante la sesión de caja abierta actual.
        """
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id_caja FROM caja
                WHERE estado_caja = 'abierta'
                ORDER BY fecha_apertura DESC
                LIMIT 1
            """)
            fila = cursor.fetchone()
            if not fila:
                return []

            id_caja = fila[0]

            cursor.execute("""
                SELECT
                    v.id_venta,
                    m.numero_mesa,
                    CONCAT(u.primer_nombre, ' ', u.primer_apellido) AS mesero,
                    mp.nombre_metodo_pago,
                    v.total_venta,
                    v.fecha_venta
                FROM venta v
                INNER JOIN pedido     p  ON v.id_pedido      = p.id_pedido
                INNER JOIN mesa       m  ON p.id_mesa         = m.id_mesa
                INNER JOIN usuario    u  ON p.id_usuario      = u.id_usuario
                INNER JOIN metodo_pago mp ON v.id_metodo_pago = mp.id_metodo_pago
                WHERE v.id_caja = %s
                ORDER BY v.fecha_venta DESC
            """, [id_caja])

            ventas = []
            for id_venta, numero_mesa, mesero, metodo, total, fecha in cursor.fetchall():
                
                # Traducir el método de pago al formato que espera el Frontend
                metodo_limpio = "tarjeta" if metodo == "tarjeta_debito" else metodo

                ventas.append({
                    "id":            f"VTA-{id_venta:04d}",
                    "tableNumber":   str(numero_mesa),
                    "waiter":        mesero,
                    "paymentMethod": metodo_limpio,
                    "total":         float(total),
                    "completedAt":   fecha.isoformat() if fecha else None
                })

            return ventas

    # =========================================================
    # CONSULTAS DE APOYO
    # =========================================================

    @staticmethod
    def obtener_caja_activa():
        """Retorna el id_caja de la sesión abierta, o None si no hay ninguna."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id_caja FROM caja
                WHERE estado_caja = 'abierta'
                ORDER BY fecha_apertura DESC
                LIMIT 1
            """)
            fila = cursor.fetchone()
            return fila[0] if fila else None

    @staticmethod
    def obtener_pedido_por_id(id_pedido):
        """Retorna (id_pedido, nombre_estado, id_mesa) o None si no existe."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT p.id_pedido, ep.nombre_estado_pedido, p.id_mesa
                FROM pedido p
                INNER JOIN estado_pedido ep ON p.id_estado_pedido = ep.id_estado_pedido
                WHERE p.id_pedido = %s
            """, [id_pedido])
            return cursor.fetchone()

    @staticmethod
    def obtener_id_metodo_pago(nombre_frontend):
        """
        Mapea el nombre corto del frontend ('tarjeta') al nombre real en BD ('tarjeta_debito').
        """
        mapeo = {
            "efectivo":      "efectivo",
            "tarjeta":       "tarjeta_debito",
            "transferencia": "transferencia",
        }
        nombre_bd = mapeo.get(nombre_frontend, nombre_frontend)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id_metodo_pago FROM metodo_pago
                WHERE nombre_metodo_pago = %s
            """, [nombre_bd])
            fila = cursor.fetchone()
            return fila[0] if fila else None

    @staticmethod
    def obtener_id_tipo_movimiento(nombre):
        """nombre: 'ingreso' | 'egreso' | 'ajuste'"""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id_tipo_movimiento FROM tipo_movimiento
                WHERE nombre_tipo_movimiento = %s
            """, [nombre])
            fila = cursor.fetchone()
            return fila[0] if fila else None

    @staticmethod
    def obtener_id_tipo_comprobante(nombre):
        """nombre: 'factura' | 'recibo' | 'ticket'"""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id_tipo_comprobante FROM tipo_comprobante
                WHERE nombre_tipo_comprobante = %s
            """, [nombre])
            fila = cursor.fetchone()
            return fila[0] if fila else None

    # =========================================================
    # ESCRITURAS (INSERT / UPDATE)
    # =========================================================

    @staticmethod
    def crear_venta(id_pedido, id_caja, total, id_metodo_pago):
        """Inserta el registro de venta y retorna el id generado."""
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO venta (id_pedido, id_caja, total_venta, id_metodo_pago)
                VALUES (%s, %s, %s, %s)
            """, [id_pedido, id_caja, total, id_metodo_pago])
            return cursor.lastrowid

    @staticmethod
    def actualizar_estado_pedido(id_pedido, nombre_estado):
        """Cambia el estado del pedido usando el nombre legible ('pagado', 'cancelado', etc.)."""
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE pedido p
                INNER JOIN estado_pedido ep ON ep.nombre_estado_pedido = %s
                SET p.id_estado_pedido = ep.id_estado_pedido
                WHERE p.id_pedido = %s
            """, [nombre_estado, id_pedido])

    @staticmethod
    def crear_movimiento_caja(id_caja, id_tipo_movimiento, monto, descripcion, id_venta=None):
        """Registra un ingreso o egreso en la caja. id_venta puede ser None."""
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO movimiento_caja
                    (id_caja, id_tipo_movimiento, monto, descripcion, id_venta)
                VALUES (%s, %s, %s, %s, %s)
            """, [id_caja, id_tipo_movimiento, monto, descripcion, id_venta])
            return cursor.lastrowid

    @staticmethod
    def crear_comprobante(id_venta, id_tipo_comprobante, nombre_cliente=None, nit_cliente=None):
        """Genera el comprobante y retorna el número de comprobante."""
        numero = f"TKT-{id_venta:06d}"
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO comprobante
                    (id_venta, numero_comprobante, id_tipo_comprobante, nombre_cliente, nit_cliente)
                VALUES (%s, %s, %s, %s, %s)
            """, [id_venta, numero, id_tipo_comprobante, nombre_cliente, nit_cliente])
        return numero
    
    @staticmethod
    def actualizar_estado_mesa(id_mesa, nombre_estado):
        """Cambia el estado de una mesa al nombre especificado (ej. 'limpieza')."""
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE mesa m
                INNER JOIN estado_mesa em ON em.nombre_estado_mesa = %s
                SET m.id_estado_mesa = em.id_estado_mesa
                WHERE m.id_mesa = %s
            """, [nombre_estado, id_mesa])