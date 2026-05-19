from django.db import models
from src.modulos.login.modelos.autenticacion_modelo import Usuario

class TipoMovimiento(models.Model):
    id_tipo_movimiento = models.AutoField(primary_key=True)
    nombre_tipo_movimiento = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'tipo_movimiento'

class MetodoPago(models.Model):
    id_metodo_pago = models.AutoField(primary_key=True)
    nombre_metodo_pago = models.CharField(max_length=30)

    class Meta:
        managed = False
        db_table = 'metodo_pago'

class Caja(models.Model):
    id_caja = models.AutoField(primary_key=True)
    fecha_apertura = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    monto_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    monto_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estado_caja = models.CharField(max_length=20, default='abierta')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.RESTRICT, db_column='id_usuario')

    class Meta:
        managed = False
        db_table = 'caja'

class Venta(models.Model):
    id_venta = models.AutoField(primary_key=True)
    id_pedido = models.IntegerField(unique=True) # Referencia al pedido
    id_caja = models.ForeignKey(Caja, on_delete=models.RESTRICT, db_column='id_caja')
    fecha_venta = models.DateTimeField(auto_now_add=True)
    total_venta = models.DecimalField(max_digits=10, decimal_places=2)
    id_metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.RESTRICT, db_column='id_metodo_pago')

    class Meta:
        managed = False
        db_table = 'venta'

class MovimientoCaja(models.Model):
    id_movimiento = models.AutoField(primary_key=True)
    id_caja = models.ForeignKey(Caja, on_delete=models.RESTRICT, db_column='id_caja')
    id_tipo_movimiento = models.ForeignKey(TipoMovimiento, on_delete=models.RESTRICT, db_column='id_tipo_movimiento')
    id_venta = models.ForeignKey(Venta, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_venta')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.TextField()
    fecha_movimiento = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'movimiento_caja'

# --- MODELO AÑADIDO PARA FACTURACIÓN ---
class Comprobante(models.Model):
    id_comprobante = models.AutoField(primary_key=True)
    # Ya que tenemos Venta en este archivo, aprovechamos para usar ForeignKey en vez de IntegerField
    id_venta = models.ForeignKey(Venta, on_delete=models.RESTRICT, db_column='id_venta', unique=True)
    numero_comprobante = models.CharField(max_length=50, unique=True)
    fecha_emision = models.DateTimeField(auto_now_add=True)
    id_tipo_comprobante = models.IntegerField()
    nombre_cliente = models.CharField(max_length=100, null=True)
    nit_cliente = models.CharField(max_length=30, null=True)
    
    class Meta:
        db_table = 'comprobante'
        managed = False