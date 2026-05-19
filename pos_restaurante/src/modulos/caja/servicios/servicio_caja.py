from ..repositorios.repositorio_caja import RepositorioCaja

class ServicioCaja:

    @staticmethod
    def obtener_estado_actual():
        caja_actual = RepositorioCaja.obtener_caja_abierta()
        
        if not caja_actual:
            return {"isOpen": False, "sesion": None, "ventas": [], "movimientos": []}

        # Obtener y formatear ventas
        ventas_db = RepositorioCaja.obtener_ventas(caja_actual.id_caja)
        ventas_formato = [{
            "id": f"v{v.id_venta}",
            "metodo": v.id_metodo_pago.nombre_metodo_pago,
            "total": float(v.total_venta)
        } for v in ventas_db]

        # Obtener y formatear movimientos
        movimientos_db = RepositorioCaja.obtener_movimientos(caja_actual.id_caja)
        movimientos_formato = [{
            "id": f"mov-{m.id_movimiento}",
            "tipo": "entrada" if m.id_tipo_movimiento.nombre_tipo_movimiento == 'ingreso' else "salida",
            "monto": float(m.monto),
            "desc": m.descripcion,
            "fecha": m.fecha_movimiento.isoformat()
        } for m in movimientos_db]

        return {
            "isOpen": True,
            "sesion": {
                "id": f"ses-{caja_actual.id_caja}",
                "abiertaEn": caja_actual.fecha_apertura.isoformat(),
                "montoInicial": float(caja_actual.monto_inicial)
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