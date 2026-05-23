# Archivo: src/modulos/caja/servicios/servicio_facturacion.py

from django.db import transaction
from ..repositorios.repositorio_facturacion import RepositorioFacturacion


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
        """
        Procesa el cobro de un pedido:
          1. Valida caja abierta y estado del pedido.
          2. Calcula total con IVA.
          3. Crea la venta, actualiza el pedido, registra movimiento y genera comprobante.
        
        Retorna dict con el resumen del pago.
        Lanza ValueError ante cualquier condición de negocio inválida.
        """

        # -- Validaciones previas ----------------------------------

        id_caja = RepositorioFacturacion.obtener_caja_activa()
        if not id_caja:
            raise ValueError("No hay una sesión de caja abierta. Abre la caja antes de cobrar.")

        pedido = RepositorioFacturacion.obtener_pedido_por_id(id_pedido)
        if not pedido:
            raise ValueError(f"El pedido #{id_pedido} no existe.")

        _, estado_actual = pedido
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

        # -- Transacción atómica -----------------------------------

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

        return {
            "id_venta":           id_venta,
            "numero_comprobante": numero_comprobante,
            "subtotal":           subtotal,
            "iva":                iva,
            "total_cobrado":      total_con_iva,
            "metodo_pago":        metodo_pago
        }