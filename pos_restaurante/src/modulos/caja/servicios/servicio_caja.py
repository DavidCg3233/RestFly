from ..repositorios.repositorio_caja import RepositorioCaja
# 🔥 IMPORTANTE: Descomenta e importa aquí el servicio de tu módulo de mesas
from src.modulos.mesas.servicios.servicio_mesas import ServicioMesas

class ServicioCaja:

    @staticmethod
    def contar_pedidos_pendientes():
        """
        Llama al módulo de mesas y cuenta cuántos pedidos activos existen.
        """
        try:
            # Traemos el estado actual de todas las mesas
            estado_mesas = ServicioMesas.obtener_estado_inicial()
            
            # Contamos cuántos pedidos hay en la lista "pedidos"
            cantidad_pendientes = len(estado_mesas.get("pedidos", []))
            
            return cantidad_pendientes
        except Exception as e:
            print(f"Error al contar pedidos pendientes: {e}")
            # Si hay algún error de conexión o importación, retornamos 0 
            # para no bloquear la caja por un fallo externo.
            return 0

    @staticmethod
    def obtener_estado_actual():
        caja_actual = RepositorioCaja.obtener_caja_abierta()
        
        if not caja_actual:
            return {"isOpen": False, "sesion": None, "ventas": [], "movimientos": []}

        # Obtener y formatear ventas
        ventas_db = RepositorioCaja.obtener_ventas(caja_actual.id_caja)
        ventas_formato = [{
            "id": v.id_venta,  # <--- ID Entero puro, sin letras "v"
            "metodo": v.id_metodo_pago.nombre_metodo_pago,
            "total": float(v.total_venta)
        } for v in ventas_db]

        # Obtener y formatear movimientos
        movimientos_db = RepositorioCaja.obtener_movimientos(caja_actual.id_caja)
        movimientos_formato = [{
            "id": m.id_movimiento, # <--- ID Entero puro
            "tipo": "entrada" if m.id_tipo_movimiento.nombre_tipo_movimiento.lower() == 'ingreso' else "salida",
            "monto": float(m.monto),
            "desc": m.descripcion,
            "fecha": m.fecha_movimiento.isoformat()
        } for m in movimientos_db]

        # 🔥 Calculamos los pedidos pendientes para enviarlos al Frontend
        pedidos_pendientes = ServicioCaja.contar_pedidos_pendientes()

        return {
            "isOpen": True,
            "sesion": {
                "id": caja_actual.id_caja,  # <--- ¡CRÍTICO! Retorna el INT puro
                "estado_caja": caja_actual.estado_caja,
                "abiertaEn": caja_actual.fecha_apertura.isoformat(),
                "montoInicial": float(caja_actual.monto_inicial),
                "pedidosPendientes": pedidos_pendientes # <--- NUEVO DATO PARA EL JS
            },
            "ventas": ventas_formato,
            "movimientos": movimientos_formato
        }

    @staticmethod
    def procesar_apertura(monto_inicial, id_usuario):
        caja_actual = RepositorioCaja.obtener_caja_abierta()
        if caja_actual:
            raise ValueError("Ya existe una caja abierta.")
        
        nueva_caja = RepositorioCaja.crear_caja(monto_inicial, id_usuario)
        return ServicioCaja.obtener_estado_actual()

    @staticmethod
    def procesar_cierre(monto_real):
        caja_actual = RepositorioCaja.obtener_caja_abierta()
        if not caja_actual:
            raise ValueError("No hay ninguna caja abierta para cerrar.")
        
        # 🔥 EL CANDADO DEL BACKEND: Evita que cierren a la fuerza
        if ServicioCaja.contar_pedidos_pendientes() > 0:
            raise ValueError("No se puede cerrar la caja. Hay pedidos pendientes por cobrar en las mesas.")
        
        RepositorioCaja.cerrar_caja(caja_actual, monto_real)
        return {"isOpen": False, "mensaje": "Caja cerrada correctamente."}

    @staticmethod
    def agregar_movimiento(tipo, monto, descripcion):
        caja_actual = RepositorioCaja.obtener_caja_abierta()
        if not caja_actual:
            raise ValueError("Debes abrir la caja antes de registrar movimientos.")

        tipo_mov_nombre = 'ingreso' if tipo == 'entrada' else 'egreso'
        tipo_mov = RepositorioCaja.obtener_tipo_movimiento(tipo_mov_nombre)
        
        if not tipo_mov:
            raise ValueError("Tipo de movimiento no configurado en la base de datos.")

        RepositorioCaja.registrar_movimiento(caja_actual.id_caja, tipo_mov, monto, descripcion)
        return ServicioCaja.obtener_estado_actual()