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
                localStorage.setItem("usuario_sesion", JSON.stringify(datos.usuario));
                
                const rol = datos.usuario.rol_sistema;
                
                if (rol === "ADMINISTRADOR") {
                    window.location.href = "../../../compartido/vistas/base.html";
                } else if (rol === "CAJERO") {
                    window.location.href = "../../caja/vistas/index.html";
                } else {
                    window.location.href = "../../../compartido/vistas/error_rol.html";
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