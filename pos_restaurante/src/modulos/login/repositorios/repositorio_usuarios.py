from django.contrib.auth.hashers import check_password
from src.modulos.login.modelos.autenticacion_modelo import Usuario

from django.contrib.auth.hashers import check_password
# Mira cómo el import ahora apunta a tu nuevo archivo autenticacion_modelo
from src.modulos.login.modelos.autenticacion_modelo import Usuario
class RepositorioUsuarios:
    @staticmethod
    def buscar_por_credenciales(usuario_input, clave_input):
        """Busca al usuario en MySQL y valida sus credenciales."""
        try:
            # Traemos usuario, rol y estado de una sola vez para optimizar la consulta
            usuario = Usuario.objects.select_related('id_rol', 'id_estado_usuario').get(username=usuario_input)

            # Validar si el usuario está activo en el sistema
            if usuario.id_estado_usuario.nombre_estado_usuario != 'activo':
                return None

            # Validar contraseña (soporta texto plano para tu primera prueba manual en Workbench, o hash)
            es_valida = False
            if clave_input == usuario.contrasena:
                es_valida = True
            elif check_password(clave_input, usuario.contrasena):
                es_valida = True

            if es_valida:
                # Retornamos los datos estructurados para el token/sesión del frontend
                datos_seguros = {
                    "id_usuario": usuario.id_usuario,
                    "nombre_usuario": usuario.username,
                    "nombre_completo": f"{usuario.primer_nombre} {usuario.primer_apellido}",
                    "rol_sistema": usuario.id_rol.nombre_rol.upper(), # Lo pasamos a mayúscula para que tu JS no falle
                    "esta_activo": True
                }
                return datos_seguros
            
            return None # Clave incorrecta

        except Usuario.DoesNotExist:
            return None # El usuario no existe en la BD