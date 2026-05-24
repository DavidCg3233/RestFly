# src/modulos/tablero/controladores/tablero_backend.py
from django.http import JsonResponse
from ..servicios.servicio_tablero import TableroService

def api_resumen_tablero(request):
    """Endpoint para nutrir el tablero en tiempo real."""
    if request.method == 'GET':
        try:
            datos = TableroService.obtener_datos_completos()
            return JsonResponse(datos, safe=False)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)