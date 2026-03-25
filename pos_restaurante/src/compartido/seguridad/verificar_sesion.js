document.addEventListener("DOMContentLoaded", () => {
    const sesionGuardada = localStorage.getItem("usuario_sesion");

    // Si NO hay sesión, lo devolvemos al login (calculado desde base.html)
    if (!sesionGuardada) {
        window.location.replace("../../modulos/login/vistas/index.html");
        return; 
    }

    try {
        const usuario = JSON.parse(sesionGuardada);

        const elementosNombre = document.querySelectorAll(".ui-nombre-usuario");
        const elementosRol = document.querySelectorAll(".ui-rol-usuario");
        const elementosIniciales = document.querySelectorAll(".ui-iniciales-usuario");

        elementosNombre.forEach(el => el.textContent = usuario.nombre || usuario.usuario || "Usuario");
        elementosRol.forEach(el => el.textContent = usuario.rol_sistema || "SIN ROL");

        const nombreParaIniciales = usuario.nombre || usuario.usuario || "US";
        const iniciales = nombreParaIniciales.substring(0, 2).toUpperCase();
        elementosIniciales.forEach(el => el.textContent = iniciales);

    } catch (error) {
        console.error("Error al leer la sesión. Cerrando...");
        localStorage.removeItem("usuario_sesion");
        window.location.replace("../../modulos/login/vistas/index.html");
    }
});