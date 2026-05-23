// C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\mesas\controladores\mesas_frontend.js

// 1. Evitamos el error de "has already been declared" usando window o var
window.ESTADOS = window.ESTADOS || {
    libre: { label: "Libre", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-500", text: "text-emerald-500", icon: "check-circle" },
    ocupada: { label: "Ocupada", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-500", text: "text-rose-500", icon: "user" },
    reservada: { label: "Reservada", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500", text: "text-amber-500", icon: "calendar" },
    limpieza: { label: "Limpieza", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400", text: "text-blue-400", icon: "sparkles" },
};

window.API_BASE_URL_MESAS = 'http://127.0.0.1:8000/api/mesas/api';

// Vaciamos la memoria global (usamos var para evitar errores de redeclaración)
var mesas = [];
var productos = [];
var pedidos = [];

var state = window.stateMesas || { 
    filter: "all",
    activeMesaId: null,
    activeOrderId: null,
    activeTab: "cocina"
};
window.stateMesas = state;

// ==========================================
// 1. CARGA INICIAL DESDE EL BACKEND
// ==========================================
window.initMesas = async function() {
    try {
        const response = await fetch(`${window.API_BASE_URL_MESAS}/estado-inicial/`);
        const result = await response.json();

        if (result.estado === 'exitoso') {
            mesas = result.data.mesas;
            productos = result.data.productos;
            pedidos = result.data.pedidos;
            console.log("MESAS DEL BACKEND:", mesas);
            renderFiltros();
            renderMesas();
        } else {
            console.error("Error del servidor:", result.mensaje);
        }
    } catch (error) {
        console.error("Error de conexión al cargar mesas:", error);
    }
};

// ==========================================
// 2. ACTUALIZACIÓN DE ESTADO HACIA EL BACKEND
// ==========================================
window.cambiarEstadoMesa = async function(nuevoEstado) {
    const mesaActivaId = state.activeMesaId;

    try {
        const response = await fetch(`${window.API_BASE_URL_MESAS}/estado-mesa/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_mesa: mesaActivaId,
                estado: nuevoEstado
            })
        });

        const result = await response.json();

        if (result.estado === 'exitoso') {
            const mesa = mesas.find(m => m.id === mesaActivaId);
            mesa.status = nuevoEstado;
            if (nuevoEstado === 'libre') mesa.orderId = null;
            
            renderBotonesEstado();
            renderMesas();
            renderFiltros();
        } else {
            alert("No se pudo cambiar el estado: " + result.mensaje);
        }
    } catch (error) {
        console.error("Error de red al cambiar estado:", error);
        alert("Error de conexión con el servidor.");
    }
};

// ==========================================
// 3. RENDERIZADO Y LÓGICA DE INTERFAZ
// ==========================================

window.renderFiltros = function() {
    const container = document.getElementById('contenedor-filtros');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(window.ESTADOS).forEach(key => {
        const config = window.ESTADOS[key];
        const count = mesas.filter(m => m.status === key).length;
        const isActive = state.filter === key;

        container.innerHTML += `
            <button onclick="setFilter('${key}')" class="flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? config.bg + ' ' + config.border : 'bg-card border-border hover:bg-secondary'}">
                <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full ${config.dot} shadow-[0_0_8px] shadow-current"></span>
                    <span class="font-bold text-sm ${isActive ? config.text : 'text-foreground'}">${config.label}</span>
                </div>
                <span class="text-xs font-mono opacity-60">${count}</span>
            </button>
        `;
    });
};

window.setFilter = function(key) {
    state.filter = state.filter === key ? 'all' : key;
    renderFiltros();
    renderMesas();
};

window.renderMesas = function() {
    const container = document.getElementById('contenedor-zonas');
    if (!container) return;
    container.innerHTML = '';

    const filtered = state.filter === 'all' ? mesas : mesas.filter(m => m.status === state.filter);
    const zones = [...new Set(mesas.map(m => m.zone))];

    zones.forEach(zone => {
        const zoneMesas = filtered.filter(m => m.zone === zone);
        if (zoneMesas.length === 0) return;

        const zoneHtml = zoneMesas.map(mesa => {
            const conf = window.ESTADOS[mesa.status];
            const pedido = pedidos.find(p => p.id === mesa.orderId);
            
            return `
                <div onclick="abrirMesa('${mesa.id}')" class="group relative cursor-pointer p-5 rounded-2xl border-2 transition-all hover:shadow-xl active:scale-95 ${conf.bg} ${conf.border}">
                    <div class="flex justify-between items-start mb-4">
                        <span class="text-2xl font-black text-foreground">#${mesa.number}</span>
                        <div class="p-1.5 rounded-lg bg-background/50 border border-border">
                             <i data-lucide="${conf.icon}" class="w-4 h-4 ${conf.text}"></i>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div class="flex items-center gap-2 text-[10px] font-bold text-muted uppercase">
                            <i data-lucide="users" class="w-3 h-3"></i> ${mesa.capacity} PAX
                        </div>
                        <div class="text-xs font-bold ${conf.text} uppercase tracking-tighter">${conf.label}</div>
                    </div>
                    ${pedido ? `<div class="mt-4 pt-3 border-t border-border/20 font-mono font-bold text-primary text-sm">$${pedido.total.toFixed(2)}</div>` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML += `
            <div class="animate-in slide-in-from-bottom-2 duration-500">
                <h3 class="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                    <span class="w-8 h-[1px] bg-border"></span> ${zone}
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">${zoneHtml}</div>
            </div>
        `;
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.abrirMesa = function(id) {
    const mesa = mesas.find(m => m.id === id);
    state.activeMesaId = id;
    
    if (mesa.status === 'libre') {
        const newId = 'P-' + Math.floor(1000 + Math.random() * 9000);
        pedidos.push({ id: newId, mesero: "Admin", total: 0, items: [] });
        mesa.status = 'ocupada';
        mesa.orderId = newId;
        state.activeOrderId = newId;
    } else {
        state.activeOrderId = mesa.orderId;
    }

    document.getElementById('modal-titulo-mesa').innerText = `Mesa #${mesa.number} — ${mesa.zone}`;
    document.getElementById('modal-subtitulo-pedido').innerText = state.activeOrderId ? `PEDIDO: ${state.activeOrderId}` : 'SIN PEDIDO';
    
    renderBotonesEstado();
    cambiarTab(state.activeTab);
    renderPedido();
    
    document.getElementById('modal-pedido').classList.remove('hidden');
    renderMesas();
    renderFiltros();
};

window.cerrarModalPedido = function() {
    document.getElementById('modal-pedido').classList.add('hidden');
    state.activeMesaId = null;
};

window.renderBotonesEstado = function() {
    const mesa = mesas.find(m => m.id === state.activeMesaId);
    const container = document.getElementById('modal-botones-estado');
    container.innerHTML = '';

    Object.keys(window.ESTADOS).forEach(key => {
        const isActive = mesa.status === key;
        const conf = window.ESTADOS[key];
        container.innerHTML += `
            <button onclick="cambiarEstadoMesa('${key}')" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${isActive ? 'bg-background shadow-sm ' + conf.text : 'text-muted hover:text-foreground'}">
                ${conf.label}
            </button>
        `;
    });
};

window.cambiarTab = function(cat) {
    state.activeTab = cat;
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'bg-background', 'shadow-sm', 'text-foreground');
        b.classList.add('text-muted');
    });
    const activeBtn = document.getElementById(`tab-${cat}`);
    if(activeBtn) {
        activeBtn.classList.add('active', 'bg-background', 'shadow-sm', 'text-foreground');
        activeBtn.classList.remove('text-muted');
    }

    const container = document.getElementById('contenedor-menu');
    const items = productos.filter(p => p.cat === cat);
    const order = pedidos.find(p => p.id === state.activeOrderId);

    container.innerHTML = items.map(p => {
        const inOrder = order?.items.find(i => i.prodId === p.id);
        const qty = inOrder ? inOrder.qty : 0;
        
        return `
            <div class="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors">
                <div class="min-w-0 pr-2">
                    <h4 class="text-sm font-bold truncate">${p.name}</h4>
                    <p class="text-[10px] text-muted truncate">${p.desc}</p>
                    <span class="text-sm font-black text-primary">$${p.price.toFixed(2)}</span>
                </div>
                <div class="flex items-center gap-2 bg-secondary p-1 rounded-lg">
                    ${qty > 0 ? `
                        <button onclick="updateQty('${p.id}', -1)" class="w-7 h-7 flex items-center justify-center bg-background rounded-md text-muted hover:text-destructive transition-colors"><i data-lucide="minus" class="w-3.5 h-3.5"></i></button>
                        <span class="text-xs font-bold w-4 text-center">${qty}</span>
                    ` : ''}
                    <button onclick="updateQty('${p.id}', 1)" class="w-7 h-7 flex items-center justify-center bg-primary text-primary-foreground rounded-md hover:brightness-110 transition-all"><i data-lucide="plus" class="w-3.5 h-3.5"></i></button>
                </div>
            </div>
        `;
    }).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.updateQty = function(prodId, delta) {
    const pedido = pedidos.find(p => p.id === state.activeOrderId);
    if (!pedido) return;

    let item = pedido.items.find(i => i.prodId === prodId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) pedido.items = pedido.items.filter(i => i.prodId !== prodId);
    } else if (delta > 0) {
        const p = productos.find(prod => prod.id === prodId);
        pedido.items.push({ prodId: p.id, name: p.name, price: p.price, qty: 1 });
    }

    pedido.total = pedido.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    renderPedido();
    cambiarTab(state.activeTab);
    renderMesas();
};

window.renderPedido = function() {
    const container = document.getElementById('contenedor-pedido-items');
    const totalEl = document.getElementById('pedido-total');
    const pedido = pedidos.find(p => p.id === state.activeOrderId);

    if (!pedido || pedido.items.length === 0) {
        container.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center text-muted opacity-20 py-20">
                <i data-lucide="shopping-bag" class="w-12 h-12 mb-2"></i>
                <span class="text-xs font-black uppercase">Vacío</span>
            </div>
        `;
        totalEl.innerText = "$0.00";
    } else {
        container.innerHTML = pedido.items.map(i => `
            <div class="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                <div>
                    <p class="text-xs font-bold">${i.name}</p>
                    <p class="text-[10px] text-primary font-mono">$${(i.price * i.qty).toFixed(2)}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black bg-secondary px-2 py-1 rounded">x${i.qty}</span>
                </div>
            </div>
        `).join('');
        totalEl.innerText = `$${pedido.total.toFixed(2)}`;
    }
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.confirmarPedido = async function() {
    const pedido = pedidos.find(p => p.id === state.activeOrderId);
    if (!pedido || pedido.items.length === 0) return alert("El pedido está vacío");
    
    // Sacamos el ID del mesero que tomó la orden
    const usuarioString = localStorage.getItem("usuario_sesion");
    const usuario = usuarioString ? JSON.parse(usuarioString) : null;
    const id_usuario = usuario ? usuario.id_usuario : 1; // Por defecto el 1 (Admin) si falla

    const payload = {
        id_mesa: state.activeMesaId,
        id_usuario: id_usuario,
        items: pedido.items
    };

    try {
        const response = await fetch(`${window.API_BASE_URL_MESAS}/enviar-comanda/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.estado === 'exitoso') {
            alert(`¡Comanda enviada a cocina!\nTotal: $${pedido.total.toFixed(2)}`);
            cerrarModalPedido();
            window.initMesas(); // Recargamos para ver la mesa roja (Ocupada)
        } else {
            alert("Error al enviar la comanda: " + result.mensaje);
        }
    } catch (error) {
        console.error("Error al enviar pedido:", error);
        alert("Error de conexión al enviar la comanda.");
    }
};

// ==========================================
// 4. CREACIÓN DE MESAS Y VALIDACIÓN DE ROL
// ==========================================

window.validarRolYNombre = function() {
    // 1. Leemos la variable que guardaste en el login
    const usuarioString = localStorage.getItem("usuario_sesion");

    if (usuarioString) {
        const usuario = JSON.parse(usuarioString);

        // 2. Actualizamos el nombre en la interfaz
        const spanNombre = document.getElementById("nombre-mesero");
        if (spanNombre) {
            spanNombre.innerText = usuario.nombre_completo;
        }

        // 3. Validamos si el rol es el definido en tu BD para mostrar el botón
        if (usuario.rol_sistema === "ADMINISTRADOR") {
            const btnCrearMesa = document.getElementById("btn-crear-mesa");
            if (btnCrearMesa) {
                btnCrearMesa.classList.remove("hidden");
            }
        }
    } else {
        console.warn("No hay usuario en sesión.");
    }
};

window.abrirModalNuevaMesa = function() {
    document.getElementById('modal-crear-mesa').classList.remove('hidden');
    // Limpiar inputs
    document.getElementById('nueva-mesa-numero').value = '';
    document.getElementById('nueva-mesa-capacidad').value = '';
    document.getElementById('nueva-mesa-zona').value = '';
};

window.cerrarModalNuevaMesa = function() {
    document.getElementById('modal-crear-mesa').classList.add('hidden');
};

window.guardarNuevaMesa = async function() {
    const numero = document.getElementById('nueva-mesa-numero').value;
    const capacidad = document.getElementById('nueva-mesa-capacidad').value;
    const zona = document.getElementById('nueva-mesa-zona').value;

    if (!numero || !capacidad || !zona) return alert("Completa todos los campos");

    try {
        const response = await fetch(`${window.API_BASE_URL_MESAS}/crear/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero, capacidad, zona, estado: 'libre' })
        });

        const result = await response.json();

        if (result.estado === 'exitoso') {
            window.cerrarModalNuevaMesa();
            // Recargamos todo para que traiga la nueva mesa desde el backend
            window.initMesas(); 
        } else {
            alert("Error al crear: " + result.mensaje);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión al crear la mesa.");
    }
};

// Se ejecuta la validación de rol apenas cargue el script
window.validarRolYNombre();

// Se ejecuta inmediatamente cuando el archivo js es inyectado por base.html
window.initMesas();