import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from ..servicios.servicio_usuario import UsuarioService

@method_decorator(csrf_exempt, name='dispatch')
class UsuarioControllerView(View):

    def get(self, request):
        try:
            usuarios = UsuarioService.listar_usuarios()
            return JsonResponse({"estado": "exitoso", "data": list(usuarios)}, status=200)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

    def post(self, request):
        try:
            datos = json.loads(request.body)
            resultado = UsuarioService.registrar_o_actualizar_usuario(datos)
            return JsonResponse({"estado": "exitoso", "data": resultado}, status=201)
        except ValueError as ve:
            return JsonResponse({"estado": "error", "mensaje": str(ve)}, status=400)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

    def delete(self, request):
        try:
            datos = json.loads(request.body)
            id_usuario = datos.get("id")
            if not id_usuario:
                return JsonResponse({"estado": "error", "mensaje": "Falta el ID de usuario"}, status=400)
                
            UsuarioService.dar_de_baja_usuario(id_usuario)
            return JsonResponse({"estado": "exitoso", "mensaje": "Usuario eliminado correctamente"}, status=200)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)