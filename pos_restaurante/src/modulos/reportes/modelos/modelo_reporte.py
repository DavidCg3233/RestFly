from django.db.models import Sum, F, FloatField, Count
from django.db.models.functions import Coalesce

# 1. Traemos todo lo de Inventario (que ya sabemos que existe aquí)
from src.modulos.inventario.modelos.inventario_modelo import Producto, Insumo, Receta

# 2. Traemos Venta, DetalleVenta y Gasto desde Caja
# (Basado en el error, asumo que DetalleVenta y Gasto están en este mismo archivo)
from src.modulos.caja.modelos.caja_modelo import Venta, DetalleVenta, Gasto

# ==========================================
# 1. GASTOS (Egresos)
# ==========================================
class Gasto(models.Model):
    fecha = models.DateField(default=timezone.now)
    concepto = models.CharField(max_length=255)
    categoria = models.CharField(max_length=100, default='General')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    responsable = models.CharField(max_length=100, default='Admin')

    class Meta:
        db_table = 'reportes_gasto'
        verbose_name = 'Gasto'
        verbose_name_plural = 'Gastos'

    def __str__(self):
        return f"{self.concepto} - ${self.monto}"


# ==========================================
# 2. VENTAS (Ingresos y Tickets)
# ==========================================
class Venta(models.Model):
    METODOS_PAGO = [
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('OTRO', 'Otro')
    ]

    fecha = models.DateTimeField(default=timezone.now)
    cliente = models.CharField(max_length=100, default='Cliente Mostrador', blank=True, null=True)
    metodo_pago = models.CharField(max_length=20, choices=METODOS_PAGO, default='EFECTIVO')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'reportes_venta'
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'

    def __str__(self):
        return f"Venta #{self.id} - {self.fecha.strftime('%Y-%m-%d')} - ${self.total}"


class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    
    # 👇 Usamos tu modelo Producto original
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'reportes_detalle_venta'
        verbose_name = 'Detalle de Venta'
        verbose_name_plural = 'Detalles de Venta'

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre} (Venta #{self.venta.id})"