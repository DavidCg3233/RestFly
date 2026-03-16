# pos_restaurante/src/modulos/login/repositorio/repositorio_usuarios.py

# Simulación fiel de la tabla 'usuarios'
_TABLA_USUARIOS = [
    {
        "id_usuario": 1,
        "nombre_usuario": "admin",
        "contrasena_hash": "12345", 
        "nombre_completo": "Admin RestFly",
        "correo_electronico": "admin@restfly.com",
        "rol_sistema": "ADMINISTRADOR",
        "esta_activo": True
    },
    {
        "id_usuario": 2,
        "nombre_usuario": "caja1",
        "contrasena_hash": "caja123",
        "nombre_completo": "Ana García",
        "correo_electronico": "ana@restfly.com",
        "rol_sistema": "CAJERO",
        "esta_activo": True
    }
]

class RepositorioUsuarios:
    @staticmethod
    def buscar_por_credenciales(usuario_input, clave_input):
        """Busca y retorna el usuario si las credenciales son correctas."""
        for u in _TABLA_USUARIOS:
            if (u["nombre_usuario"] == usuario_input and 
                u["contrasena_hash"] == clave_input and 
                u["esta_activo"]):
                
                # Retornamos copia sin la contraseña por seguridad
                datos_seguros = u.copy()
                del datos_seguros["contrasena_hash"]
                return datos_seguros
        return None