from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..servicios.servicio_reporte import ServicioReporte

@csrf_exempt
def obtener_ventas_diarias(request):
    """Retorna el total de ventas agrupadas por día en un rango de fechas."""
    if request.method != "GET":
        return JsonResponse({"mensaje": "Método no permitido."}, status=405)

    # Extraer parámetros de la URL (?inicio=2026-05-01&fin=2026-05-31)
    fecha_inicio = request.GET.get("inicio")
    fecha_fin = request.GET.get("fin")

    try:
        datos = ServicioReporte.generar_reporte_ventas_diarias(fecha_inicio, fecha_fin)
        return JsonResponse({
            "estado": "exitoso",
            "data": datos
        }, status=200)

    except ValueError as ve:
        # Errores de validación (ej. fechas vacías o mal formateadas)
        return JsonResponse({"estado": "error", "mensaje": str(ve)}, status=400)
    except Exception as e:
        return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)


@csrf_exempt
def obtener_productos_top(request):
    """Retorna los productos más vendidos."""
    if request.method != "GET":
        return JsonResponse({"mensaje": "Método no permitido."}, status=405)

    try:
        limite = int(request.GET.get("limite", 10)) # Por defecto trae el Top 10
        datos = ServicioReporte.generar_reporte_productos_top(limite)
        
        return JsonResponse({
            "estado": "exitoso",
            "data": datos
        }, status=200)

    except Exception as e:
        return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)