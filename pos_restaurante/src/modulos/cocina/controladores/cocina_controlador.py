# C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\cocina\controladores\cocina_controlador.py

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection  # 🔥 NUEVO: Importamos la conexión viva de Django

from ..servicios.servicio_cocina import ServicioCocina
from ..repositorios.repositorio_cocina import RepositorioCocina 

class ControladorCocina:
    
    @staticmethod
    @csrf_exempt
    def manejar_obtener_pedidos(request):
        if request.method == 'GET':
            try:
                # Le pasamos la 'connection' de Django directo al repositorio
                repositorio = RepositorioCocina(connection)
                servicio = ServicioCocina(repositorio)
                
                resultado = servicio.obtener_pedidos_kanban()
                
                return JsonResponse(resultado)
                
            except Exception as e:
                print(f"❌ ERROR GET PEDIDOS COCINA/BAR: {str(e)}")
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)
        
        return JsonResponse({'estado': 'error', 'mensaje': 'Método no permitido'}, status=405)

    @staticmethod
    @csrf_exempt
    def manejar_avanzar_pedido(request):
        if request.method == 'POST':
            try:
                body = json.loads(request.body)
                
                # Le pasamos la 'connection' de Django directo al repositorio
                repositorio = RepositorioCocina(connection)
                servicio = ServicioCocina(repositorio)
                
                id_pedido = body.get('id_pedido')
                nuevo_estado = body.get('estado')
                
                exito = servicio.avanzar_estado_pedido(id_pedido, nuevo_estado)
                
                if exito:
                    return JsonResponse({"estado": "exitoso", "mensaje": "Estado actualizado."})
                else:
                    return JsonResponse({"estado": "error", "mensaje": "No se actualizó BD."}, status=400)
                    
            except Exception as e:
                print(f"❌ ERROR POST AVANZAR PEDIDO: {str(e)}")
                return JsonResponse({"estado": "error", "mensaje": str(e)}, status=400)
                
        return JsonResponse({'estado': 'error', 'mensaje': 'Método no permitido'}, status=405)