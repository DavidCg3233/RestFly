document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formulario-login");
    const entradaUsuario = document.getElementById("usuario");
    const entradaClave = document.getElementById("clave");
    const mensajeError = document.getElementById("mensaje-error");
    const botonIngresar = document.getElementById("boton-ingresar");
    const textoBoton = document.getElementById("texto-boton");
    const cargador = document.getElementById("cargador-boton");
    const botonOjo = document.getElementById("boton-ojo");

    // 1. Mostrar/Ocultar Contraseña
    botonOjo.addEventListener("click", () => {
        const esPassword = entradaClave.type === "password";
        entradaClave.type = esPassword ? "text" : "password";
        botonOjo.classList.toggle("text-primary", esPassword);
    });

    // 2. Lógica de Envío
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        
        textoBoton.textContent = "Validando...";
        cargador.classList.remove("hidden");
        botonIngresar.disabled = true;
        mensajeError.classList.add("hidden");

        try {
            const respuesta = await fetch("http://localhost:8000/api/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario: entradaUsuario.value,
                    clave: entradaClave.value
                })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                // Guardamos la sesión en el localStorage
                localStorage.setItem("usuario_sesion", JSON.stringify(datos.usuario));
                
                // Normalizamos el rol a mayúsculas para la validación
                const rol = datos.usuario.rol_sistema ? datos.usuario.rol_sistema.toUpperCase().trim() : "";
                
                // Lista de todos los roles permitidos en tu matriz de permisos
                const rolesValidos = ["ADMINISTRADOR", "GERENTE", "CAJERO", "MESERO", "INVENTARIADOR", "OPERARIO"];
                
                if (rolesValidos.includes(rol)) {
                    // ¡TODOS los roles válidos van al cascarón principal!
                    // Desde ahí, base.html sabrá qué mostrarles y qué ocultarles.
                    window.location.href = "../../../compartido/vistas/base.html";
                } else {
                    // Si el backend responde con un rol extraño o vacío
                    alert("Acceso denegado: El rol asignado no es reconocido por el sistema.");
                    localStorage.removeItem("usuario_sesion");
                    window.location.reload();
                }
            } else {
                mensajeError.classList.remove("hidden");
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor backend.");
        } finally {
            textoBoton.textContent = "Ingresar";
            cargador.classList.add("hidden");
            botonIngresar.disabled = false;
        }
    });
});