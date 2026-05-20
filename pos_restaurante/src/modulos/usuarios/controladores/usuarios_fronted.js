// ==========================================
// ESTADO Y PERSISTENCIA (Uso de var para evitar errores en SPA)
// ==========================================
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

// Base de datos persistente en window
window.dbUsuarios = window.dbUsuarios || [
    { id: "u1", nombre: "Carlos Admin", correo: "carlos@restfly.com", rol: "Administrador", activo: true },
    { id: "u2", nombre: "María Pérez", correo: "maria@restfly.com", rol: "Mesero", activo: true },
    { id: "u3", nombre: "Juan Cajero", correo: "juan@restfly.com", rol: "Cajero", activo: false }
];

// Estado global para formularios
var rolSeleccionado = "Mesero";
var estadoActivo = true;
var idConfirmarEliminar = null;

// ==========================================
// FUNCIONES DE RENDERIZADO
// ==========================================

window.renderizarUsuarios = function(filtro = "") {
    const tbody = document.getElementById("tabla-usuarios-body");
    const contador = document.getElementById("contador-usuarios");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    const filtrados = window.dbUsuarios.filter(u => 
        u.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
        u.correo.toLowerCase().includes(filtro.toLowerCase()) ||
        u.rol.toLowerCase().includes(filtro.toLowerCase())
    );

    if (contador) contador.textContent = `${filtrados.length} usuarios registrados`;

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-muted">No se encontraron usuarios.</td></tr>`;
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
                <button onclick="eliminarUsuarioDefinitivo('${user.id}')" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-destructive/20 text-destructive"><i data-lucide="check" class="w-4 h-4"></i></button>
                <button onclick="cancelarEliminar()" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
        ` : `
            <div class="flex gap-1 justify-end">
                <button onclick="abrirModalUsuario('${user.id}')" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                <button onclick="confirmarEliminar('${user.id}')" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-destructive/20 text-muted hover:text-destructive"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        `;

        const tr = document.createElement("tr");
        tr.className = "hover:bg-secondary/30 transition-colors";
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
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ==========================================
// MODAL & LÓGICA
// ==========================================

window.abrirModalUsuario = function(id = null) {
    const modal = document.getElementById("modal-usuario");
    const form = document.getElementById("form-usuario");
    if (!modal) return;
    
    form.reset();
    document.getElementById("usuario-id").value = id || "";
    
    if (id) {
        const user = window.dbUsuarios.find(u => u.id === id);
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
    renderizarBotonesRoles();
    actualizarToggleUI();
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
        btn.onclick = () => { rolSeleccionado = r; renderizarBotonesRoles(); };
        contenedor.appendChild(btn);
    });
};

window.actualizarToggleUI = function() {
    const toggleBg = document.getElementById("toggle-estado");
    const toggleBola = document.getElementById("toggle-bola");
    const texto = document.getElementById("texto-estado");
    if (!toggleBg) return;

    if (estadoActivo) {
        toggleBg.classList.remove("bg-border"); toggleBg.classList.add("bg-primary");
        toggleBola.classList.add("translate-x-5"); toggleBola.classList.remove("translate-x-0");
        texto.textContent = "Usuario activo";
    } else {
        toggleBg.classList.remove("bg-primary"); toggleBg.classList.add("bg-border");
        toggleBola.classList.remove("translate-x-5"); toggleBola.classList.add("translate-x-0");
        texto.textContent = "Usuario inactivo";
    }
};

window.alternarEstadoUsuario = () => { estadoActivo = !estadoActivo; actualizarToggleUI(); };

window.guardarUsuario = function() {
    const id = document.getElementById("usuario-id").value;
    const nombre = document.getElementById("usuario-nombre").value.trim();
    const correo = document.getElementById("usuario-correo").value.trim();
    if (!nombre || !correo) return alert("Completa los campos obligatorios");

    if (id) {
        const index = window.dbUsuarios.findIndex(u => u.id === id);
        window.dbUsuarios[index] = { id, nombre, correo, rol: rolSeleccionado, activo: estadoActivo };
    } else {
        window.dbUsuarios.push({ id: "u" + Date.now(), nombre, correo, rol: rolSeleccionado, activo: estadoActivo });
    }
    cerrarModalUsuario();
    renderizarUsuarios(document.getElementById("buscador-usuarios")?.value || "");
};

// Acciones de eliminación
window.confirmarEliminar = (id) => { idConfirmarEliminar = id; renderizarUsuarios(document.getElementById("buscador-usuarios")?.value || ""); };
window.cancelarEliminar = () => { idConfirmarEliminar = null; renderizarUsuarios(document.getElementById("buscador-usuarios")?.value || ""); };
window.eliminarUsuarioDefinitivo = (id) => { window.dbUsuarios = window.dbUsuarios.filter(u => u.id !== id); idConfirmarEliminar = null; renderizarUsuarios(document.getElementById("buscador-usuarios")?.value || ""); };

// Inicialización
const buscador = document.getElementById("buscador-usuarios");
if (buscador) buscador.addEventListener("input", (e) => renderizarUsuarios(e.target.value));
renderizarUsuarios();
renderizarMatrizPermisos();
if (typeof lucide !== 'undefined') lucide.createIcons();