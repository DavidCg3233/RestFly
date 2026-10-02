# RestFly - Sistema de Gestión Integral de Restaurante (SIGIR)

## Descripción del Proyecto
RestFly es una solución de software modular diseñada para digitalizar y optimizar las operaciones críticas de un establecimiento gastronómico. El sistema gestiona desde la toma de pedidos y control de mesas, hasta el flujo de caja, inventarios, recetas y reportes financieros dinámicos.

* **Tipo de proyecto:** Proyecto académico (Desarrollo en Equipo).
* **Mi Rol Principal:** Arquitecto de Software, Diseño de Base de Datos, Control de Calidad (QA) y Desarrollo.
* **Colaboradores:** Jorge Ivan Montenegro (Líder de Integración/Commits).

## Arquitectura y Lógica Estructural
Como arquitecto del proyecto, definí un patrón de diseño basado en monolito modular (inspirado en Django) para separar claramente las reglas de negocio. La estructura del sistema se compone de la siguiente manera:

```text
restfly/
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



Ejecución del Proyecto Localmente

Este proyecto utiliza una arquitectura desacoplada donde **Django actúa como servidor Backend (API/Base de Datos)** y los archivos **HTML/JS actúan como el cliente Frontend**.

### 1. Iniciar el Backend (Servidor Django)
1. Ubícate en la carpeta del servidor backend:
bash
   cd pos_restaurante
Inicia el servidor de desarrollo en la terminal:


python manage.py runserver
(El servidor quedará corriendo en http://127.0.0.1:8000 procesando la lógica de negocio y las peticiones a la base de datos).

2. Iniciar el Frontend (Interfaz de Usuario)
Con el servidor de Django corriendo en segundo plano, abre en tu navegador el archivo de la interfaz:


pos_restaurante/src/modulos/login/vistas/index.html
(Puedes hacer doble clic directo sobre el archivo index.html o abrirlo usando una extensión como Live Server).

Credenciales de Acceso (Testing)
Para ingresar al sistema con el rol de Administrador y probar todos los módulos funcionales (incluyendo reportes, inventario y flujo de caja), utiliza:

Usuario: admin
Contraseña: 12345