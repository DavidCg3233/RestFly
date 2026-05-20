// Validación para persistencia de estado entre cambios de módulo
var STATUS_FLOW = ["pendiente", "preparando", "listo", "entregado"];

var STATUS_CONFIG = {
    pendiente: { label: "Pendiente", bg: "bg-yellow-500/5", border: "border-yellow-500/30", text: "text-yellow-400", headerBg: "bg-yellow-500/10", icon: "circle-dot" },
    preparando: { label: "Preparando", bg: "bg-blue-500/5", border: "border-blue-500/30", text: "text-blue-400", headerBg: "bg-blue-500/10", icon: "loader-2", spin: true },
    listo: { label: "Listo", bg: "bg-green-500/5", border: "border-green-500/30", text: "text-green-400", headerBg: "bg-green-500/10", icon: "check-circle-2" },
    entregado: { label: "Entregado", bg: "bg-muted/20", border: "border-border", text: "text-muted", headerBg: "bg-muted/30", icon: "check-check" }
};

var estadoCocina = window.estadoCocina || {
    view: "all",
    timer: null,
    orders: [
        {
            id: "ord-1", tableNumber: "04", waiter: "Admin", status: "pendiente", createdAt: new Date(Date.now() - 5 * 60000),
            items: [
                { id: 1, name: "Hamb. Premium", quantity: 2, category: "cocina", notes: "Sin cebolla" },
                { id: 2, name: "Coca Cola", quantity: 2, category: "bar", notes: "" }
            ]
        },
        {
            id: "ord-2", tableNumber: "12", waiter: "Admin", status: "preparando", createdAt: new Date(Date.now() - 25 * 60000),
            items: [
                { id: 3, name: "Tacos Al Pastor", quantity: 1, category: "cocina", notes: "Extra picante" }
            ]
        },
        {
            id: "ord-3", tableNumber: "BAR", waiter: "Admin", status: "listo", createdAt: new Date(Date.now() - 10 * 60000),
            items: [
                { id: 4, name: "Gin Tonic", quantity: 3, category: "bar", notes: "Con pepino" }
            ]
        }
    ]
};

// Guardamos en window
window.estadoCocina = estadoCocina;

// 1. Inicialización
window.initCocina = function() {
    // Limpiamos intervalos previos si existen
    if (estadoCocina.timer) clearInterval(estadoCocina.timer);
    
    setTimeout(() => {
        const stats = document.getElementById('stats-container');
        if (stats) {
            renderStats();
            renderFiltros();
            renderKanban();
            
            estadoCocina.timer = setInterval(() => renderKanban(), 60000);
        }
    }, 50);
};

// 2. Renderizar Estadísticas
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

// 3. Renderizar Filtros
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

// 4. Renderizar Kanban
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

// 5. Generar Tarjeta
function generarTarjetaHtml(order, config, status) {
    const currentIdx = STATUS_FLOW.indexOf(status);
    const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
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
    if (currentIdx > 0) botonesHtml += `<button onclick="moverPedido('${order.id}', -1)" class="flex-1 py-1.5 rounded-lg bg-secondary hover:bg-border text-muted text-xs font-medium">← Atrás</button>`;
    if (currentIdx < STATUS_FLOW.length - 1) {
        botonesHtml += `<button onclick="moverPedido('${order.id}', 1)" class="flex-1 py-1.5 rounded-lg text-xs font-semibold ${status === "listo" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}">Avanzar →</button>`;
    }
    botonesHtml += `</div>`;

    return `<div class="rounded-xl border p-4 transition-all hover:shadow-lg ${config.bg} ${config.border}">
        <div class="flex justify-between mb-3">
            <div>
                <div class="flex items-center gap-2"><span class="font-bold">Mesa #${order.tableNumber}</span><span class="w-2 h-2 rounded-full ${config.text.replace('text-', 'bg-')}"></span></div>
                <p class="text-muted text-xs">${order.waiter}</p>
            </div>
            <div class="flex items-center gap-1 text-xs ${timeColor}"><i data-lucide="clock" class="w-3 h-3"></i> <span>${mins}m</span></div>
        </div>
        <div class="flex flex-col gap-1.5 mb-3">${itemsHtml}</div>
        ${botonesHtml}
    </div>`;
}

window.moverPedido = function(orderId, direccion) {
    const order = estadoCocina.orders.find(o => o.id === orderId);
    if (!order) return;
    const newIdx = STATUS_FLOW.indexOf(order.status) + direccion;
    if (newIdx >= 0 && newIdx < STATUS_FLOW.length) {
        order.status = STATUS_FLOW[newIdx];
        renderStats();
        renderKanban();
    }
};

// Arrancamos
initCocina();