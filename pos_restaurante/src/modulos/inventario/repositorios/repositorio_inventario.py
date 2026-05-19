from ..modelos.inventario_modelo import Producto, Inventario, CategoriaProducto, EstadoProducto, Receta
from django.db import transaction

class RepositorioInventario:
    
    @staticmethod
    def obtener_todos_insumos():
        # Traemos el inventario cruzado con el producto para obtener nombres y categorías
        return Inventario.objects.select_related('id_producto__id_categoria').all()

    @staticmethod
    @transaction.atomic
    def crear_insumo(datos_producto, datos_inventario):
        # 1. Buscamos o creamos el estado "activo" y la categoría
        estado, _ = EstadoProducto.objects.get_or_create(nombre_estado_producto='activo')
        categoria, _ = CategoriaProducto.objects.get_or_create(nombre_categoria=datos_producto['categoria'])
        
        # 2. Creamos el Producto (Un insumo es un producto con precio 0)
        producto = Producto.objects.create(
            nombre_producto=datos_producto['nombre'],
            precio=0.00,
            id_categoria=categoria,
            id_estado_producto=estado
        )
        
        # 3. Le creamos su registro de Inventario
        inventario = Inventario.objects.create(
            id_producto=producto,
            stock_actual=datos_inventario['stock_actual'],
            stock_minimo=datos_inventario['stock_minimo'],
            unidad_medida=datos_inventario['unidad_medida']
        )
        return inventario

    @staticmethod
    def obtener_todos_platos():
        # Traemos productos que tengan ingredientes (Recetas)
        return Producto.objects.prefetch_related('ingredientes__id_insumo__id_producto').filter(precio__gt=0)

    @staticmethod
    @transaction.atomic
    def crear_plato_con_receta(datos_plato, ingredientes_data):
        estado, _ = EstadoProducto.objects.get_or_create(nombre_estado_producto='activo')
        categoria, _ = CategoriaProducto.objects.get_or_create(nombre_categoria=datos_plato['categoria'])

        # 1. Creamos el Plato
        plato = Producto.objects.create(
            nombre_producto=datos_plato['nombre'],
            precio=datos_plato['precio'],
            id_categoria=categoria,
            id_estado_producto=estado
        )

        # 2. Guardamos la receta
        recetas = [
            Receta(
                id_plato=plato,
                id_insumo_id=ing['idInsumo'], # FK al Inventario
                cantidad=ing['cantidad']
            )
            for ing in ingredientes_data
        ]
        Receta.objects.bulk_create(recetas)
        return plato