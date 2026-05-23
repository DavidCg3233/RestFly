# C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\cocina\servicios\servicio_cocina.py

class ServicioCocina:
    def __init__(self, repositorio):
        self.repo = repositorio

    def obtener_pedidos_kanban(self):
        registros = self.repo.obtener_pedidos_activos()
        pedidos_dict = {}

        # Mapeo de los estados de tu BD a los exactos que espera el JS
        mapa_estados_js = {
            'pendiente': 'pendiente',
            'en_preparacion': 'preparando',
            'listo': 'listo',
            'entregado': 'entregado'
        }

        for row in registros:
            id_pedido = row['id_pedido']
            
            # Buscamos el estado general. Si la BD no trae estado general del pedido, usamos el del detalle.
            estado_bd = row.get('nombre_estado_pedido', row.get('nombre_estado_detalle', 'pendiente'))
            estado_js = mapa_estados_js.get(estado_bd.lower(), 'pendiente')
            
            if id_pedido not in pedidos_dict:
                pedidos_dict[id_pedido] = {
                    "id": id_pedido,
                    "tableNumber": row['numero_mesa'],
                    "waiter": row['mesero'],
                    "createdAt": row['fecha_pedido'].isoformat() if hasattr(row['fecha_pedido'], 'isoformat') else row['fecha_pedido'],
                    "status": estado_js,  # 🔥 CRUCIAL: El JS necesita el estado aquí para mover las columnas
                    "items": []
                }
            
            # JS espera categorías en minúsculas ('cocina' o 'bar')
            categoria_js = str(row['nombre_area']).lower()

            # Agregamos el ítem al pedido
            pedidos_dict[id_pedido]['items'].append({
                "id": row['id_detalle'],
                "name": row['nombre_producto'],
                "quantity": row['cantidad'],
                "category": categoria_js,
                "notes": row['notas'] if row['notas'] else ""
            })

        # Retornamos en el formato { estado, data } que programamos en el fetch del JS
        return {
            'estado': 'exitoso',
            'data': list(pedidos_dict.values())
        }

    def avanzar_estado_pedido(self, id_pedido, nuevo_estado_js):
        # Mapeo invertido: El JS envía 'preparando', pero tu BD usa el ID 2 ('en_preparacion')
        estados_bd = {
            'pendiente': 1, 
            'preparando': 2, 
            'listo': 3, 
            'entregado': 4
        }
        
        id_estado = estados_bd.get(nuevo_estado_js)
        
        if id_estado:
            # NOTA: Ajusté esto para actualizar el pedido general, ya que el JS no envía el "área".
            # Si tu repo requiere el área obligatoriamente, avísame y ajustamos el JS.
            return self.repo.actualizar_estado_pedido(id_pedido, id_estado)
            
        return False