# RestFly - Sistema de Gestión Integral de Restaurante (SIGIR)

## Descripción del Proyecto

RestFly es una solución de software modular diseñada para digitalizar y optimizar las operaciones críticas de un establecimiento gastronómico. El sistema gestiona desde la toma de pedidos y control de mesas, hasta el flujo de caja, inventarios, recetas y reportes financieros dinámicos.

* **Tipo de proyecto:** Proyecto académico (Desarrollo en Equipo).
* **Mi Rol Principal:** Arquitecto de Software, Diseño de Base de Datos, Control de Calidad (QA) y Desarrollo.
* **Colaboradores:** Jorge Ivan Montenegro (Líder de Integración/Commits).

## Tecnologías

* **Backend:** Python 3 y Django 6.0
* **Base de datos:** MySQL (conector `mysqlclient`)
* **Frontend:** HTML, CSS y JavaScript, con Chart.js para los reportes
* **Otras librerías:** `django-cors-headers`, `openpyxl`

## Arquitectura y Lógica Estructural

Como arquitecto del proyecto, definí un patrón de diseño basado en monolito modular (inspirado en Django) para separar claramente las reglas de negocio. La estructura del sistema se compone de la siguiente manera:

```text
restfly/
│── database.sql.sql        # Script de la base de datos
│── requirements.txt        # Dependencias de Python
│── pos_restaurante/
│   │── configuracion/      # Core settings, WSGI, ASGI, URLs
│   │
│   │── src/
│       │── compartido/     # Utilidades transversales, seguridad y vistas genéricas
│       │
│       │── modulos/        # Lógica de Negocio Aislada
│           │── caja/       # Gestión de apertura, cierre y movimientos
│           │── cocina/     # Visualización de comandas y estados
│           │── inventario/ # Control de stock, insumos y recetas
│           │── login/      # Autenticación y control de roles
│           │── mesas/      # Estados de ocupación y reservas
│           │── pedidos/    # Creación y trazabilidad de órdenes
│           │── reportes/   # Dashboard financiero interactivo (Chart.js / CSV)
│           │── tablero/    # Panel principal (Dashboard)
│           │── usuarios/   # Gestión de personal (Meseros, Cajeros, Admin)
```

## Ejecución del Proyecto Localmente

Este proyecto utiliza una arquitectura desacoplada donde **Django actúa como servidor Backend (API/Base de Datos)** y los archivos **HTML/JS actúan como el cliente Frontend**.

### Requisitos previos

* Python 3.12 o superior (desarrollado con Python 3.14)
* MySQL Server 8 o superior en ejecución (se puede administrar con MySQL Workbench)
* Git

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/DavidCg3233/RestFly.git
cd RestFly

python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux / macOS

pip install -r requirements.txt
```

> Si `mysqlclient` falla al instalarse en Windows, actualiza pip con `python -m pip install --upgrade pip` y vuelve a intentarlo.

### 2. Crear la base de datos (MySQL)

El script `database.sql.sql` crea la base de datos `restfly` y todas sus tablas, así que **no** hace falta crearla antes. Ejecútalo con (te pedirá tu contraseña de MySQL):

```bash
mysql -u root -p < database.sql.sql
```

También puedes abrir `database.sql.sql` en MySQL Workbench y ejecutarlo completo.

Luego carga los datos iniciales (roles, estados, métodos de pago y el usuario administrador): **[COMPLETAR: nombre del script de datos iniciales, por ejemplo `datos_iniciales.sql`, y subirlo al repo]**

```bash
mysql -u root -p restfly < datos_iniciales.sql
```

### 3. Configurar la conexión

Abre `pos_restaurante/configuracion/settings.py` y ajusta la sección `DATABASES` con tus datos de MySQL:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'restfly',
        'USER': 'root',            # tu usuario de MySQL
        'PASSWORD': 'tu_clave',    # tu contraseña de MySQL
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

### 4. Iniciar el Backend (Servidor Django)

```bash
cd pos_restaurante
python manage.py runserver
```

El servidor quedará corriendo en http://127.0.0.1:8000 procesando la lógica de negocio y las peticiones a la base de datos.

### 5. Iniciar el Frontend (Interfaz de Usuario)

Con el servidor de Django corriendo en segundo plano, abre en tu navegador el archivo de la interfaz:

```text
pos_restaurante/src/modulos/login/vistas/index.html
```

Puedes hacer doble clic directo sobre el archivo `index.html` o abrirlo usando una extensión como Live Server.

### Credenciales de Acceso (solo para pruebas)

Para ingresar al sistema con el rol de Administrador y probar todos los módulos (incluyendo reportes, inventario y flujo de caja):

* **Usuario:** `admin`
* **Contraseña:** `12345`

> Estas credenciales son únicamente de prueba para el entorno local.
