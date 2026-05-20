from django.contrib.auth.hashers import make_password
from ..modelos.modelo_usuario import UsuarioSistema
from ..repositorios.repositorio_usuario import UsuarioRepository

class UsuarioService:

    @staticmethod
    def listar_usuarios():
        usuarios = UsuarioRepository.obtener_todos()
        resultado = []
        for u in usuarios:
            nombre_completo = f"{u.primer_nombre} {u.primer_apellido}"
            if u.segundo_nombre:
                nombre_completo = f"{u.primer_nombre} {u.segundo_nombre} {u.primer_apellido}"
            
            resultado.append({
                "id": u.id_usuario,
                "nombre": nombre_completo,
                "correo": u.username, 
                "rol": u.id_rol.nombre_rol,
                "activo": u.id_estado_usuario.nombre_estado_usuario == "Activo"
            })
        return resultado

    @staticmethod
    def registrar_o_actualizar_usuario(datos):
        id_usuario = datos.get("id")
        nombre_completo = datos.get("nombre", "").strip()
        correo = datos.get("correo", "").strip()
        nombre_rol = datos.get("rol", "Mesero")
        es_activo = datos.get("activo", True)

        partes_nombre = nombre_completo.split()
        primer_nombre = partes_nombre[0] if len(partes_nombre) > 0 else "SinNombre"
        segundo_nombre = partes_nombre[1] if len(partes_nombre) > 2 else ""
        primer_apellido = partes_nombre[-1] if len(partes_nombre) > 1 else "SinApellido"
        segundo_apellido = partes_nombre[-2] if len(partes_nombre) == 4 else ""

        rol_obj = UsuarioRepository.buscar_rol_por_nombre(nombre_rol)
        if not rol_obj:
            raise ValueError(f"El rol '{nombre_rol}' no existe.")

        estado_str = "Activo" if es_activo else "Inactivo"
        estado_obj = UsuarioRepository.buscar_estado_por_nombre(estado_str)
        if not estado_obj:
            raise ValueError(f"El estado '{estado_str}' no está configurado.")

        if id_usuario:
            usuario_obj = UsuarioRepository.obtener_por_id(id_usuario)
            if not usuario_obj:
                raise ValueError("Usuario no encontrado.")
        else:
            usuario_obj = UsuarioSistema(contrasena=make_password("RestFly2026*"))

        usuario_obj.username = correo
        usuario_obj.primer_nombre = primer_nombre
        usuario_obj.segundo_nombre = segundo_nombre if segundo_nombre else None
        usuario_obj.primer_apellido = primer_apellido
        usuario_obj.segundo_apellido = segundo_apellido if segundo_apellido else None
        usuario_obj.id_rol = rol_obj
        usuario_obj.id_estado_usuario = estado_obj

        UsuarioRepository.guardar(usuario_obj)
        return {"id_usuario": usuario_obj.id_usuario, "mensaje": "Proceso completado"}

    @staticmethod
    def dar_de_baja_usuario(id_usuario):
        usuario_obj = UsuarioRepository.obtener_por_id(id_usuario)
        if not usuario_obj:
            raise ValueError("El usuario solicitado no existe.")
        
        UsuarioRepository.eliminar(usuario_obj)
        return True