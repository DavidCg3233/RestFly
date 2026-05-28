from django.db import transaction
# Única importación global correcta apuntando al archivo físico
from ..modelos.inventario_modelo import Inventario, Producto, Receta, CategoriaProducto, EstadoProducto

class RepositorioInventario:
    
    @staticmethod
    def obtener_todos_insumos():
        return Inventario.objects.select_related('id_producto__id_categoria').all()

    @staticmethod
    @transaction.atomic
    def crear_insumo(datos_producto, datos_inventario):
        estado, _ = EstadoProducto.objects.get_or_create(nombre_estado_producto='activo')
        categoria, _ = CategoriaProducto.objects.get_or_create(nombre_categoria=datos_producto['categoria'])
        
        producto = Producto.objects.create(
            nombre_producto=datos_producto['nombre'],
            precio=0.00,
            id_categoria=categoria,
            id_estado_producto=estado
        )
        
        inventario = Inventario.objects.create(
            id_producto=producto,
            stock_actual=datos_inventario['stock_actual'],
            stock_minimo=datos_inventario['stock_minimo'],
            unidad_medida=datos_inventario['unidad_medida']
        )
        return inventario

    @staticmethod
    def obtener_todos_platos():
        """
        Retorna todos los platos, ordenados de forma que los 'activo' y 'agotado'
        salgan primero, y los 'inactivo' se vayan al puro fondo de la lista.
        """
        # Al ordenar por el nombre del estado: 'activo' (A) y 'agotado' (A) van primero,
        # mientras que 'inactivo' (I) se va al final automáticamente por orden alfabético.
        return Producto.objects.prefetch_related('ingredientes__id_insumo__id_producto')\
            .filter(precio__gt=0)\
            .order_by('id_estado_producto__nombre_estado_producto', 'nombre_producto')

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

        # 2. Construimos y guardamos la receta
        recetas = []
        for ing in ingredientes_data:
            id_insumo = ing.get('idInsumo')
            amount = ing.get('cantidad')

            if id_insumo is None or amount is None:
                raise ValueError(f"Faltan 'idInsumo' o 'cantidad' en el ingrediente: {ing}")

            recetas.append(
                Receta(
                    id_plato=plato,
                    id_insumo_id=id_insumo, 
                    cantidad=amount
                )
            )
        
        Receta.objects.bulk_create(recetas)
        return plato
    
    @staticmethod
    @transaction.atomic
    def actualizar_plato_con_receta(id_plato, datos_plato, ingredientes_data):
        try:
            plato = Producto.objects.get(id_producto=id_plato)
        except Producto.DoesNotExist:
            raise ValueError(f"El plato con ID {id_plato} no existe.")

        categoria, _ = CategoriaProducto.objects.get_or_create(nombre_categoria=datos_plato['categoria'])
        
        # 🟢 INYECCIÓN SEGURA: Si el frontend manda un estado (o si cambió por el borrado lógico), lo actualizamos
        if 'estado' in datos_plato:
            estado_obj, _ = EstadoProducto.objects.get_or_create(nombre_estado_producto=datos_plato['estado'].lower())
            plato.id_estado_producto = estado_obj

        # 🔒 TU LÓGICA ORIGINAL SIGUE EXACTAMENTE IGUAL DESDE AQUÍ:
        plato.nombre_producto = datos_plato['nombre']
        plato.precio = datos_plato['precio']
        plato.id_categoria = categoria
        plato.save()

        # Eliminar receta anterior
        Receta.objects.filter(id_plato=plato).delete()

        # Guardar nueva receta
        recetas = []
        for ing in ingredientes_data:
            id_insumo = ing.get('idInsumo')
            amount = ing.get('cantidad')

            if id_insumo is None or amount is None:
                raise ValueError(f"Faltan 'idInsumo' o 'cantidad' en el ingrediente: {ing}")

            recetas.append(
                Receta(
                    id_plato=plato,
                    id_insumo_id=id_insumo,
                    cantidad=amount
                )
            )
        
        Receta.objects.bulk_create(recetas)
        return plato
    
    @staticmethod
    def eliminar_plato(id_plato):
        """
        Lógica Híbrida: 
        - Si el plato YA TIENE ventas: Hace borrado lógico (Inactivar).
        - Si el plato NO TIENE ventas: Hace borrado físico (Eliminar por completo).
        """
        from django.db import connection, transaction
        from ..modelos.inventario_modelo import Producto, Receta, EstadoProducto, Inventario

        with transaction.atomic():
            # 1. Consultamos directamente a MySQL si el ID ya existe en algún detalle de pedido
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM detalle_pedido WHERE id_producto = %s LIMIT 1", 
                    [id_plato]
                )
                tiene_ventas = cursor.fetchone() is not None

            if tiene_ventas:
                # 🔄 CASO A: YA TIENE VENTAS -> BORRADO LÓGICO
                estado_inactivo, _ = EstadoProducto.objects.get_or_create(nombre_estado_producto='inactivo')
                
                Producto.objects.filter(id_producto=id_plato).update(id_estado_producto=estado_inactivo)
                return {"status": "inactivado", "message": "El plato tiene ventas asociadas. Se cambió su estado a Inactivo."}
            
            else:
                # 🗑️ CASO B: NO TIENE VENTAS -> BORRADO FÍSICO
                # Limpiamos primero la receta (por la restricción FK)
                Receta.objects.filter(id_plato_id=id_plato).delete()
                
                # Limpiamos si por error se guardó algo en inventario
                Inventario.objects.filter(id_producto_id=id_plato).delete()
                
                # Eliminamos el producto definitivamente
                Producto.objects.filter(id_producto=id_plato).delete()
                return {"status": "eliminado", "message": "Plato eliminado físicamente de la base de datos."}

    @staticmethod
    def eliminar_insumo(id_insumo):
        """
        Elimina un insumo del inventario limpiando primero su rastro 
        en las recetas donde se usa para evitar el error RESTRICT.
        """
        with transaction.atomic():
            # 1. Primero eliminamos este ingrediente de CUALQUIER receta que lo use
            # Así dejamos los platos limpios y evitamos el bloqueo de llave foránea
            Receta.objects.filter(id_insumo_id=id_insumo).delete()
            
            # 2. Ahora buscamos el registro de inventario para saber cuál es su Producto padre
            try:
                inv = Inventario.objects.get(id_inventario=id_insumo)
                id_producto_asociado = inv.id_producto_id
                
                # 3. Eliminamos el registro de Inventario (hijo)
                inv.delete()
                
                # 4. Finalmente eliminamos el Producto (padre) asociado a este insumo
                Producto.objects.filter(id_producto=id_producto_asociado).delete()
                
            except Inventario.DoesNotExist:
                raise ValueError(f"El insumo con ID {id_insumo} no existe en el inventario.")

    @staticmethod
    def actualizar_insumo(id_insumo, datos_prod, datos_inv):
        """
        Actualiza los datos del Inventario y del Producto.
        """
        with transaction.atomic():
            inv = Inventario.objects.select_related('id_producto').get(id_inventario=id_insumo)
            
            inv.stock_actual = datos_inv.get('stock_actual', inv.stock_actual)
            inv.stock_minimo = datos_inv.get('stock_minimo', inv.stock_minimo)
            inv.unidad_medida = datos_inv.get('unidad_medida', inv.unidad_medida)
            inv.save()

            prod = inv.id_producto
            prod.nombre_producto = datos_prod.get('nombre', prod.nombre_producto)
            
            nombre_cat = datos_prod.get('categoria')
            if nombre_cat:
                cat = CategoriaProducto.objects.filter(nombre_categoria=nombre_cat).first()
                if cat:
                    prod.id_categoria = cat
                    
            prod.save()
    
    @staticmethod
    def descontar_stock_por_venta(id_plato, cantidad_vendida):
        """
        Busca la receta del plato vendido y resta del inventario la cantidad proporcional.
        Ecuación: Stock Nuevo = Stock Actual - (Cantidad en Receta * Cantidad Vendida)
        """
        from django.db import transaction
        from ..modelos.inventario_modelo import Receta, Inventario

        # Nos aseguramos de que corra de manera segura en la base de datos
        with transaction.atomic():
            # 1. Traemos los insumos y porciones que componen este plato específico
            receta_items = Receta.objects.filter(id_plato_id=id_plato).select_related('id_insumo__id_producto')
            
            for item in receta_items:
                # 2. ECUACIÓN DE MERMA: Multiplicamos lo que gasta 1 plato por los platos vendidos
                cantidad_a_mermar = float(item.cantidad) * float(cantidad_vendida)
                
                # 3. Bloqueamos el registro del insumo (Fila de la BD) para evitar desfases numéricos
                insumo = Inventario.objects.select_for_update().get(id_inventario=item.id_insumo_id)
                
                # 4. Restamos el proporcional al stock actual
                insumo.stock_actual = float(insumo.stock_actual) - cantidad_a_mermar
                insumo.save()
                
                # 5. LÓGICA DE INSUMO BAJO: Si el stock actual es menor o igual al mínimo, avisamos
                if insumo.stock_actual <= insumo.stock_minimo:
                    print(f"🚨 ALERT_INVENTARIO_BAJO -> El insumo '{insumo.id_producto.nombre_producto}' "
                            f"alcanzó un nivel crítico. Stock actual: {insumo.stock_actual} {insumo.unidad_medida} "
                            f"(Mínimo requerido: {insumo.stock_minimo})")