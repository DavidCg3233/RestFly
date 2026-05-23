// Validación para persistencia de estado entre cambios de módulo
var STATUS_FLOW = ["pendiente", "preparando", "listo", "entregado"];

var STATUS_CONFIG = {
    pendiente: { label: "Pendiente", bg: "bg-yellow-500/5", border: "border-yellow-500/30", text: "text-yellow-400", headerBg: "bg-yellow-500/10", icon: "circle-dot" },
    preparando: { label: "Preparando", bg: "bg-blue-500/5", border: "border-blue-500/30", text: "text-blue-400", headerBg: "bg-blue-500/10", icon: "loader-2", spin: true },
    listo: { label: "Listo", bg: "bg-green-500/5", border: "border-green-500/30", text: "text-green-400", headerBg: "bg-green-500/10", icon: "check-circle-2" },
    entregado: { label: "Entregado", bg: "bg-muted/20", border: "border-border", text: "text-muted", headerBg: "bg-muted/30", icon: "check-check" }
};

// OJO: Ajusta esta URL a la ruta real de tu API de pedidos/cocina en Django
window.API_BASE_URL_COCINA = 'http://127.0.0.1:8000/api/cocina';
var estadoCocina = window.estadoCocina || {
    view: "all",
    timer: null,
    orders: [] // Arranca vacío, lo llenaremos con la base de datos
};

// Guardamos en window
window.estadoCocina = estadoCocina;

// ==========================================
// 1. CARGA INICIAL Y POLLING
// ==========================================
window.cargarPedidosCocina = async function() {
    try {
        const response = await fetch(`${window.API_BASE_URL_COCINA}/pedidos/`);
        const result = await response.json();

        if (result.estado === 'exitoso') {
            estadoCocina.orders = result.data || [];
            
            const stats = document.getElementById('stats-container');
            if (stats) {
                renderStats();
                renderFiltros();
                renderKanban();
            }
        } else {
            console.error("❌ Error del servidor al cargar cocina:", result.mensaje);
        }
    } catch (error) {
        console.error("❌ Error de conexión al cargar BD cocina:", error);
    }
};

window.initCocina = function() {
    // Limpiamos intervalos previos si existen
    if (estadoCocina.timer) clearInterval(estadoCocina.timer);
    
    // Carga inicial inmediata
    cargarPedidosCocina();
    
    // Refresco automático cada 60 segundos
    estadoCocina.timer = setInterval(() => cargarPedidosCocina(), 60000);
};

// ==========================================
// 2. RENDERIZADO DE INTERFAZ
// ==========================================
function renderStats() {
    const container = document.getElementById('stats-container');
    if (!container) return;
    
    const pendingCount = estadoCocina.orders.filter(o => o.status === "pendiente").length;
    const preparingCount = estadoCocina.orders.filter(o => o.status === "preparando").length;

    let html = '';
    if (pendingCount > 0) {
        html += `<div class="flex items-center gap-1.5 text-yellow-400 text-sm font-medium"><i data-lucide="circle-dot" class="w-4 h-4"></i><span>${pendingCount} pendientes</span></div>`;
    }
    if (preparingCount > 0) {
        html += `<div class="flex items-center gap-1.5 text-blue-400 text-sm font-medium"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>${preparingCount} en preparación</span></div>`;
    }
    container.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function renderFiltros() {
    const container = document.getElementById('filtros-container');
    if (!container) return;
    const v = estadoCocina.view;

    container.innerHTML = `
        <button onclick="setFiltroCocina('all')" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${v === 'all' ? 'bg-primary/20 text-primary border-primary/40' : 'bg-card border-border text-muted hover:border-primary/30'}">Todas</button>
        <button onclick="setFiltroCocina('cocina')" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${v === 'cocina' ? 'bg-primary/20 text-primary border-primary/40' : 'bg-card border-border text-muted hover:border-primary/30'}">
            <i data-lucide="chef-hat" class="w-4 h-4"></i> Cocina
        </button>
        <button onclick="setFiltroCocina('bar')" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${v === 'bar' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-card border-border text-muted hover:border-primary/30'}">
            <i data-lucide="wine" class="w-4 h-4"></i> Bar
        </button>
    `;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

window.setFiltroCocina = function(vista) {
    estadoCocina.view = vista;
    renderFiltros();
    renderKanban();
};

function renderKanban() {
    const container = document.getElementById('kanban-container');
    if (!container) return;
    
    const visibleOrders = estadoCocina.orders.filter(o => {
        if (estadoCocina.view === "cocina") return o.items.some(i => i.category === "cocina");
        if (estadoCocina.view === "bar") return o.items.some(i => i.category === "bar");
        return true;
    });

    let kanbanHtml = '';
    STATUS_FLOW.forEach(status => {
        const config = STATUS_CONFIG[status];
        const colOrders = visibleOrders.filter(o => o.status === status);
        
        kanbanHtml += `
            <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between px-4 py-2.5 rounded-xl ${config.headerBg} border ${config.border}">
                    <div class="flex items-center gap-2">
                        <i data-lucide="${config.icon}" class="w-4 h-4 ${config.text} ${config.spin ? 'animate-spin' : ''}"></i>
                        <span class="font-semibold text-sm ${config.text}">${config.label}</span>
                    </div>
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-background/50 ${config.text}">${colOrders.length}</span>
                </div>
                <div class="flex flex-col gap-3">
                    ${colOrders.length === 0 ? `<div class="rounded-xl border border-dashed border-border p-6 text-center text-muted text-sm">Sin pedidos</div>` : colOrders.map(o => generarTarjetaHtml(o, config, status)).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = kanbanHtml;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function generarTarjetaHtml(order, config, status) {
    const currentIdx = STATUS_FLOW.indexOf(status);
    
    // Asume que order.createdAt viene del backend en un formato parseable (ej. ISO 8601)
    const orderDate = new Date(order.createdAt);
    // Prevención de error si la fecha es inválida
    const msDiff = isNaN(orderDate.getTime()) ? 0 : (Date.now() - orderDate.getTime());
    const mins = Math.floor(msDiff / 60000);
    
    const timeColor = mins > 20 && status !== "entregado" ? "text-destructive" : "text-muted";

    const itemsHtml = order.items.map(item => {
        const dotColor = item.category === "cocina" ? "bg-primary" : "bg-blue-400";
        const isMuted = (estadoCocina.view === "cocina" && item.category !== "cocina") || 
                        (estadoCocina.view === "bar" && item.category !== "bar");
        return `<div class="flex items-center gap-2 ${isMuted ? "opacity-30 line-through" : ""}">
            <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
            <span class="text-foreground text-sm"><span class="font-semibold">${item.quantity}x</span> ${item.name}</span>
            ${item.notes ? `<span class="text-xs text-muted italic ml-auto">(${item.notes})</span>` : ''}
        </div>`;
    }).join('');

    let botonesHtml = `<div class="flex items-center gap-2 pt-2 border-t border-border/50">`;
    if (currentIdx > 0) botonesHtml += `<button onclick="moverPedido('${order.id}', -1)" class="flex-1 py-1.5 rounded-lg bg-secondary hover:bg-border text-muted text-xs font-medium transition-colors">← Atrás</button>`;
    if (currentIdx < STATUS_FLOW.length - 1) {
        botonesHtml += `<button onclick="moverPedido('${order.id}', 1)" class="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:brightness-110 ${status === "listo" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}">Avanzar →</button>`;
    }
    botonesHtml += `</div>`;

    return `<div class="rounded-xl border p-4 transition-all hover:shadow-lg ${config.bg} ${config.border}">
        <div class="flex justify-between mb-3">
            <div>
                <div class="flex items-center gap-2"><span class="font-bold">Mesa #${order.tableNumber || 'N/A'}</span><span class="w-2 h-2 rounded-full ${config.text.replace('text-', 'bg-')}"></span></div>
                <p class="text-muted text-xs">${order.waiter || 'Sistema'}</p>
            </div>
            <div class="flex items-center gap-1 text-xs ${timeColor}"><i data-lucide="clock" class="w-3 h-3"></i> <span>${mins}m</span></div>
        </div>
        <div class="flex flex-col gap-1.5 mb-3">${itemsHtml}</div>
        ${botonesHtml}
    </div>`;
}

// ==========================================
// 3. ACTUALIZACIÓN HACIA EL BACKEND
// ==========================================
window.moverPedido = async function(orderId, direccion) {
    const order = estadoCocina.orders.find(o => String(o.id) === String(orderId));
    if (!order) return;
    
    const newIdx = STATUS_FLOW.indexOf(order.status) + direccion;
    
    if (newIdx >= 0 && newIdx < STATUS_FLOW.length) {
        const nuevoEstado = STATUS_FLOW[newIdx];
        
        try {
            // Actualización optimista en la interfaz para que se sienta rápido
            order.status = nuevoEstado;
            renderStats();
            renderKanban();

            // Petición al backend
            const response = await fetch(`${window.API_BASE_URL_COCINA}/avanzar/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id_pedido: order.id, 
                    estado: nuevoEstado 
                })
            });
            
            const result = await response.json();
            
            if (result.estado !== 'exitoso') {
                // Si falla en backend, revertimos el cambio visual y avisamos
                alert("No se pudo actualizar el estado: " + result.mensaje);
                cargarPedidosCocina(); // Recarga la verdad desde BD
            }
        } catch (error) {
            console.error("Error de conexión al mover pedido:", error);
            alert("Error de conexión con el servidor.");
            cargarPedidosCocina(); // Recarga para asegurar consistencia
        }
    }
};

// Arrancamos
initCocina();