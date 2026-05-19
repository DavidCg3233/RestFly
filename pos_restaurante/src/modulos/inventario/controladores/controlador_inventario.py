import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..servicios.servicio_inventario import ServicioInventario

class ControladorInventario:
    
    @staticmethod
    @csrf_exempt
    def manejar_insumos(request):
        if request.method == 'GET':
            try:
                data = ServicioInventario.listar_insumos()
                return JsonResponse({"estado": "exitoso", "data": data})
            except Exception as e:
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

        elif request.method == 'POST':
            try:
                body = json.loads(request.body)
                ServicioInventario.registrar_insumo(body)
                return JsonResponse({"estado": "exitoso", "mensaje": "Insumo guardado correctamente."})
            except Exception as e:
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)

    @staticmethod
    @csrf_exempt
    def manejar_platos(request):
        if request.method == 'GET':
            try:
                data = ServicioInventario.listar_platos()
                return JsonResponse({"estado": "exitoso", "data": data})
            except Exception as e:
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

        elif request.method == 'POST':
            try:
                body = json.loads(request.body)
                ServicioInventario.registrar_plato(body)
                return JsonResponse({"estado": "exitoso", "mensaje": "Plato y receta guardados correctamente."})
            except Exception as e:
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)