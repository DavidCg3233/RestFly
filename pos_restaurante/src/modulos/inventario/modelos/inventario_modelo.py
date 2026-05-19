from django.db import models

class CategoriaProducto(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=100)

    class Meta:
        db_table = 'categoria_producto'
        managed = False

class EstadoProducto(models.Model):
    id_estado_producto = models.AutoField(primary_key=True)
    nombre_estado_producto = models.CharField(max_length=30)

    class Meta:
        db_table = 'estado_producto'
        managed = False

class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    nombre_producto = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    id_categoria = models.ForeignKey(CategoriaProducto, on_delete=models.RESTRICT, db_column='id_categoria')
    id_estado_producto = models.ForeignKey(EstadoProducto, on_delete=models.RESTRICT, db_column='id_estado_producto')

    class Meta:
        db_table = 'producto'
        managed = False

class Inventario(models.Model):
    id_inventario = models.AutoField(primary_key=True)
    id_producto = models.OneToOneField(Producto, on_delete=models.RESTRICT, db_column='id_producto')
    stock_actual = models.DecimalField(max_digits=10, decimal_places=3)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=3)
    unidad_medida = models.CharField(max_length=20)

    class Meta:
        db_table = 'inventario'
        managed = False

# ATENCIÓN: Esta tabla debes crearla en MySQL para soportar la lógica del frontend
class Receta(models.Model):
    id_receta = models.AutoField(primary_key=True)
    id_plato = models.ForeignKey(Producto, related_name='ingredientes', on_delete=models.RESTRICT, db_column='id_plato')
    id_insumo = models.ForeignKey(Inventario, on_delete=models.RESTRICT, db_column='id_insumo')
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        db_table = 'receta'
        managed = False