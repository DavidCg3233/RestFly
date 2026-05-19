import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..servicios.servicio_caja import ServicioCaja

@csrf_exempt
def estado_caja(request):
    """Retorna el estado actual de la caja para poblar la vista principal."""
    if request.method == "GET":
        try:
            estado = ServicioCaja.obtener_estado_actual()
            return JsonResponse({"estado": "exitoso", "data": estado}, status=200)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)
    return JsonResponse({"mensaje": "Método no permitido."}, status=405)

@csrf_exempt
def abrir_caja(request):
    if request.method == "POST":
        try:
            cuerpo = json.loads(request.body)
            monto_inicial = float(cuerpo.get("monto_inicial", 0))
            id_usuario = cuerpo.get("id_usuario") # Lo ideal es sacarlo del token/sesión

            if monto_inicial < 0 or not id_usuario:
                return JsonResponse({"estado": "error", "mensaje": "Datos inválidos para apertura."}, status=400)

            nuevo_estado = ServicioCaja.procesar_apertura(monto_inicial, id_usuario)
            return JsonResponse({"estado": "exitoso", "data": nuevo_estado}, status=200)

        except ValueError as ve:
            return JsonResponse({"estado": "error", "mensaje": str(ve)}, status=400)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)
    return JsonResponse({"mensaje": "Método no permitido."}, status=405)

@csrf_exempt
def cerrar_caja(request):
    if request.method == "POST":
        try:
            cuerpo = json.loads(request.body)
            monto_real = float(cuerpo.get("efectivo_real", 0))

            resultado = ServicioCaja.procesar_cierre(monto_real)
            return JsonResponse({"estado": "exitoso", "data": resultado}, status=200)

        except ValueError as ve:
            return JsonResponse({"estado": "error", "mensaje": str(ve)}, status=400)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)
    return JsonResponse({"mensaje": "Método no permitido."}, status=405)

@csrf_exempt
def registrar_movimiento(request):
    if request.method == "POST":
        try:
            cuerpo = json.loads(request.body)
            tipo = cuerpo.get("tipo") # "entrada" o "salida"
            monto = float(cuerpo.get("monto", 0))
            desc = cuerpo.get("desc", "")

            if tipo not in ["entrada", "salida"] or monto <= 0 or not desc:
                return JsonResponse({"estado": "error", "mensaje": "Datos de movimiento inválidos."}, status=400)

            nuevo_estado = ServicioCaja.agregar_movimiento(tipo, monto, desc)
            return JsonResponse({"estado": "exitoso", "data": nuevo_estado}, status=200)

        except ValueError as ve:
            return JsonResponse({"estado": "error", "mensaje": str(ve)}, status=400)
        except Exception as e:
            return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)
    return JsonResponse({"mensaje": "Método no permitido."}, status=405)