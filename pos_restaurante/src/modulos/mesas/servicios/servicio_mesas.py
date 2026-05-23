# C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\mesas\servicios\servicio_mesas.py

from ..repositorios.repositorio_mesas import RepositorioMesas

class ServicioMesas:
    
    # Mapeo de BD a Frontend (estado_mesa)
    MAP_ESTADOS_FRONT = {
        "libre": "libre",
        "ocupada": "ocupada",
        "reservada": "reservada",
        "en_limpieza": "limpieza" 
    }

    # Mapeo de Frontend a BD para actualizar
    MAP_ESTADOS_BD = {
        "libre": 1,
        "ocupada": 2,
        "reservada": 3,
        "limpieza": 4
    }

    @staticmethod
    def obtener_estado_inicial():
        mesas_db = RepositorioMesas.obtener_mesas_y_estados()
        productos_db = RepositorioMesas.obtener_productos_menu()
        
        mesas_front = []
        pedidos_front = []
        
        for m in mesas_db:
            estado_bd = m['nombre_estado_mesa'].lower()
            estado_js = ServicioMesas.MAP_ESTADOS_FRONT.get(estado_bd, "libre")
            
            m_id = f"m{m['id_mesa']}"
            p_id = f"p{m['id_pedido']}" if m['id_pedido'] else None
            
            mesas_front.append({
                "id": m_id,
                "number": str(m['numero_mesa']).zfill(2),
                "zone": "GENERAL", # Se asume una zona global, o se ajusta si se crea tabla zonas
                "capacity": m['capacidad'],
                "status": estado_js,
                "orderId": p_id
            })

            # Si hay pedido abierto, traer detalle
            if m['id_pedido']:
                detalles = RepositorioMesas.obtener_detalle_pedido(m['id_pedido'])
                items = []
                total = 0.0
                
                for d in detalles:
                    subtotal = float(d['precio_unitario']) * d['cantidad']
                    total += subtotal
                    items.append({
                        "prodId": f"prod_{d['id_producto']}",
                        "name": d['nombre_producto'],
                        "price": float(d['precio_unitario']),
                        "qty": d['cantidad']
                    })
                    
                pedidos_front.append({
                    "id": p_id,
                    "mesero": f"Usuario {m['id_usuario']}", 
                    "total": total,
                    "items": items
                })

        productos_front = []
        for p in productos_db:
            cat_js = "cocina"
            area = p['nombre_area'].lower()
            if "bar" in area: cat_js = "bar"
            elif "postre" in area: cat_js = "postre"

            productos_front.append({
                "id": f"prod_{p['id_producto']}",
                "name": p['nombre_producto'],
                "desc": p['descripcion'] or "",
                "price": float(p['precio']),
                "cat": cat_js
            })

        return {
            "mesas": mesas_front,
            "productos": productos_front,
            "pedidos": pedidos_front
        }

    @staticmethod
    def actualizar_estado_mesa(data):
        id_mesa_front = data.get('id_mesa') # ej: "m1"
        nuevo_estado = data.get('estado')   # ej: "limpieza"
        
        if not id_mesa_front or not nuevo_estado:
            raise ValueError("Faltan parámetros: id_mesa o estado")

        id_mesa = int(id_mesa_front.replace('m', ''))
        id_estado_bd = ServicioMesas.MAP_ESTADOS_BD.get(nuevo_estado, 1)
        
        RepositorioMesas.actualizar_estado_mesa(id_mesa, id_estado_bd)

    @staticmethod
    def crear_mesa(datos_mesa):
        """
        Recibe el diccionario del frontend y crea la mesa en la base de datos.
        """
        numero = datos_mesa.get("numero")
        capacidad = datos_mesa.get("capacidad")
        
        # Validamos los datos obligatorios requeridos por tu tabla 'mesa'
        if not numero or not capacidad:
            raise ValueError("Faltan datos obligatorios (número o capacidad) para crear la mesa.")

        try:
            # Convertimos a enteros ya que el payload del frontend venía en strings ('1', '4')
            numero_int = int(numero)
            capacidad_int = int(capacidad)
        except ValueError:
            raise ValueError("El número de mesa y la capacidad deben ser valores numéricos válidos.")

        # 👉 AQUÍ CONECTAMOS CON LA BASE DE DATOS REAL
        RepositorioMesas.crear_mesa(numero_int, capacidad_int)

        return True
    
    @staticmethod
    def enviar_comanda(datos):
        id_mesa_front = datos.get('id_mesa') # ej: "m1"
        id_usuario = datos.get('id_usuario', 1)
        items_front = datos.get('items', [])

        if not id_mesa_front or not items_front:
            raise ValueError("Faltan datos para procesar la comanda.")

        # Limpiamos el ID de la mesa quitando la 'm' (ej: 'm1' -> 1)
        id_mesa = int(id_mesa_front.replace('m', ''))

        # 1. Verificamos si la mesa ya tiene un pedido abierto o si creamos uno nuevo
        id_pedido = RepositorioMesas.obtener_pedido_abierto_por_mesa(id_mesa)

        if not id_pedido:
            id_pedido = RepositorioMesas.crear_pedido(id_mesa, id_usuario)
            # Pasamos la mesa a estado 'ocupada' (ID 2 en tu BD)
            RepositorioMesas.actualizar_estado_mesa(id_mesa, 2)

        # 2. Formateamos los platos para la BD
        detalles_bd = []
        for item in items_front:
            # Limpiamos el ID del producto (ej: 'prod_1' -> 1)
            id_prod_front = item.get('prodId')
            id_producto = int(id_prod_front.replace('prod_', ''))
            
            detalles_bd.append({
                'id_producto': id_producto,
                'cantidad': item.get('qty'),
                'precio_unitario': item.get('price')
            })

        # 3. Guardamos los platos en la orden
        RepositorioMesas.agregar_detalles_pedido(id_pedido, detalles_bd)

        return True