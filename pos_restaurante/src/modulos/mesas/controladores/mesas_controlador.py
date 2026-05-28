import json
import re  # 🔥 NUEVA IMPORTACIÓN PARA LIMPIAR LETRAS
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..servicios.servicio_mesas import ServicioMesas
from django.db import transaction
from ..repositorios.repositorio_mesas import RepositorioMesas

class ControladorMesas:
    
    @staticmethod
    @csrf_exempt
    def manejar_estado_inicial(request):
        """Devuelve todo el estado inicial para pintar el frontend (mesas, productos, pedidos)"""
        if request.method == 'GET':
            try:
                data = ServicioMesas.obtener_estado_inicial()
                return JsonResponse({"estado": "exitoso", "data": data})
            except Exception as e:
                print(f"❌ ERROR GET ESTADO INICIAL MESAS: {str(e)}")
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

    @staticmethod
    @csrf_exempt
    def manejar_estado_mesa(request):
        """Actualiza el estado de una mesa específica"""
        if request.method == 'POST':
            try:
                body = json.loads(request.body)
                print(f"📩 PAYLOAD ESTADO MESA: {body}")
                ServicioMesas.actualizar_estado_mesa(body)
                return JsonResponse({"estado": "exitoso", "mensaje": "Estado de la mesa actualizado correctamente."})
            except Exception as e:
                print(f"❌ ERROR POST ESTADO MESA: {str(e)}")
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)

    @staticmethod
    @csrf_exempt
    def manejar_crear_mesa(request):
        """Crea una nueva mesa en la base de datos"""
        if request.method == 'POST':
            try:
                body = json.loads(request.body)
                print(f"📩 PAYLOAD CREAR MESA: {body}")
                ServicioMesas.crear_mesa(body)
                return JsonResponse({"estado": "exitoso", "mensaje": "Mesa creada correctamente."})
            except Exception as e:
                print(f"❌ ERROR POST CREAR MESA: {str(e)}")
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)
    
    @staticmethod
    @csrf_exempt
    def manejar_enviar_comanda(request):
        """Recibe el carrito de compras y lo envía a la base de datos como pedido"""
        if request.method == 'POST':
            try:
                body = json.loads(request.body)
                print(f"📩 PAYLOAD ENVIAR COMANDA: {body}")
                ServicioMesas.enviar_comanda(body)
                return JsonResponse({'estado': 'exitoso', 'mensaje': 'Comanda enviada a cocina'})
            except Exception as e:
                print(f"❌ ERROR POST ENVIAR COMANDA: {str(e)}")
                return JsonResponse({'estado': 'error', 'mensaje': str(e)}, status=400)
                
        return JsonResponse({'estado': 'error', 'mensaje': 'Método no permitido'}, status=405)
    
    @staticmethod
    @csrf_exempt
    def manejar_eliminar_mesa(request):
        """Atrapa la petición del frontend para eliminar una mesa"""
        if request.method == 'POST':
            try:
                body = json.loads(request.body)
                print(f"📩 PAYLOAD ELIMINAR MESA: {body}")
                ServicioMesas.eliminar_mesa(body)
                return JsonResponse({"estado": "exitoso", "mensaje": "Mesa eliminada correctamente."})
            except Exception as e:
                print(f"❌ ERROR POST ELIMINAR MESA: {str(e)}")
                # Si sale error de llave foránea, es porque la mesa tiene pedidos
                if "foreign key constraint" in str(e).lower():
                    return JsonResponse({"estado": "error", "mensaje": "No puedes eliminar una mesa que tiene pedidos registrados."}, status=400)
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)
            
    
    @staticmethod
    @csrf_exempt
    def manejar_anular_pedido(request):
        if request.method != 'POST':
            return JsonResponse({'estado': 'error', 'mensaje': 'Método no permitido'}, status=405)

        try:
            data = json.loads(request.body)
            
            # Limpiamos los IDs de cualquier letra proveniente del frontend
            id_mesa_crudo = str(data.get('id_mesa', ''))
            id_pedido_crudo = str(data.get('id_pedido', ''))
            
            id_mesa = re.sub(r'\D', '', id_mesa_crudo)
            id_pedido = re.sub(r'\D', '', id_pedido_crudo)

            if not id_mesa or not id_pedido:
                return JsonResponse({'estado': 'error', 'mensaje': 'Faltan parámetros requeridos o son inválidos.'}, status=400)

            # 🛡️ BLOQUE ATÓMICO: Evita datos inconsistentes si el servidor se apaga a mitad del proceso
            with transaction.atomic():
                # 1. CANCELAR EL PEDIDO EN BD (id_estado_pedido = 4)
                RepositorioMesas.anular_pedido(id_pedido)

                # 2. LIBERAR LA MESA EN BD (id_estado_mesa = 1)
                RepositorioMesas.actualizar_estado_mesa(id_mesa, 1)

            return JsonResponse({
                'estado': 'exitoso',
                'mensaje': 'Pedido anulado y mesa liberada correctamente.',
                'data': {
                    'id_mesa': id_mesa,
                    'id_pedido': id_pedido
                }
            })

        except Exception as e:
            import traceback
            print(f"❌ ERROR POST ANULAR PEDIDO: {str(e)}")
            print("👇 --- DETALLE DEL ERROR --- 👇")
            print(traceback.format_exc())
            print("👆 -------------------------- 👆")
            
            return JsonResponse({
                'estado': 'error',
                'mensaje': f'Error interno en el servidor: {str(e)}'
            }, status=500)