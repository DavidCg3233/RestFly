/**
 * Nombre del Archivo: usuarios_frontend.js
 * Ruta: src/modulos/usuarios/controladores/usuarios_frontend.js
 * Descripción: Controlador dinámico sincronizado con Django para la gestión de personal y permisos.
 */

(function() {
    console.log("👥 Módulo de Gestión de Usuarios y Permisos sincronizado.");

    // --- CONFIGURACIÓN API ---
    var API_BASE = "http://127.0.0.1:8000/api/usuarios/";

    var ROLES = ["Administrador", "Gerente", "Cajero", "Mesero", "Inventariador"];
    var MODULES = ["Dashboard", "Usuarios", "Mesas", "Pedidos", "Cocina", "Inventario", "Reportes"];

    var ROLE_PERMISSIONS = {
        Administrador: ["Dashboard", "Usuarios", "Mesas", "Pedidos", "Cocina", "Inventario", "Reportes"],
        Gerente: ["Dashboard", "Mesas", "Pedidos", "Cocina", "Inventario", "Reportes"],
        Cajero: ["Mesas", "Pedidos", "Reportes"],
        Mesero: ["Mesas", "Pedidos"],
        Inventariador: ["Inventario"],
    };

    var ROLE_COLORS = {
        Administrador: "bg-primary/20 text-primary border-primary/30",
        Gerente: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        Cajero: "bg-green-500/20 text-green-400 border-green-500/30",
        Mesero: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        Inventariador: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };

    // --- ESTADO LOCAL PROTEGIDO ---
    window.estadoUsuarios = window.estadoUsuarios || {
        lista: [],
        busqueda: ""
    };

    var rolSeleccionado = "Mesero";
    var estadoActivo = true;
    var idConfirmarEliminar = null;

    // ==========================================
    // SINCRO CON BACKEND
    // ==========================================
    async function initUsuarios() {
        await cargarUsuariosBackend();
        window.renderizarUsuarios(window.estadoUsuarios.busqueda);
        window.renderizarMatrizPermisos();
    }

    async function cargarUsuariosBackend() {
        try {
            const res = await fetch(API_BASE);
            const resData = await res.json();
            if (resData.estado === "exitoso") {
                window.estadoUsuarios.lista = resData.data;
            }
        } catch (error) {
            console.error("❌ Error descargando usuarios del servidor:", error);
            window.estadoUsuarios.lista = [];
        }
    }

    // ==========================================
    // RENDERIZADORES COMPATIBLES
    // ==========================================
    window.renderizarUsuarios = function(filtro = "") {
        const tbody = document.getElementById("tabla-usuarios-body");
        const contador = document.getElementById("contador-usuarios");
        if (!tbody) return;
        
        tbody.innerHTML = "";

        const filtrados = window.estadoUsuarios.lista.filter(u => 
            u.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
            u.correo.toLowerCase().includes(filtro.toLowerCase()) ||
            u.rol.toLowerCase().includes(filtro.toLowerCase())
        );

        if (contador) contador.textContent = `${filtrados.length} usuarios registrados`;

        if (filtrados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-muted italic">No se encontraron usuarios en la base de datos.</td></tr>`;
            return;
        }

        filtrados.forEach(user => {
            const colorRol = ROLE_COLORS[user.rol] || "bg-secondary text-foreground border-border";
            const estadoHTML = user.activo 
                ? `<span class="inline-flex items-center gap-1 text-xs font-medium text-green-500"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Activo</span>`
                : `<span class="inline-flex items-center gap-1 text-xs font-medium text-muted"><span class="w-1.5 h-1.5 rounded-full bg-muted"></span>Inactivo</span>`;

            const esEliminando = idConfirmarEliminar === user.id;
            const accionesHTML = esEliminando ? `
                <div class="flex gap-1 justify-end">
                    <button onclick="window.eliminarUsuarioDefinitivo('${user.id}')" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-destructive/20 text-destructive"><i data-lucide="check" class="w-4 h-4"></i></button>
                    <button onclick="window.cancelarEliminar()" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted"><i data-lucide="x" class="w-4 h-4"></i></button>
                </div>
            ` : `
                <div class="flex gap-1 justify-end">
                    <button onclick="window.abrirModalUsuario('${user.id}')" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted" title="Editar"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button onclick="window.confirmarEliminar('${user.id}')" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-destructive/20 text-muted hover:text-destructive" title="Eliminar"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;

            const tr = document.createElement("tr");
            tr.className = "hover:bg-secondary/30 transition-colors border-b border-border/50";
            tr.innerHTML = `
                <td class="px-4 py-3 font-medium text-foreground">${user.nombre}</td>
                <td class="px-4 py-3 text-muted">${user.correo}</td>
                <td class="px-4 py-3"><span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorRol}">${user.rol}</span></td>
                <td class="px-4 py-3">${estadoHTML}</td>
                <td class="px-4 py-3">${accionesHTML}</td>
            `;
            tbody.appendChild(tr);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.renderizarMatrizPermisos = function() {
        const thead = document.getElementById("matriz-head");
        const tbody = document.getElementById("matriz-body");
        if (!thead || !tbody) return;

        let trHead = `<tr class="border-b border-border"><th class="text-left py-2 pr-4 text-muted font-medium">Módulo</th>`;
        ROLES.forEach(r => trHead += `<th class="text-center py-2 px-3 text-muted font-medium text-xs">${r}</th>`);
        trHead += `</tr>`;
        thead.innerHTML = trHead;

        let filas = '';
        MODULES.forEach(mod => {
            let fila = `<tr class="border-b border-border/50 hover:bg-secondary/30"><td class="py-2.5 pr-4 text-foreground font-medium">${mod}</td>`;
            ROLES.forEach(rol => {
                const tienePermiso = ROLE_PERMISSIONS[rol].includes(mod);
                fila += `<td class="text-center py-2.5 px-3"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full ${tienePermiso ? 'bg-primary/20 text-primary' : 'bg-border/40 text-muted'}"><i data-lucide="${tienePermiso ? 'check' : 'x'}" class="w-3 h-3"></i></span></td>`;
            });
            filas += fila + `</tr>`;
        });
        tbody.innerHTML = filas;
    };

    // ==========================================
    // INTERACCIÓN Y MODALES
    // ==========================================
    window.abrirModalUsuario = function(id = null) {
        const modal = document.getElementById("modal-usuario");
        const form = document.getElementById("form-usuario");
        if (!modal) return;
        
        form.reset();
        document.getElementById("usuario-id").value = id || "";
        
        if (id) {
            const user = window.estadoUsuarios.lista.find(u => String(u.id) === String(id));
            document.getElementById("modal-titulo").textContent = "Editar Usuario";
            document.getElementById("usuario-nombre").value = user.nombre;
            document.getElementById("usuario-correo").value = user.correo;
            rolSeleccionado = user.rol;
            estadoActivo = user.activo;
        } else {
            document.getElementById("modal-titulo").textContent = "Nuevo Usuario";
            rolSeleccionado = "Mesero";
            estadoActivo = true;
        }
        window.renderizarBotonesRoles();
        window.actualizarToggleUI();
        modal.classList.remove("hidden");
    };

    window.cerrarModalUsuario = () => document.getElementById("modal-usuario").classList.add("hidden");

    window.renderizarBotonesRoles = function() {
        const contenedor = document.getElementById("contenedor-roles");
        if (!contenedor) return;
        contenedor.innerHTML = "";
        ROLES.forEach(r => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = r;
            btn.className = `px-3 py-2 rounded-lg text-sm font-medium border transition-all ${rolSeleccionado === r ? "bg-primary/20 text-primary border-primary/50" : "bg-secondary text-muted border-border hover:border-primary/30"}`;
            btn.onclick = () => { rolSeleccionado = r; window.renderizarBotonesRoles(); };
            contenedor.appendChild(btn);
        });
    };

    window.actualizarToggleUI = function() {
        const toggleBg = document.getElementById("toggle-estado");
        const toggleBola = document.getElementById("toggle-bola");
        const texto = document.getElementById("texto-estado");
        if (!toggleBg) return;

        if (estadoActivo) {
            toggleBg.className = "relative w-10 h-5 rounded-full bg-primary transition-colors cursor-pointer";
            toggleBola.className = "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform translate-x-5";
            texto.textContent = "Usuario activo";
        } else {
            toggleBg.className = "relative w-10 h-5 rounded-full bg-border transition-colors cursor-pointer";
            toggleBola.className = "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform translate-x-0";
            texto.textContent = "Usuario inactivo";
        }
    };

    window.alternarEstadoUsuario = () => { estadoActivo = !estadoActivo; window.actualizarToggleUI(); };

    // 🔥 Envío de datos real a Django via POST
    window.guardarUsuario = async function() {
        const id = document.getElementById("usuario-id").value;
        const nombre = document.getElementById("usuario-nombre").value.trim();
        const correo = document.getElementById("usuario-correo").value.trim();
        
        if (!nombre || !correo) return alert("Completa los campos obligatorios");

        const payload = {
            id: id ? parseInt(id) : null,
            nombre: nombre,
            correo: correo,
            rol: rolSeleccionado,
            activo: estadoActivo
        };

        try {
            const response = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            if (data.estado === "exitoso") {
                window.cerrarModalUsuario();
                await initUsuarios(); // Refresca la tabla al instante
            } else {
                alert("Error de servidor: " + data.mensaje);
            }
        } catch (error) {
            console.error("❌ Error enviando usuario:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };

    window.confirmarEliminar = (id) => { idConfirmarEliminar = id; window.renderizarUsuarios(window.estadoUsuarios.busqueda); };
    window.cancelarEliminar = () => { idConfirmarEliminar = null; window.renderizarUsuarios(window.estadoUsuarios.busqueda); };
    
    // 🔥 Petición DELETE real al Backend
    window.eliminarUsuarioDefinitivo = async function(id) {
        try {
            const response = await fetch(API_BASE, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: parseInt(id) })
            });
            const data = await response.json();
            
            if (data.estado === "exitoso") {
                idConfirmarEliminar = null;
                await initUsuarios();
            } else {
                alert("No se pudo eliminar: " + data.mensaje);
            }
        } catch (error) {
            console.error("❌ Error eliminando usuario:", error);
        }
    };

    // Escucha del input de búsqueda
    const buscador = document.getElementById("buscador-usuarios");
    if (buscador) {
        buscador.addEventListener("input", (e) => {
            window.estadoUsuarios.busqueda = e.target.value;
            window.renderizarUsuarios(e.target.value);
        });
    }

    // --- AUTO-INICIALIZACIÓN BAJO VIGILANCIA ---
    function vigilarVistaUsuarios() {
        const moduloUsuarios = document.getElementById("buscador-usuarios"); // Elemento único de la vista
        if (moduloUsuarios) {
            if (!moduloUsuarios.dataset.inicializado) {
                moduloUsuarios.dataset.inicializado = "true";
                initUsuarios();
            }
        }
    }
    
    if (window.vigilanteUserInterval) clearInterval(window.vigilanteUserInterval);
    window.vigilanteUserInterval = setInterval(vigilarVistaUsuarios, 300);

})();