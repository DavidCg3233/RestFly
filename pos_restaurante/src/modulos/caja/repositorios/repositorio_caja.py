from django.utils import timezone
from ..modelos.caja_modelo import Caja, MovimientoCaja, TipoMovimiento, Venta

class RepositorioCaja:
    
    @staticmethod
    def obtener_caja_abierta():
        """Retorna la sesión de caja actualmente abierta, si existe (case-insensitive)."""
        return Caja.objects.filter(estado_caja__iexact='abierta').first()

    @staticmethod
    def crear_caja(monto_inicial, id_usuario):
        """Abre una nueva caja asegurando enteros limpios en las FK."""
        caja = Caja(
            monto_inicial=monto_inicial,
            estado_caja='abierta',
            id_usuario_id=int(id_usuario),  # Forzamos a entero para que MySQL no proteste
            fecha_apertura=timezone.now()
        )
        caja.save()
        return caja

    @staticmethod
    def cerrar_caja(caja, monto_final):
        """Cierra una caja existente."""
        caja.estado_caja = 'cerrada'
        caja.monto_final = monto_final
        caja.fecha_cierre = timezone.now()
        caja.save()
        return caja

    @staticmethod
    def obtener_tipo_movimiento(nombre):
        return TipoMovimiento.objects.filter(nombre_tipo_movimiento=nombre).first()

    @staticmethod
    def registrar_movimiento(id_caja, tipo_movimiento, monto, descripcion):
        """Registra una entrada o salida manual de la caja."""
        movimiento = MovimientoCaja(
            id_caja_id=id_caja,
            id_tipo_movimiento=tipo_movimiento,
            monto=monto,
            descripcion=descripcion,
            fecha_movimiento=timezone.now()
        )
        movimiento.save()
        return movimiento

    @staticmethod
    def obtener_movimientos(id_caja):
        """Obtiene todos los movimientos de una caja ordenados por los más recientes."""
        return MovimientoCaja.objects.filter(id_caja_id=id_caja).select_related('id_tipo_movimiento').order_by('-fecha_movimiento')

    @staticmethod
    def obtener_ventas(id_caja):
        """Obtiene todas las ventas de la sesión actual."""
        return Venta.objects.filter(id_caja_id=id_caja).select_related('id_metodo_pago')