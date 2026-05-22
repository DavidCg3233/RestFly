from django.contrib.auth.hashers import make_password
from ..repositorios.repositorio_usuario import RepositorioUsuario
from ..modelos.modelo_usuario import Usuario


class ServicioUsuario:

    @staticmethod
    def listar_usuarios():
        usuarios = RepositorioUsuario.obtener_todos()
        return [u.to_dict() for u in usuarios]

    @staticmethod
    def listar_roles():
        return RepositorioUsuario.obtener_roles()

    @staticmethod
    def procesar_guardado(datos):
        usuario_id    = datos.get('id')
        nombre_completo = datos.get('nombre', '').strip()
        username      = datos.get('username', '').strip()
        password_raw  = datos.get('password', '')
        rol_nombre    = datos.get('rol', 'Mesero')
        activo        = datos.get('activo', True)
        telefono      = datos.get('telefono', '').strip()

        if not nombre_completo or not username:
            raise ValueError("El nombre completo y el nombre de usuario son obligatorios.")

        # Separar nombre en primer_nombre y primer_apellido
        partes = nombre_completo.split(' ', 1)
        primer_nombre   = partes[0]
        primer_apellido = partes[1] if len(partes) > 1 else ''

        if not primer_apellido:
            raise ValueError("Ingresa al menos nombre y apellido separados por espacio.")

        # Resolver FK rol
        rol_obj = RepositorioUsuario.obtener_rol_por_nombre(rol_nombre)
        if not rol_obj:
            raise ValueError(f"El rol '{rol_nombre}' no existe en la base de datos.")

        # Resolver FK estado_usuario
        nombre_estado = "activo" if activo else "inactivo"
        estado_obj = RepositorioUsuario.obtener_estado_por_nombre(nombre_estado)
        if not estado_obj:
            raise ValueError(f"El estado '{nombre_estado}' no existe en la base de datos.")

        if usuario_id:
            # ── EDITAR ──
            usuario = RepositorioUsuario.obtener_por_id(usuario_id)
            if not usuario:
                raise ValueError("El usuario solicitado no existe.")

            usuario.primer_nombre    = primer_nombre
            usuario.primer_apellido  = primer_apellido
            usuario.username         = username
            usuario.telefono         = telefono
            usuario.id_rol           = rol_obj
            usuario.id_estado_usuario = estado_obj

            if password_raw:
                usuario.contrasena = make_password(password_raw)
        else:
            # ── CREAR ──
            if not password_raw:
                raise ValueError("La contraseña es obligatoria para usuarios nuevos.")

            usuario = Usuario(
                primer_nombre    = primer_nombre,
                primer_apellido  = primer_apellido,
                username         = username,
                contrasena       = make_password(password_raw),
                telefono         = telefono,
                id_rol           = rol_obj,
                id_estado_usuario = estado_obj
            )

        RepositorioUsuario.guardar(usuario)
        return usuario.to_dict()

    @staticmethod
    def procesar_eliminacion(usuario_id):
        if not usuario_id:
            raise ValueError("ID de usuario inválido.")

        usuario = RepositorioUsuario.obtener_por_id(usuario_id)
        if not usuario:
            raise ValueError("El usuario que intenta eliminar no existe.")

        return RepositorioUsuario.eliminar(usuario)