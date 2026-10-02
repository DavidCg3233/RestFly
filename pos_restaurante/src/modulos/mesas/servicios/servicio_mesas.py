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
                "zone": "GENERAL",
                "capacity": m['capacidad'],
                "status": estado_js,
                "orderId": p_id
            })

            # Si la mesa cuenta con un pedido activo/abierto en curso, extraemos el detalle completo
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
                        "qty": d['cantidad'],
                        # 👇 LE ENVIAMOS LA NOTA DE REGRESO AL FRONTEND
                        "notas": d.get('notas', '') 
                    })
                    
                pedidos_front.append({
                    "id": p_id,
                    "mesero": f"Usuario {m['id_usuario']}",
                    "total": total,
                    "items": items
                })

        productos_front = []
        for p in productos_db:
            estado_producto = p['nombre_estado_producto'].lower()
            
            # 🔥 EL GUARDIA DE SEGURIDAD: Si no está activo, lo ignoramos y pasamos al siguiente
            if estado_producto != 'activo':
                continue

            # Sincronizamos las categorías dinámicamente con tu tabla de categorías del inventario
            cat_js = p['nombre_categoria'].lower() if p['nombre_categoria'] else "cocina"

            productos_front.append({
                "id": f"prod_{p['id_producto']}",
                "name": p['nombre_producto'],
                "desc": p['descripcion'] if p['descripcion'] else "Sin descripción disponible.",
                "price": float(p['precio']),
                "cat": cat_js,
                "estado": estado_producto
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

        # 🛑 CONDICIONAL: Validar que ambos estén entre 1 y 99
        if not (1 <= numero_int <= 99) or not (1 <= capacidad_int <= 99):
            raise ValueError("El número de mesa y la capacidad deben estar entre 1 y 99.")

        # 👉 AQUÍ CONECTAMOS CON LA BASE DE DATOS REAL
        RepositorioMesas.crear_mesa(numero_int, capacidad_int)

        return True
    
    @staticmethod
    def enviar_comanda(datos):
        id_mesa_front = datos.get('id_mesa')
        id_usuario = datos.get('id_usuario', 1)
        items_front = datos.get('items', [])

        if not id_mesa_front or not items_front:
            raise ValueError("Faltan datos para procesar la comanda.")

        id_mesa = int(id_mesa_front.replace('m', ''))
        id_pedido = RepositorioMesas.obtener_pedido_abierto_por_mesa(id_mesa)

        if not id_pedido:
            id_pedido = RepositorioMesas.crear_pedido(id_mesa, id_usuario)
            RepositorioMesas.actualizar_estado_mesa(id_mesa, 2)

        detalles_bd = []
        for item in items_front:
            id_prod_front = item.get('prodId')
            id_producto = int(id_prod_front.replace('prod_', ''))
            
            detalles_bd.append({
                'id_producto': id_producto,
                'cantidad': item.get('qty'),
                'precio_unitario': item.get('price'),
                # 👇 AQUÍ CACHAMOS LA NOTA QUE MANDAS DESDE EL JS
                'notas': item.get('notas', '') 
            })

        # Tu repositorio ahora debe estar preparado para recibir 'notas' en cada diccionario
        RepositorioMesas.agregar_detalles_pedido(id_pedido, detalles_bd)

        return True
    
    @staticmethod
    def eliminar_mesa(datos):
        id_mesa = datos.get('id_mesa')
        if not id_mesa:
            raise ValueError("Falta el ID de la mesa a eliminar.")
        
        # Limpiamos el ID si el frontend lo manda con la 'm' (ej: 'm1' -> 1)
        if isinstance(id_mesa, str) and id_mesa.startswith('m'):
            id_mesa = int(id_mesa.replace('m', ''))
            
        RepositorioMesas.eliminar_mesa(id_mesa)
        return True
    
    @staticmethod
    def anular_pedido_y_liberar_mesa(datos):
        id_mesa = datos.get('id_mesa')
        id_pedido = datos.get('id_pedido')

        if not id_mesa or not id_pedido:
            raise ValueError("Falta el id_mesa o el id_pedido para realizar la anulación.")

        # 1. Pasamos la mesa a estado 'libre' (ID 1)
        RepositorioMesas.actualizar_estado_mesa(id_mesa, 1)
        
        # 2. Pasamos el pedido a estado 'cancelado' (ID 4)
        RepositorioMesas.anular_pedido(id_pedido)