from ..modelos.modelo_usuario import Usuario, Rol, EstadoUsuario


class RepositorioUsuario:

    @staticmethod
    def obtener_todos():
        return Usuario.objects.select_related('id_rol', 'id_estado_usuario').order_by('-fecha_creacion')

    @staticmethod
    def obtener_por_id(usuario_id):
        try:
            return Usuario.objects.select_related('id_rol', 'id_estado_usuario').get(id_usuario=usuario_id)
        except Usuario.DoesNotExist:
            return None

    @staticmethod
    def obtener_por_username(username):
        return Usuario.objects.filter(username=username).first()

    @staticmethod
    def obtener_rol_por_nombre(nombre_rol):
        try:
            return Rol.objects.get(nombre_rol=nombre_rol)
        except Rol.DoesNotExist:
            return None

    @staticmethod
    def obtener_estado_por_nombre(nombre_estado):
        try:
            return EstadoUsuario.objects.get(nombre_estado_usuario=nombre_estado)
        except EstadoUsuario.DoesNotExist:
            return None

    @staticmethod
    def obtener_roles():
        return list(Rol.objects.values('id_rol', 'nombre_rol'))

    @staticmethod
    def guardar(usuario):
        usuario.save()
        return usuario

    @staticmethod
    def eliminar(usuario):
        usuario.delete()
        return True