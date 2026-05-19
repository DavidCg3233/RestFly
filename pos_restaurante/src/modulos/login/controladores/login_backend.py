import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from src.modulos.login.repositorios.repositorio_usuarios import RepositorioUsuarios

@csrf_exempt
def validar_acceso_usuario(request):
    """Recibe la petición HTTP del frontend y responde con éxito o error."""
    if request.method == "POST":
        try:
            cuerpo = json.loads(request.body)
            nombre_u = cuerpo.get("usuario")
            clave_u = cuerpo.get("clave")

            # Validación básica de que no envíen campos vacíos
            if not nombre_u or not clave_u:
                return JsonResponse({"estado": "error", "mensaje": "Faltan credenciales."}, status=400)

            # Llamamos al repositorio para hacer la magia con la BD
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
            return JsonResponse({"estado": "error", "mensaje": f"Error del servidor: {str(e)}"}, status=500)

    return JsonResponse({"mensaje": "Método no permitido. Usa POST."}, status=405)