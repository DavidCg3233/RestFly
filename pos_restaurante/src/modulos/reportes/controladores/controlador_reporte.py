from django.http import JsonResponse
from datetime import datetime
from ..servicios.servicio_reporte import ServicioReporte

def obtener_datos_reportes(request):
    if request.method == 'GET':
        # Valores por defecto: Mes actual
        hoy = datetime.now().strftime('%Y-%m-%d')
        fecha_inicio = request.GET.get('fecha_inicio', '2000-01-01')
        fecha_fin = request.GET.get('fecha_fin', hoy)
        tab = request.GET.get('tab', 'ventas')

        try:
            datos = ServicioReporte.procesar_reporte(fecha_inicio, fecha_fin, tab)
            return JsonResponse({'status': 'success', 'data': datos})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
            
    return JsonResponse({'error': 'Método no permitido'}, status=405)