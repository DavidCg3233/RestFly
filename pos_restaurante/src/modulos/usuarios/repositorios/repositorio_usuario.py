from ..modelos.modelo_usuario import UsuarioSistema, RolUsuario, EstadoDelUsuario

class UsuarioRepository:
    
    @staticmethod
    def obtener_todos():
        return UsuarioSistema.objects.select_related('id_rol', 'id_estado_usuario').all()

    @staticmethod
    def obtener_por_id(id_usuario):
        try:
            return UsuarioSistema.objects.select_related('id_rol', 'id_estado_usuario').get(pk=id_usuario)
        except UsuarioSistema.DoesNotExist:
            return None

    @staticmethod
    def buscar_rol_por_nombre(nombre_rol):
        return RolUsuario.objects.filter(nombre_rol=nombre_rol).first()

    @staticmethod
    def buscar_estado_por_nombre(nombre_estado):
        return EstadoDelUsuario.objects.filter(nombre_estado_usuario=nombre_estado).first()

    @staticmethod
    def guardar(usuario_obj):
        usuario_obj.save()
        return usuario_obj

    @staticmethod
    def eliminar(usuario_obj):
        usuario_obj.delete()