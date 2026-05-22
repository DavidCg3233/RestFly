import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from ..servicios.servicio_usuario import ServicioUsuario


@method_decorator(csrf_exempt, name='dispatch')
class UsuarioControllerView(View):

    def get(self, request, *args, **kwargs):
        try:
            usuarios = ServicioUsuario.listar_usuarios()
            roles    = ServicioUsuario.listar_roles()
            return JsonResponse({"estado": "exitoso", "data": usuarios, "roles": roles}, status=200)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

    def post(self, request, *args, **kwargs):
        try:
            datos = json.loads(request.body)
            resultado = ServicioUsuario.procesar_guardado(datos)
            return JsonResponse({"estado": "exitoso", "data": resultado}, status=200)
        except ValueError as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

    def delete(self, request, *args, **kwargs):
        try:
            datos = json.loads(request.body)
            ServicioUsuario.procesar_eliminacion(datos.get('id'))
            return JsonResponse({"estado": "exitoso", "mensaje": "Usuario removido correctamente"}, status=200)
        except ValueError as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)