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
                "proveedor": "Por definir" 
            } for inv in insumos
        ]

    @staticmethod
    def registrar_o_actualizar_insumo(datos):
        id_insumo = datos.get('id')
        datos_prod = {
            "nombre": datos.get('nombre'),
            "categoria": datos.get('categoria', 'Básicos') 
        }
        datos_inv = {
            "stock_actual": datos.get('stock_actual', 0),
            "stock_minimo": datos.get('stock_minimo', 1),
            "unidad_medida": datos.get('unidad_medida', 'unidades')
        }
        
        if id_insumo:
            RepositorioInventario.actualizar_insumo(id_insumo, datos_prod, datos_inv)
            return "Insumo actualizado correctamente."
        else:
            RepositorioInventario.crear_insumo(datos_prod, datos_inv)
            return "Insumo creado correctamente."

    @staticmethod
    def eliminar_insumo(id_insumo):
        if not id_insumo:
            raise ValueError("Se requiere el ID del insumo para eliminar.")
        
        RepositorioInventario.eliminar_insumo(id_insumo)
        return "Insumo eliminado correctamente."

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
                "estado": p.id_estado_producto.nombre_estado_producto,
                "receta": receta
            })
        return resultado

    @staticmethod
    def registrar_o_actualizar_plato(datos):
        id_plato = datos.get('id')
        nombre = datos.get('nombre')
        precio = datos.get('precio')
        estado = datos.get('estado', 'activo')
        
        if not nombre or precio is None:
            raise ValueError("Faltan datos obligatorios: 'nombre' o 'precio' en el JSON.")

        datos_plato = {
            "nombre": nombre,
            "precio": precio,
            "categoria": datos.get('categoria', 'Comidas Rápidas'),
            "estado": estado
        }
        
        ingredientes = datos.get('receta', [])
        
        if not ingredientes:
            raise ValueError("El plato no tiene ingredientes en la llave 'receta'.")

        if id_plato:
            RepositorioInventario.actualizar_plato_con_receta(id_plato, datos_plato, ingredientes)
            return "Plato y receta actualizados correctamente."
        else:
            RepositorioInventario.crear_plato_con_receta(datos_plato, ingredientes)
            return "Plato y receta creados correctamente."

    @staticmethod
    def eliminar_plato(id_plato):
        if not id_plato:
            raise ValueError("Se requiere el ID del plato para eliminar.")
        
        # ✅ Ahora sí está dentro de la clase y alineado perfectamente
        return RepositorioInventario.eliminar_plato(id_plato)