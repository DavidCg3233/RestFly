# Archivo: src/modulos/caja/servicios/servicio_facturacion.py

from django.db import transaction
from ..repositorios.repositorio_facturacion import RepositorioFacturacion
from src.modulos.inventario.servicios.servicio_inventario import ServicioInventario

class ServicioFacturacion:

    TAX_RATE = 0.16  # IVA 16%

    # =========================================================
    # CONSULTAS
    # =========================================================

    @staticmethod
    def obtener_pedidos_pendientes():
        """Retorna lista de pedidos listos para cobrar."""
        return RepositorioFacturacion.obtener_pedidos_pendientes()

    @staticmethod
    def obtener_historial_ventas():
        """Retorna ventas de la sesión de caja activa."""
        return RepositorioFacturacion.obtener_historial_ventas_caja_activa()

    # =========================================================
    # PROCESAMIENTO DE PAGO
    # =========================================================

    @staticmethod
    def procesar_pago(id_pedido, metodo_pago, subtotal):
        # -- Validaciones previas ----------------------------------
        id_caja = RepositorioFacturacion.obtener_caja_activa()
        if not id_caja:
            raise ValueError("No hay una sesión de caja abierta. Abre la caja antes de cobrar.")

        pedido = RepositorioFacturacion.obtener_pedido_por_id(id_pedido)
        if not pedido:
            raise ValueError(f"El pedido #{id_pedido} no existe.")

        _, estado_actual, id_mesa = pedido
        
        if estado_actual == "pagado":   
            raise ValueError("Este pedido ya fue cobrado anteriormente.")
        if estado_actual == "cancelado":
            raise ValueError("No se puede cobrar un pedido cancelado.")

        id_metodo_pago = RepositorioFacturacion.obtener_id_metodo_pago(metodo_pago)
        if not id_metodo_pago:
            raise ValueError(f"Método de pago '{metodo_pago}' no reconocido.")

        if float(subtotal) <= 0:
            raise ValueError("El subtotal debe ser mayor a cero.")

        # -- Cálculo de totales ------------------------------------
        subtotal      = round(float(subtotal), 2)
        iva           = round(subtotal * ServicioFacturacion.TAX_RATE, 2)
        total_con_iva = round(subtotal + iva, 2)

        # -- Transacción atómica (Todo o Nada) ---------------------
        with transaction.atomic():
            # 1. Registrar la venta
            id_venta = RepositorioFacturacion.crear_venta(
                id_pedido=id_pedido,
                id_caja=id_caja,
                total=total_con_iva,
                id_metodo_pago=id_metodo_pago
            )

            # 2. Marcar el pedido como pagado
            RepositorioFacturacion.actualizar_estado_pedido(id_pedido, "pagado")

            # 3. Registrar ingreso en movimientos de caja
            id_tipo_ingreso = RepositorioFacturacion.obtener_id_tipo_movimiento("ingreso")
            RepositorioFacturacion.crear_movimiento_caja(
                id_caja=id_caja,
                id_tipo_movimiento=id_tipo_ingreso,
                monto=total_con_iva,
                descripcion=f"Venta pedido #{id_pedido} — {metodo_pago}",
                id_venta=id_venta
            )

            # 4. Generar comprobante (ticket por defecto)
            id_tipo_ticket = RepositorioFacturacion.obtener_id_tipo_comprobante("ticket")
            numero_comprobante = RepositorioFacturacion.crear_comprobante(
                id_venta=id_venta,
                id_tipo_comprobante=id_tipo_ticket
            )

            # 5. PASAR LA MESA A LIMPIEZA
            RepositorioFacturacion.actualizar_estado_mesa(id_mesa, "en_limpieza")

            # =========================================================
            # 🔥 6. SISTEMA AUTOMÁTICO DE MERMA DE INVENTARIO 🔥
            # =========================================================
            productos_vendidos = RepositorioFacturacion.obtener_productos_por_pedido(id_pedido)
            for id_producto, cantidad in productos_vendidos:
                # El inventario se encargará de buscar la receta y restar las porciones exactas
                ServicioInventario.procesar_venta_plato(id_producto, cantidad)

        return {
            "id_venta":           id_venta,
            "numero_comprobante": numero_comprobante,
            "subtotal":           subtotal,
            "iva":                iva,
            "total_cobrado":      total_con_iva,
            "metodo_pago":        metodo_pago
        }