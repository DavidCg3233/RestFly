# Archivo: src/modulos/caja/controladores/controlador_facturacion.py

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from ..servicios.servicio_facturacion import ServicioFacturacion


# =========================================================
# GET /api/caja/facturacion/pedidos-pendientes/
# =========================================================

@csrf_exempt
def pedidos_pendientes(request):
    """Retorna los pedidos listos para cobrar (sin venta asociada)."""
    if request.method != "GET":
        return JsonResponse({"mensaje": "Método no permitido."}, status=405)

    try:
        pedidos = ServicioFacturacion.obtener_pedidos_pendientes()
        return JsonResponse({
            "estado": "exitoso",
            "data":   {"pedidos": pedidos}
        }, status=200)

    except Exception as e:
        return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)


# =========================================================
# GET /api/caja/facturacion/historial-ventas/
# =========================================================

@csrf_exempt
def historial_ventas(request):
    """Retorna el historial de ventas de la sesión de caja activa."""
    if request.method != "GET":
        return JsonResponse({"mensaje": "Método no permitido."}, status=405)

    try:
        ventas = ServicioFacturacion.obtener_historial_ventas()
        return JsonResponse({
            "estado": "exitoso",
            "data":   {"ventas": ventas}
        }, status=200)

    except Exception as e:
        return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)


# =========================================================
# POST /api/caja/facturacion/procesar-pago/
# =========================================================

@csrf_exempt
def procesar_pago(request):
    """
    Procesa el cobro de un pedido.

    Body JSON esperado:
    {
        "id_pedido":   "123",
        "metodo_pago": "efectivo" | "tarjeta" | "transferencia",
        "subtotal":    150.00
    }
    """
    if request.method != "POST":
        return JsonResponse({"mensaje": "Método no permitido."}, status=405)

    try:
        cuerpo = json.loads(request.body)

        id_pedido  = cuerpo.get("id_pedido")
        metodo     = cuerpo.get("metodo_pago", "").strip()
        subtotal   = cuerpo.get("subtotal")

        # Validación básica de campos
        if not id_pedido:
            return JsonResponse({"estado": "error", "mensaje": "Falta el campo 'id_pedido'."}, status=400)
        if not metodo:
            return JsonResponse({"estado": "error", "mensaje": "Falta el campo 'metodo_pago'."}, status=400)
        if subtotal is None:
            return JsonResponse({"estado": "error", "mensaje": "Falta el campo 'subtotal'."}, status=400)

        resultado = ServicioFacturacion.procesar_pago(
            id_pedido=int(id_pedido),
            metodo_pago=metodo,
            subtotal=subtotal
        )

        return JsonResponse({
            "estado":  "exitoso",
            "mensaje": f"✅ Pago procesado correctamente. Comprobante: {resultado['numero_comprobante']}",
            "data":    resultado
        }, status=200)

    except ValueError as ve:
        # Errores de negocio esperados (caja cerrada, pedido ya pagado, etc.)
        return JsonResponse({"estado": "error", "mensaje": str(ve)}, status=400)

    except json.JSONDecodeError:
        return JsonResponse({"estado": "error", "mensaje": "El cuerpo de la petición no es JSON válido."}, status=400)

    except Exception as e:
        return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)