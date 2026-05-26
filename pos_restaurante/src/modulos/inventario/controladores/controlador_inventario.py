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

        elif request.method in ['POST', 'PUT']:
            try:
                body = json.loads(request.body)
                mensaje = ServicioInventario.registrar_o_actualizar_insumo(body)
                return JsonResponse({"estado": "exitoso", "mensaje": mensaje})
            except Exception as e:
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)

        elif request.method == 'DELETE':
            try:
                body = json.loads(request.body)
                mensaje = ServicioInventario.eliminar_insumo(body.get('id'))
                return JsonResponse({"estado": "exitoso", "mensaje": mensaje})
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

        elif request.method in ['POST', 'PUT']:
            try:
                body = json.loads(request.body)
                mensaje = ServicioInventario.registrar_o_actualizar_plato(body)
                return JsonResponse({"estado": "exitoso", "mensaje": mensaje})
            except Exception as e:
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)

        elif request.method == 'DELETE':
            try:
                body = json.loads(request.body)
                resultado = ServicioInventario.eliminar_plato(body.get('id'))
                
                # El controlador ahora lee el diccionario
                return JsonResponse({
                    "estado": "exitoso", 
                    "accion": resultado["status"], 
                    "mensaje": resultado["message"]
                })
            except Exception as e:
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)