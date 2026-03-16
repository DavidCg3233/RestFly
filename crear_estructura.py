import os

# Carpeta raíz del proyecto (cámbiala si quieres otra ruta)
RAIZ = "pos_restaurante/src"

# Carpetas compartidas y config
carpetas_compartidas = [
    "configuracion",
    "compartido/middleware",
    "compartido/utilidades",
    "compartido/constantes"
]

# Módulos según tus RFs
modulos = [
    "login",
    "usuarios",
    "mesas",
    "pedidos",
    "cocina",
    "caja",
    "inventario",
    "tablero",
    "reportes"
]

# Capas internas de cada módulo
capas = ["vistas", "controladores", "servicios", "repositorios", "modelos"]

# Archivos base opcionales
archivos_base = {
    "vistas": "index.html",
    "controladores": "controlador.py",
    "servicios": "servicio.py",
    "repositorios": "repositorio.py",
    "modelos": "modelo.py"
}

# Función para crear carpetas
def crear_carpeta(ruta):
    os.makedirs(ruta, exist_ok=True)
    print(f"Creada carpeta: {ruta}")

# Crear carpetas compartidas
for carpeta in carpetas_compartidas:
    crear_carpeta(os.path.join(RAIZ, carpeta))

# Crear módulos con sus capas
for modulo in modulos:
    for capa in capas:
        ruta_capa = os.path.join(RAIZ, "modulos", modulo, capa)
        crear_carpeta(ruta_capa)
        # Crear archivo base vacío
        archivo = archivos_base.get(capa)
        if archivo:
            ruta_archivo = os.path.join(ruta_capa, f"{modulo}.{archivo}")
            with open(ruta_archivo, "w") as f:
                f.write(f"# Archivo {archivo} del módulo {modulo}\n")
            print(f"Creado archivo: {ruta_archivo}")

# Crear archivo principal
archivo_principal = os.path.join(RAIZ, "app.py")
with open(archivo_principal, "w") as f:
    f.write("# Entrada principal de la aplicación\n")
print(f"Creado archivo: {archivo_principal}")

print("\n✅ Estructura de carpetas creada con éxito en español")