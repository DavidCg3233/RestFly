from ..repositorios.repositorio_inventario import RepositorioInventario

class ServicioInventario:
    
    @staticmethod
    def listar_insumos():
        insumos = RepositorioInventario.obtener_todos_insumos()
        return [
            {
                "id_inventario": inv.id_inventario,
                "nombre": inv.id_producto.nombre_producto,
                "categoria": inv.id_producto.id_categoria.nombre_categoria,
                "stock_actual": float(inv.stock_actual),
                "stock_minimo": float(inv.stock_minimo),
                "unidad_medida": inv.unidad_medida,
                "proveedor": "Por definir" # Omitido en la DB actual
            } for inv in insumos
        ]

    @staticmethod
    def registrar_insumo(datos):
        datos_prod = {
            "nombre": datos.get('nombre'),
            "categoria": datos.get('categoria', 'Básicos') # Asume Básicos si no llega
        }
        datos_inv = {
            "stock_actual": datos.get('stock_actual', 0),
            "stock_minimo": datos.get('stock_minimo', 1),
            "unidad_medida": datos.get('unidad_medida', 'unidades')
        }
        RepositorioInventario.crear_insumo(datos_prod, datos_inv)

    @staticmethod
    def listar_platos():
        platos = RepositorioInventario.obtener_todos_platos()
        resultado = []
        for p in platos:
            receta = [
                {
                    "idInsumo": r.id_insumo.id_inventario,
                    "nombre": r.id_insumo.id_producto.nombre_producto,
                    "cantidad": float(r.cantidad),
                    "unidad": r.id_insumo.unidad_medida
                } for r in p.ingredientes.all()
            ]
            resultado.append({
                "id": p.id_producto,
                "nombre": p.nombre_producto,
                "categoria": p.id_categoria.nombre_categoria,
                "precio": float(p.precio),
                "receta": receta
            })
        return resultado

    @staticmethod
    def registrar_plato(datos):
        nombre = datos.get('nombre')
        precio = datos.get('precio')
        
        # Validación temprana de campos obligatorios
        if not nombre or precio is None:
            raise ValueError("Faltan datos obligatorios: 'nombre' o 'precio' en el JSON.")

        datos_plato = {
            "nombre": nombre,
            "precio": precio,
            "categoria": datos.get('categoria', 'Comidas Rápidas')
        }
        
        ingredientes = datos.get('receta', [])
        
        # Validación temprana de receta vacía
        if not ingredientes:
            raise ValueError("El plato no tiene ingredientes en la llave 'receta'.")

        RepositorioInventario.crear_plato_con_receta(datos_plato, ingredientes)