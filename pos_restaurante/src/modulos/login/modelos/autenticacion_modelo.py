# src/modulos/login/modelos/autenticacion_modelo.py
from django.db import models

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=30)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'rol'
        managed = False

class EstadoUsuario(models.Model):
    id_estado_usuario = models.AutoField(primary_key=True)
    nombre_estado_usuario = models.CharField(max_length=20)

    class Meta:
        db_table = 'estado_usuario'
        managed = False

# ESTA ES LA CLAVE: Asegúrate de que se llame exactamente "Usuario"
class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    primer_nombre = models.CharField(max_length=50)
    segundo_nombre = models.CharField(max_length=50, blank=True, null=True)
    primer_apellido = models.CharField(max_length=50)
    segundo_apellido = models.CharField(max_length=50, blank=True, null=True)
    contrasena = models.CharField(max_length=255)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    id_rol = models.ForeignKey(Rol, models.DO_NOTHING, db_column='id_rol')
    id_estado_usuario = models.ForeignKey(EstadoUsuario, models.DO_NOTHING, db_column='id_estado_usuario')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuario'
        managed = False