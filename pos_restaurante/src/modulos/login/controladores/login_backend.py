import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
# Importamos el repositorio (Asegúrate de que la ruta de importación sea correcta según tu proyecto)
from src.modulos.login.repositorios.repositorio_usuarios import RepositorioUsuarios
@csrf_exempt
def validar_acceso_usuario(request):
    """
    Controlador encargado de recibir las credenciales desde el frontend
    y validar el acceso contra el repositorio en memoria.
    """
    if request.method == "POST":
        try:
            cuerpo = json.loads(request.body)
            nombre_u = cuerpo.get("usuario")
            clave_u = cuerpo.get("clave")

            # Consultamos la lógica de datos
            usuario_datos = RepositorioUsuarios.buscar_por_credenciales(nombre_u, clave_u)

            if usuario_datos:
                return JsonResponse({
                    "estado": "exitoso",
                    "usuario": usuario_datos
                }, status=200)
            else:
                return JsonResponse({
                    "estado": "error",
                    "mensaje": "Usuario o clave incorrectos."
                }, status=401)

        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)

    return JsonResponse({"mensaje": "Método no permitido"}, status=405)