// C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\mesas\controladores\mesas_frontend.js

// 1. Estados visuales
window.ESTADOS = window.ESTADOS || {
    libre: { label: "Libre", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-500", text: "text-emerald-500", icon: "check-circle" },
    ocupada: { label: "Ocupada", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-500", text: "text-rose-500", icon: "user" },
    reservada: { label: "Reservada", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500", text: "text-amber-500", icon: "calendar" },
    limpieza: { label: "Limpieza", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400", text: "text-blue-400", icon: "sparkles" },
};

// OJO: Verifica si tu URL realmente termina en /api/mesas/api o si es solo /api/mesas
// Configuración limpia y estándar
window.API_BASE_URL_MESAS = 'http://127.0.0.1:8000/api/mesas';
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
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
        
        // 🚫 Ocultamos el botón "Libre" normal si la mesa está ocupada
        if (mesa.status === 'ocupada' && key === 'libre') return;

        container.innerHTML += `
            <button onclick="cambiarEstadoMesa('${key}')" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${isActive ? 'bg-background shadow-sm ' + conf.text : 'text-muted hover:text-foreground'}">
                ${conf.label}
            </button>
        `;
    });

    // 🔥 EL BOTÓN ROJO DE CANCELAR PEDIDO
    if (mesa.status === 'ocupada') {
        container.innerHTML += `
            <button onclick="window.anularPedidoMesa()" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 ml-2 flex items-center gap-1 animate-pulse">
                <i data-lucide="ban" class="w-3 h-3"></i> Cancelar Pedido
            </button>
        `;
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
};


window.anularPedidoMesa = function() {
    const mesa = mesas.find(m => m.id === state.activeMesaId);
    if (!mesa || mesa.status !== 'ocupada') return;

    const idPedidoReal = state.activeOrderId;
    // Evitamos tocar mesas sin pedido en BD
    if (!idPedidoReal || String(idPedidoReal).startsWith('TEMP-')) {
        Swal.fire({ title: 'Atención', text: 'No hay un pedido real en base de datos para anular.', icon: 'warning' });
        return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? 'oklch(0.12 0 0)' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';

    Swal.fire({
        title: undefined,
        icon: undefined,
        buttonsStyling: false,
        showCancelButton: true,
        confirmButtonText: 'Sí, anular y liberar',
        cancelButtonText: 'Regresar',
        background: bgColor,
        color: textColor,
        html: `
            <div class="flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold mb-2">¿Anular Pedido?</h2>
                <p class="text-sm mb-6 opacity-70">Esta acción cancelará el pedido abierto (#${idPedidoReal}) y liberará la Mesa #${mesa.number} inmediatamente.</p>
            </div>
        `,
        customClass: {
            backdrop: 'bg-background/80 backdrop-blur-sm',
            popup: 'p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm border-2 border-red-500',
            actions: 'flex gap-3 w-full justify-center mt-0',
            confirmButton: 'px-6 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors shadow-sm w-full',
            cancelButton: 'px-6 py-2.5 bg-secondary font-bold rounded-lg border border-border hover:brightness-95 transition-colors shadow-sm w-full'
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${window.API_BASE_URL_MESAS}/anular-pedido/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_mesa: state.activeMesaId,
                        id_pedido: idPedidoReal
                    })
                });

                const data = await response.json();

                if (data.estado === 'exitoso') {
                    Swal.fire({
                        background: bgColor, color: textColor, buttonsStyling: false,
                        timer: 1500, showConfirmButton: false,
                        html: `
                            <div class="flex flex-col items-center text-center">
                                <div class="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                </div>
                                <h2 class="text-2xl font-bold mb-1">¡Anulado con éxito!</h2>
                                <p class="text-sm opacity-70">La mesa ya está libre.</p>
                            </div>
                        `,
                        customClass: { backdrop: 'bg-background/80 backdrop-blur-sm', popup: 'p-8 rounded-2xl shadow-xl max-w-sm border-2 border-green-500' }
                    });

                    window.cerrarModalPedido();
                    window.initMesas(); // Recarga mapa de mesas de la BD
                } else {
                    Swal.fire({ title: 'Error', text: data.mensaje, icon: 'error', background: bgColor, color: textColor });
                }
            } catch (error) {
                console.error("❌ Error en red al anular:", error);
                Swal.fire({ title: 'Error de conexión', text: 'No se pudo procesar la anulación.', icon: 'error', background: bgColor, color: textColor });
            }
        }
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
    const order = pedidos.find(p => p.id === state.activeOrderId);
    
    // Si no hay pedido o está vacío
    if (!order || order.items.length === 0) {
        container.innerHTML = `<p class="text-center text-muted text-sm mt-10">No hay productos en el pedido.</p>`;
        document.getElementById('pedido-total').innerText = '$0.00';
        return;
    }

    // 1. Calcular el total exacto basado en los items actuales
    // (Por si acaso 'order.total' no está actualizado)
    const totalCalculado = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    order.total = totalCalculado; // Mantenemos el objeto global actualizado

    // 2. Renderizar los items
    container.innerHTML = order.items.map((item, index) => {
        const notaActual = item.notas || ''; 
        
        return `
            <div class="bg-background border border-border p-3 rounded-xl">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-sm">${item.qty}x</span>
                        <span class="text-sm text-foreground">${item.name}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-mono font-bold">$${(item.price * item.qty).toFixed(2)}</span>
                        
                        <button onclick="window.toggleNota('${item.prodId}')" class="text-muted hover:text-primary transition-colors">
                            <i data-lucide="message-square-plus" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                <div id="nota-container-${item.prodId}" class="mt-3 transition-all duration-200" style="display: ${notaActual ? 'block' : 'none'};">
                    <div class="flex items-center bg-secondary rounded-lg border border-border px-2">
                        <i data-lucide="pencil" class="w-3 h-3 text-muted"></i>
                        <input 
                            type="text" 
                            value="${notaActual}" 
                            placeholder="Ej: Sin cebolla, bien cocido..." 
                            class="w-full bg-transparent border-none text-xs p-2 text-foreground focus:outline-none focus:ring-0"
                            onchange="window.guardarNota('${item.prodId}', this.value)"
                        />
                    </div>
                </div>
                
                </div>
        `;
    }).join('');

    const spanTotal = document.getElementById('pedido-total');
    if (spanTotal) {
        spanTotal.innerText = `$${totalCalculado.toFixed(2)}`;
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

// ==========================================
// 📝 LÓGICA DE NOTAS EN EL PEDIDO
// ==========================================

window.toggleNota = function(prodId) {
    const contenedor = document.getElementById(`nota-container-${prodId}`);
    if (contenedor) {
        if (contenedor.style.display === 'none') {
            contenedor.style.display = 'block';
            // Enfocar automáticamente el input para escribir rápido
            const input = contenedor.querySelector('input');
            if(input) input.focus();
        } else {
            contenedor.style.display = 'none';
        }
    }
};

window.guardarNota = function(prodId, textoNota) {
    // 1. Buscamos el pedido actual
    const order = pedidos.find(p => p.id === state.activeOrderId);
    if (!order) return;

    // 2. Buscamos el ítem específico dentro de ese pedido
    const item = order.items.find(i => i.prodId === prodId);
    if (item) {
        // 3. Le asignamos la nota al objeto en memoria
        item.notas = textoNota;
        console.log(`✅ Nota guardada para ${item.name}: ${textoNota}`);
    }
};

window.abrirModalNuevaMesa = function() {
    document.getElementById('modal-crear-mesa').classList.remove('hidden');
    
    // Captura de los inputs numéricos originales
    const inputNumero = document.getElementById('nueva-mesa-numero');
    const inputCapacidad = document.getElementById('nueva-mesa-capacidad');
    
    inputNumero.value = '';
    inputCapacidad.value = '';
    document.getElementById('nueva-mesa-zona').value = '';

    // 🛡️ CAPA 1: Limitar el comportamiento del spinner nativo del HTML
    inputNumero.setAttribute('min', '1');
    inputCapacidad.setAttribute('min', '1');

    // 🛡️ CAPA 2: Bloquear los caracteres "-", "+", "e" y "E" directamente desde el teclado
    const interceptarTeclasInvalidas = function(e) {
        if (['-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };
    inputNumero.onkeydown = interceptarTeclasInvalidas;
    inputCapacidad.onkeydown = interceptarTeclasInvalidas;

    // 🛡️ CAPA 3: Control preventivo por si intentan arrastrar o pegar texto negativo
    inputNumero.oninput = function() {
        if (this.value !== '' && parseInt(this.value, 10) < 1) {
            this.value = '';
        }
    };
    inputCapacidad.oninput = function() {
        if (this.value !== '' && parseInt(this.value, 10) < 1) {
            this.value = '';
        }
    };
};

window.cerrarModalNuevaMesa = function() {
    document.getElementById('modal-crear-mesa').classList.add('hidden');
};

window.guardarNuevaMesa = async function() {
    const numero = document.getElementById('nueva-mesa-numero').value;
    const capacidad = document.getElementById('nueva-mesa-capacidad').value;
    const zona = document.getElementById('nueva-mesa-zona').value;

    if (!numero || !capacidad || !zona) return alert("Completa todos los campos");

    // 🛡️ CAPA 4: Validación final estricta en JS antes de enviar el Fetch
    if (parseInt(numero, 10) < 1 || parseInt(capacidad, 10) < 1) {
        return alert("❌ El número de mesa y la capacidad deben ser superiores a cero.");
    }

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