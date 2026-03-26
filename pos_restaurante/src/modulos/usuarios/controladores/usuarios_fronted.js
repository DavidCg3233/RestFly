// ==========================================
// ESTADO Y DATOS SIMULADOS (Próximamente BD)
// ==========================================
const ROLES = ["Administrador", "Gerente", "Cajero", "Mesero", "Inventariador"];
const MODULES = ["Dashboard", "Usuarios", "Mesas", "Pedidos", "Cocina", "Inventario", "Reportes"];

const ROLE_PERMISSIONS = {
    Administrador: ["Dashboard", "Usuarios", "Mesas", "Pedidos", "Cocina", "Inventario", "Reportes"],
    Gerente: ["Dashboard", "Mesas", "Pedidos", "Cocina", "Inventario", "Reportes"],
    Cajero: ["Mesas", "Pedidos", "Reportes"],
    Mesero: ["Mesas", "Pedidos"],
    Inventariador: ["Inventario"],
};

const ROLE_COLORS = {
    Administrador: "bg-primary/20 text-primary border-primary/30",
    Gerente: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Cajero: "bg-green-500/20 text-green-400 border-green-500/30",
    Mesero: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Inventariador: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

// Base de datos simulada
let dbUsuarios = [
    { id: "u1", nombre: "Carlos Admin", correo: "carlos@restfly.com", rol: "Administrador", activo: true },
    { id: "u2", nombre: "María Pérez", correo: "maria@restfly.com", rol: "Mesero", activo: true },
    { id: "u3", nombre: "Juan Cajero", correo: "juan@restfly.com", rol: "Cajero", activo: false }
];

// Estado del formulario actual
let rolSeleccionado = "Mesero";
let estadoActivo = true;
let idConfirmarEliminar = null;

// ==========================================
// FUNCIONES DE RENDERIZADO
// ==========================================

function renderizarUsuarios(filtro = "") {
    const tbody = document.getElementById("tabla-usuarios-body");
    const contador = document.getElementById("contador-usuarios");
    tbody.innerHTML = "";

    const filtrados = dbUsuarios.filter(u => 
        u.nombre.toLowerCase().includes(filtro) || 
        u.correo.toLowerCase().includes(filtro) ||
        u.rol.toLowerCase().includes(filtro)
    );

    contador.textContent = `${filtrados.length} usuarios registrados`;

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-muted">No se encontraron usuarios.</td></tr>`;
        return;
    }

    filtrados.forEach(user => {
        const colorRol = ROLE_COLORS[user.rol] || "bg-secondary text-foreground border-border";
        const estadoHTML = user.activo 
            ? `<span class="inline-flex items-center gap-1 text-xs font-medium text-green-500"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Activo</span>`
            : `<span class="inline-flex items-center gap-1 text-xs font-medium text-muted"><span class="w-1.5 h-1.5 rounded-full bg-muted"></span>Inactivo</span>`;

        let accionesHTML = '';
        if (idConfirmarEliminar === user.id) {
            accionesHTML = `
                <div class="flex gap-1 justify-end">
                    <button onclick="eliminarUsuarioDefinitivo('${user.id}')" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-destructive/20 text-destructive transition-colors"><i data-lucide="check" class="w-4 h-4"></i></button>
                    <button onclick="cancelarEliminar()" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted hover:text-foreground transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
                </div>
            `;
        } else {
            accionesHTML = `
                <div class="flex gap-1 justify-end">
                    <button onclick="abrirModalUsuario('${user.id}')" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted hover:text-foreground transition-colors"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button onclick="confirmarEliminar('${user.id}')" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-destructive/20 text-muted hover:text-destructive transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;
        }

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

    lucide.createIcons(); // Recargar iconos de Lucide
}

function renderizarMatrizPermisos() {
    const thead = document.getElementById("matriz-head");
    const tbody = document.getElementById("matriz-body");

    // Cabecera
    let trHead = `<tr class="border-b border-border"><th class="text-left py-2 pr-4 text-muted font-medium">Módulo</th>`;
    ROLES.forEach(r => trHead += `<th class="text-center py-2 px-3 text-muted font-medium text-xs">${r}</th>`);
    trHead += `</tr>`;
    thead.innerHTML = trHead;

    // Filas
    let filas = '';
    MODULES.forEach(mod => {
        let fila = `<tr class="border-b border-border/50 hover:bg-secondary/30 transition-colors"><td class="py-2.5 pr-4 text-foreground font-medium">${mod}</td>`;
        ROLES.forEach(rol => {
            const tienePermiso = ROLE_PERMISSIONS[rol].includes(mod);
            if (tienePermiso) {
                fila += `<td class="text-center py-2.5 px-3"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary"><i data-lucide="check" class="w-3 h-3"></i></span></td>`;
            } else {
                fila += `<td class="text-center py-2.5 px-3"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-border/40 text-muted"><i data-lucide="x" class="w-3 h-3"></i></span></td>`;
            }
        });
        fila += `</tr>`;
        filas += fila;
    });
    tbody.innerHTML = filas;
    lucide.createIcons();
}

// ==========================================
// FUNCIONES DEL MODAL Y FORMULARIO
// ==========================================

function abrirModalUsuario(id = null) {
    const modal = document.getElementById("modal-usuario");
    const titulo = document.getElementById("modal-titulo");
    
    // Resetear formulario
    document.getElementById("form-usuario").reset();
    document.getElementById("usuario-id").value = "";
    
    if (id) {
        // Modo Editar
        const user = dbUsuarios.find(u => u.id === id);
        titulo.textContent = "Editar Usuario";
        document.getElementById("usuario-id").value = user.id;
        document.getElementById("usuario-nombre").value = user.nombre;
        document.getElementById("usuario-correo").value = user.correo;
        rolSeleccionado = user.rol;
        estadoActivo = user.activo;
    } else {
        // Modo Crear
        titulo.textContent = "Nuevo Usuario";
        rolSeleccionado = "Mesero";
        estadoActivo = true;
    }

    renderizarBotonesRoles();
    actualizarToggleUI();
    
    modal.classList.remove("hidden");
}

function cerrarModalUsuario() {
    document.getElementById("modal-usuario").classList.add("hidden");
}

function renderizarBotonesRoles() {
    const contenedor = document.getElementById("contenedor-roles");
    contenedor.innerHTML = "";
    
    ROLES.forEach(r => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = r;
        btn.className = `px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
            rolSeleccionado === r 
            ? "bg-primary/20 text-primary border-primary/50" 
            : "bg-secondary text-muted border-border hover:border-primary/30"
        }`;
        btn.onclick = () => {
            rolSeleccionado = r;
            renderizarBotonesRoles(); // Re-renderizar para actualizar clases
        };
        contenedor.appendChild(btn);
    });
}

function alternarEstadoUsuario() {
    estadoActivo = !estadoActivo;
    actualizarToggleUI();
}

function actualizarToggleUI() {
    const toggleBg = document.getElementById("toggle-estado");
    const toggleBola = document.getElementById("toggle-bola");
    const texto = document.getElementById("texto-estado");

    if (estadoActivo) {
        toggleBg.classList.replace("bg-border", "bg-primary");
        toggleBola.classList.add("translate-x-5");
        toggleBola.classList.remove("translate-x-0");
        texto.textContent = "Usuario activo";
    } else {
        toggleBg.classList.replace("bg-primary", "bg-border");
        toggleBola.classList.remove("translate-x-5");
        toggleBola.classList.add("translate-x-0");
        texto.textContent = "Usuario inactivo";
    }
}

function guardarUsuario() {
    const id = document.getElementById("usuario-id").value;
    const nombre = document.getElementById("usuario-nombre").value.trim();
    const correo = document.getElementById("usuario-correo").value.trim();

    if (!nombre || !correo) return alert("Completa los campos obligatorios");

    if (id) {
        // Editar
        const index = dbUsuarios.findIndex(u => u.id === id);
        dbUsuarios[index] = { id, nombre, correo, rol: rolSeleccionado, activo: estadoActivo };
    } else {
        // Crear
        const nuevoId = "u" + Date.now();
        dbUsuarios.push({ id: nuevoId, nombre, correo, rol: rolSeleccionado, activo: estadoActivo });
    }

    cerrarModalUsuario();
    renderizarUsuarios(document.getElementById("buscador-usuarios").value.toLowerCase());
}

// ==========================================
// FUNCIONES DE ELIMINACIÓN
// ==========================================

function confirmarEliminar(id) {
    idConfirmarEliminar = id;
    renderizarUsuarios(document.getElementById("buscador-usuarios").value.toLowerCase());
}

function cancelarEliminar() {
    idConfirmarEliminar = null;
    renderizarUsuarios(document.getElementById("buscador-usuarios").value.toLowerCase());
}

function eliminarUsuarioDefinitivo(id) {
    dbUsuarios = dbUsuarios.filter(u => u.id !== id);
    idConfirmarEliminar = null;
    renderizarUsuarios(document.getElementById("buscador-usuarios").value.toLowerCase());
}

// ==========================================
// EVENTOS E INICIALIZACIÓN
// ==========================================

// Evento de búsqueda en vivo
document.getElementById("buscador-usuarios").addEventListener("input", (e) => {
    renderizarUsuarios(e.target.value.toLowerCase());
});

// Inicializar al cargar el script
renderizarUsuarios();
renderizarMatrizPermisos();
lucide.createIcons(); // Instanciar iconos iniciales