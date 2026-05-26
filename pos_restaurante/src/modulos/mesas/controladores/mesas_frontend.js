// C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\mesas\controladores\mesas_frontend.js

// 1. Estados visuales
window.ESTADOS = window.ESTADOS || {
    libre: { label: "Libre", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-500", text: "text-emerald-500", icon: "check-circle" },
    ocupada: { label: "Ocupada", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-500", text: "text-rose-500", icon: "user" },
    reservada: { label: "Reservada", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500", text: "text-amber-500", icon: "calendar" },
    limpieza: { label: "Limpieza", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400", text: "text-blue-400", icon: "sparkles" },
};

// OJO: Verifica si tu URL realmente termina en /api/mesas/api o si es solo /api/mesas
window.API_BASE_URL_MESAS = 'http://127.0.0.1:8000/api/mesas/api';

// Memoria global
var mesas = [];
var productos = [];
var pedidos = [];

var state = window.stateMesas || { 
    filter: "all",
    activeMesaId: null,
    activeOrderId: null,
    activeTab: "Comida" // 🟢 Cambio principal: Inicializar en Comida
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
            mesas = result.data.mesas || [];
            productos = result.data.productos || [];
            pedidos = result.data.pedidos || [];
            console.log("🔥 DATOS DESDE DB:", { mesas, productos, pedidos });
            
            renderFiltros();
            renderMesas();
        } else {
            console.error("❌ Error del servidor:", result.mensaje);
        }
    } catch (error) {
        console.error("❌ Error de conexión al cargar BD:", error);
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_mesa: mesaActivaId,
                estado: nuevoEstado
            })
        });

        const result = await response.json();

        if (result.estado === 'exitoso') {
            // Refrescamos todo desde la base de datos para asegurar sincronía perfecta
            window.initMesas();
            // Cerramos el modal si se liberó la mesa
            if (nuevoEstado === 'libre') {
                cerrarModalPedido();
            } else {
                renderBotonesEstado();
            }
        } else {
            alert("No se pudo cambiar el estado: " + result.mensaje);
        }
    } catch (error) {
        console.error("Error de red al cambiar estado:", error);
        alert("Error de conexión con el servidor.");
    }
};

window.eliminarMesa = function(idMesa, event) {
    if (event) event.stopPropagation();

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? 'oklch(0.12 0 0)' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';

    Swal.fire({
        title: undefined,
        icon: undefined,
        buttonsStyling: false,
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: bgColor,
        color: textColor,
        html: `
            <div class="flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold mb-2">Eliminar Mesa</h2>
                <p class="text-sm mb-6 opacity-70">Esta acción no se puede deshacer y borrará la mesa permanentemente del mapa.</p>
            </div>
        `,
        customClass: {
            backdrop: 'bg-background/80 backdrop-blur-sm',
            popup: 'p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm border-2 border-orange-500',
            actions: 'flex gap-3 w-full justify-center mt-0',
            confirmButton: 'px-6 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors shadow-sm w-full',
            cancelButton: 'px-6 py-2.5 bg-secondary font-bold rounded-lg border border-border hover:brightness-95 transition-colors shadow-sm w-full'
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${window.API_BASE_URL_MESAS}/eliminar/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_mesa: idMesa })
                });

                const data = await response.json();

                if (data.estado === 'exitoso') {
                    Swal.fire({
                        background: bgColor, color: textColor, buttonsStyling: false,
                        html: `
                            <div class="flex flex-col items-center text-center">
                                <div class="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                </div>
                                <h2 class="text-2xl font-bold mb-2">¡Eliminada!</h2>
                                <p class="text-sm mb-6 opacity-70">La mesa ha sido borrada del mapa correctamente.</p>
                            </div>
                        `,
                        customClass: {
                            backdrop: 'bg-background/80 backdrop-blur-sm',
                            popup: 'p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm border-2 border-green-500',
                            confirmButton: 'px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg hover:brightness-110 transition-colors shadow-sm w-full'
                        }
                    });
                    window.initMesas();
                } else {
                    Swal.fire({ title: 'Error', text: data.mensaje, icon: 'error', background: bgColor, color: textColor });
                }
            } catch (error) {
                console.error("Error al eliminar la mesa:", error);
                Swal.fire({ title: 'Error de conexión', text: 'No se pudo contactar con el servidor.', icon: 'error', background: bgColor, color: textColor });
            }
        }
    });
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

    const usuarioString = localStorage.getItem("usuario_sesion");
    const usuario = usuarioString ? JSON.parse(usuarioString) : null;
    const esAdmin = usuario && usuario.rol_sistema === "ADMINISTRADOR";

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
                    
                    ${esAdmin ? `
                        <button 
                            onclick="window.eliminarMesa('${mesa.id}', event)" 
                            class="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-2 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20 w-9 h-9"
                            title="Eliminar Mesa"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                        </button>
                    ` : ''}

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
                    ${pedido ? `<div class="mt-4 pt-3 border-t border-border/20 font-mono font-bold text-primary text-sm">$${parseFloat(pedido.total).toFixed(2)}</div>` : ''}
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
    
    // Si la mesa está libre, armamos un carrito temporal sin afectar el estado real de la BD aún.
    if (mesa.status === 'libre') {
        const tempId = 'TEMP-' + mesa.id;
        if (!pedidos.find(p => p.id === tempId)) {
            pedidos.push({ id: tempId, total: 0, items: [] });
        }
        state.activeOrderId = tempId;
    } else {
        // Usamos el ID del pedido real traído de Django
        state.activeOrderId = mesa.orderId;
    }

    document.getElementById('modal-titulo-mesa').innerText = `Mesa #${mesa.number} — ${mesa.zone}`;
    document.getElementById('modal-subtitulo-pedido').innerText = (mesa.status === 'libre') ? 'NUEVO PEDIDO' : `PEDIDO BD: #${state.activeOrderId}`;
    
    renderBotonesEstado();
    cambiarTab(state.activeTab); // Dispara la re-renderización de los platos en la pestaña activa
    renderPedido();
    
    document.getElementById('modal-pedido').classList.remove('hidden');
};

window.cerrarModalPedido = function() {
    document.getElementById('modal-pedido').classList.add('hidden');
    state.activeMesaId = null;
    state.activeOrderId = null;
    
    // Limpiar carritos temporales si se cierra sin guardar
    pedidos = pedidos.filter(p => !String(p.id).startsWith('TEMP-'));
    renderMesas();
};

window.renderBotonesEstado = function() {
    const mesa = mesas.find(m => m.id === state.activeMesaId);
    if (!mesa) return;
    
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
    
    // 1. Quitar los estilos activos de todas las pestañas
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'bg-background', 'shadow-sm', 'text-foreground');
        b.classList.add('text-muted');
    });
    
    // 2. Colocar los estilos activos en la pestaña que se presionó (Comida, Bebida o Postre)
    const activeBtn = document.getElementById(`tab-${cat}`);
    if(activeBtn) {
        activeBtn.classList.add('active', 'bg-background', 'shadow-sm', 'text-foreground');
        activeBtn.classList.remove('text-muted');
    }

    const container = document.getElementById('contenedor-menu');
    
    // 🟢 NUEVO: Filtrado directo de las 3 categorías. Maneja mayúsculas/minúsculas por si acaso
    const items = productos.filter(p => {
        const pCat = (p.cat || p.categoria || "").toLowerCase();
        return pCat === cat.toLowerCase();
    });

    const order = pedidos.find(p => p.id === state.activeOrderId);

    container.innerHTML = items.map(p => {
        const inOrder = order?.items.find(i => i.prodId === p.id);
        const qty = inOrder ? inOrder.qty : 0;
        
        // Validación del estado del plato sincronizado con el inventario
        const isAgotado = p.estado === 'agotado'; 

        return `
            <div class="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors ${isAgotado ? 'opacity-60 bg-secondary/30' : ''}">
                <div class="min-w-0 pr-2 flex-1">
                    <div class="flex items-center gap-2 mb-0.5">
                        <h4 class="text-sm font-bold truncate text-foreground">${p.name}</h4>
                        ${isAgotado ? `<span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/30 uppercase tracking-wide">Agotado</span>` : ''}
                    </div>
                    <p class="text-[10px] text-muted-foreground truncate max-w-[180px] sm:max-w-none">${p.desc || 'Sin descripción'}</p>
                    <span class="text-sm font-black text-primary">$${parseFloat(p.price).toFixed(2)}</span>
                </div>
                
                <div class="flex items-center gap-2 bg-background/80 dark:bg-secondary p-1 rounded-lg border border-border/40 shrink-0">
                    ${isAgotado ? `
                        <div class="w-7 h-7 flex items-center justify-center text-muted-foreground/40" title="Insumos insuficientes">
                            <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                        </div>
                    ` : `
                        ${qty > 0 ? `
                            <button onclick="updateQty('${p.id}', -1)" class="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center bg-card rounded-md text-muted hover:text-destructive active:scale-90 transition-all"><i data-lucide="minus" class="w-3.5 h-3.5"></i></button>
                            <span class="text-xs font-bold w-5 text-center text-foreground">${qty}</span>
                        ` : ''}
                        <button onclick="updateQty('${p.id}', 1)" class="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center bg-primary text-primary-foreground rounded-md hover:brightness-110 active:scale-90 transition-all"><i data-lucide="plus" class="w-3.5 h-3.5"></i></button>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    // Si no hay productos en la categoría, mostramos un mensaje vacío amigable
    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-muted opacity-50">
                <i data-lucide="utensils-crossedges" class="w-10 h-10 mb-2"></i>
                <p class="text-sm font-medium">No hay platos en la categoría ${cat}</p>
            </div>
        `;
    }

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
        // Diccionario de colores visuales para los estados independientes
        const badgeColores = {
            'pendiente': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
            'en_preparacion': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            'listo': 'bg-green-500/10 text-green-500 border-green-500/20',
            'entregado': 'bg-transparent text-muted border-transparent opacity-50'
        };

        container.innerHTML = pedido.items.map(i => {
            // Si es un ítem nuevo (aún no enviado), por defecto es pendiente.
            // Si viene de la BD, lee i.status y i.category
            const estadoItem = i.status || 'pendiente'; 
            const areaItem = i.category || 'Cocina'; 
            
            const colores = badgeColores[estadoItem] || badgeColores['pendiente'];
            const tachado = estadoItem === 'entregado' ? 'line-through' : '';

            return `
                <div class="flex items-center justify-between p-3 bg-background border border-border rounded-xl mb-2">
                    <div class="flex-1 pr-2">
                        <div class="flex items-center gap-2 mb-1">
                            <p class="text-xs font-bold ${tachado}">${i.name}</p>
                            <span class="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                ${areaItem}
                            </span>
                        </div>
                        <p class="text-[10px] text-primary font-mono">$${(i.price * i.qty).toFixed(2)}</p>
                    </div>
                    
                    <div class="flex flex-col items-end gap-1.5">
                        <span class="text-[8px] uppercase font-black px-2 py-0.5 rounded border ${colores}">
                            ${estadoItem.replace('_', ' ')}
                        </span>
                        <span class="text-[10px] font-black bg-secondary px-2 py-1 rounded">x${i.qty}</span>
                    </div>
                </div>
            `;
        }).join('');
        totalEl.innerText = `$${parseFloat(pedido.total).toFixed(2)}`;
    }
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.confirmarPedido = async function(event) {
    if (event) event.preventDefault(); // Evitamos recargas raras del HTML

    // 1. Buscamos el pedido actual de la mesa activa
    const pedidoActual = pedidos.find(p => p.id === state.activeOrderId);
    
    if (!pedidoActual || pedidoActual.items.length === 0) {
        return alert("⚠️ No puedes enviar una comanda vacía. Agrega productos primero.");
    }

    // 2. Extraemos el usuario en sesión (para saber qué mesero tomó el pedido)
    const usuarioString = localStorage.getItem("usuario_sesion");
    const usuario = usuarioString ? JSON.parse(usuarioString) : { id_usuario: 1 }; // Default a 1 por si acaso

    // 3. Armamos los datos exactos que espera tu `enviar_comanda` en Python
    const payload = {
        id_mesa: state.activeMesaId,
        id_usuario: usuario.id_usuario,
        items: pedidoActual.items
    };

    try {
        // 4. Enviamos silenciosamente a Django
        const response = await fetch(`${window.API_BASE_URL_MESAS}/enviar-comanda/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.estado === 'exitoso') {
            Swal.fire({
                title: '¡Comanda Enviada!',
                text: 'El pedido ha sido enviado a cocina/bar exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            
            // Recargamos el estado global para que desaparezca el "TEMP-" y tome el ID real de la base de datos
            window.initMesas();
            window.cerrarModalPedido();
        } else {
            alert("❌ Error al guardar el pedido: " + result.mensaje);
        }

    } catch (error) {
        console.error("Error al enviar la comanda:", error);
        alert("⚠️ Hubo un problema de conexión al guardar el pedido.");
    }
};

// ==========================================
// 4. CREACIÓN DE MESAS Y VALIDACIÓN DE ROL
// ==========================================

window.validarRolYNombre = function() {
    const usuarioString = localStorage.getItem("usuario_sesion");

    if (usuarioString) {
        const usuario = JSON.parse(usuarioString);

        const spanNombre = document.getElementById("nombre-mesero");
        if (spanNombre) {
            spanNombre.innerText = usuario.nombre_completo;
        }

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
            window.initMesas(); 
        } else {
            alert("Error al crear: " + result.mensaje);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión al crear la mesa.");
    }
};

window.validarRolYNombre();
window.initMesas();