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
        # 🔥 Leemos el estado del frontend; si no viene, usamos 'activo'
        nombre_estado = datos_plato.get('estado', 'activo').lower()
        estado, _ = EstadoProducto.objects.get_or_create(nombre_estado_producto=nombre_estado)
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

        # 🛡️ REGLA 2: EL AUDITOR IMPLACABLE
        # Solo audita si se crea como 'activo'. Si entra como inactivo o agotado, se respeta.
        if nombre_estado == 'activo':
            for ing in ingredientes_data:
                RepositorioInventario.sincronizar_estado_platos_por_insumo(ing['idInsumo'])

        return plato

    @staticmethod
    @transaction.atomic
    def actualizar_plato_con_receta(id_plato, datos_plato, ingredientes_data):
        try:
            plato = Producto.objects.get(id_producto=id_plato)
        except Producto.DoesNotExist:
            raise ValueError(f"El plato con ID {id_plato} no existe.")

        categoria, _ = CategoriaProducto.objects.get_or_create(nombre_categoria=datos_plato['categoria'])
        
        # 🟢 INYECCIÓN SEGURA DEL ESTADO
        # Rescatamos el estado que manda el usuario o mantenemos el que ya tenía.
        estado_elegido = datos_plato.get('estado', plato.id_estado_producto.nombre_estado_producto).lower()
        if 'estado' in datos_plato:
            estado_obj, _ = EstadoProducto.objects.get_or_create(nombre_estado_producto=estado_elegido)
            plato.id_estado_producto = estado_obj

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

        # 🛡️ REGLA 2: EL AUDITOR IMPLACABLE (Corregido)
        # Solo mandamos a auditar si el usuario pide explícitamente que sea 'activo'.
        # Si lo puso en 'agotado' porque se dañó la máquina, el sistema respeta.
        if estado_elegido == 'activo':
            for ing in ingredientes_data:
                RepositorioInventario.sincronizar_estado_platos_por_insumo(ing['idInsumo'])

        return plato

    @staticmethod
    def sincronizar_estado_platos_por_insumo(id_insumo):
        """
        Revisa todos los platos que usan un insumo específico empleando el ORM.
        - 🛡️ Respeta los platos 'inactivos'.
        - 🛡️ Respeta los platos 'agotados' manualmente, aunque haya stock.
        - Si algún insumo no alcanza, pasa el plato a 'agotado'.
        - Si todos los insumos vuelven a estar bien (y no estaba agotado manual), pasa a 'activo'.
        """
        from django.db.models import F
        from ..modelos.inventario_modelo import Receta, Producto, EstadoProducto
        
        platos_asociados = Receta.objects.filter(id_insumo_id=id_insumo).values_list('id_plato_id', flat=True).distinct()
        
        for id_plato in platos_asociados:
            plato_actual = Producto.objects.get(id_producto=id_plato)
            estado_actual_nombre = plato_actual.id_estado_producto.nombre_estado_producto
            
            # 🛡️ REGLA 1: EL INACTIVO ES SAGRADO
            if estado_actual_nombre == 'inactivo':
                continue
                
            ingredientes_insuficientes = Receta.objects.filter(
                id_plato_id=id_plato,
                id_insumo__stock_actual__lt=F('cantidad')
            ).count()
            
            # 🛡️ REGLA 3: EL AGOTADO MANUAL DEBE RESPETARSE
            # Si estaba en 'agotado' pero SÍ tenemos stock de todo, significa que un humano 
            # lo bloqueó a propósito (ej. daño de freidora). NO debemos forzarlo a activo.
            if estado_actual_nombre == 'agotado' and ingredientes_insuficientes == 0:
                print(f"⚠️ Sincronización omitida: Plato ID {id_plato} tiene stock, pero fue agotado manualmente.")
                continue 

            nuevo_estado_nombre = 'agotado' if ingredientes_insuficientes > 0 else 'activo'
            
            # Si el estado calculado es igual al que ya tiene, ni siquiera tocamos la BD
            if nuevo_estado_nombre == estado_actual_nombre:
                continue
                
            estado_obj, _ = EstadoProducto.objects.get_or_create(nombre_estado_producto=nuevo_estado_nombre)
            Producto.objects.filter(id_producto=id_plato).update(id_estado_producto=estado_obj)
            
            print(f"🔄 SINCRONIZACIÓN -> Plato ID {id_plato} actualizado a estado: '{nuevo_estado_nombre}'")
    
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

            # 🔥 EL DISPARADOR: Sincronizar platos cuando se reabastece o edita el insumo
            RepositorioInventario.sincronizar_estado_platos_por_insumo(id_insumo)
    
    @staticmethod
    def descontar_stock_por_venta(id_plato, cantidad_vendida):
        """
        Busca la receta del plato vendido y resta del inventario la cantidad proporcional.
        Ajusta a 0 si hace falta y dispara la sincronización de estados del menú.
        """
        from django.db import transaction
        from ..modelos.inventario_modelo import Receta, Inventario

        with transaction.atomic():
            receta_items = Receta.objects.filter(id_plato_id=id_plato).select_related('id_insumo__id_producto')
            
            for item in receta_items:
                cantidad_a_mermar = float(item.cantidad) * float(cantidad_vendida)
                insumo = Inventario.objects.select_for_update().get(id_inventario=item.id_insumo_id)
                
                nuevo_stock = float(insumo.stock_actual) - cantidad_a_mermar
                
                if nuevo_stock < 0:
                    insumo.stock_actual = 0.0
                else:
                    insumo.stock_actual = nuevo_stock
                
                insumo.save()
                
                # 🔥 DISPARADOR: Sincronizamos el estado de los platos que usan este insumo que acaba de bajar
                # Usamos la fila limpia que guardamos: item.id_insumo_id
                RepositorioInventario.sincronizar_estado_platos_por_insumo(item.id_insumo_id) 
