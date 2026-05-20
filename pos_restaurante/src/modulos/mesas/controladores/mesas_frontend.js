// Validamos si la data ya existe en window para no sobreescribirla al cambiar de módulo.
// Usamos var porque let/const arrojan error de redeclaración cuando el index.html vuelve a inyectar el script.

var ESTADOS = window.ESTADOS || {
    libre: { label: "Libre", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-500", text: "text-emerald-500", icon: "check-circle" },
    ocupada: { label: "Ocupada", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-500", text: "text-rose-500", icon: "user" },
    reservada: { label: "Reservada", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500", text: "text-amber-500", icon: "calendar" },
    limpieza: { label: "Limpieza", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400", text: "text-blue-400", icon: "sparkles" },
};

var mesas = window.mesas || [
    { id: "m1", number: "01", zone: "TERRAZA", capacity: 4, status: "libre", orderId: null },
    { id: "m2", number: "02", zone: "TERRAZA", capacity: 2, status: "ocupada", orderId: "p1" },
    { id: "m3", number: "03", zone: "SALÓN VIP", capacity: 6, status: "reservada", orderId: null },
    { id: "m4", number: "04", zone: "SALÓN VIP", capacity: 4, status: "limpieza", orderId: null },
    { id: "m5", number: "05", zone: "BARRA", capacity: 1, status: "libre", orderId: null },
];

var productos = window.productos || [
    { id: "c1", name: "Hamb. Premium", desc: "Angus 200g, cheddar", price: 14.00, cat: "cocina" },
    { id: "c2", name: "Tacos Al Pastor", desc: "3 unidades + piña", price: 10.50, cat: "cocina" },
    { id: "b1", name: "Coca Cola", desc: "Vidrio 350ml", price: 2.50, cat: "bar" },
    { id: "b2", name: "Gin Tonic", desc: "Tanqueray + frutos rojos", price: 9.00, cat: "bar" },
    { id: "p1", name: "Brownie Helado", desc: "Chocolate 70%", price: 5.50, cat: "postre" },
];

var pedidos = window.pedidos || [
    { id: "p1", mesero: "Carlos R.", total: 24.50, items: [{ prodId: "c1", name: "Hamb. Premium", price: 14.00, qty: 1 }, { prodId: "b2", name: "Gin Tonic", price: 9.00, qty: 1 }] }
];

var state = window.stateMesas || { // Renombramos internamente para que no choque con otros módulos
    filter: "all",
    activeMesaId: null,
    activeOrderId: null,
    activeTab: "cocina"
};

// Guardamos referencias globales para la próxima vez que entres al módulo
window.ESTADOS = ESTADOS;
window.mesas = mesas;
window.productos = productos;
window.pedidos = pedidos;
window.stateMesas = state;

function initMesas() {
    // Un pequeño respiro de 50ms asegura que el index.html haya renderizado los divs
    setTimeout(() => {
        const container = document.getElementById('contenedor-filtros');
        if (container) {
            renderFiltros();
            renderMesas();
        }
    }, 50);
}

function renderFiltros() {
    const container = document.getElementById('contenedor-filtros');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(ESTADOS).forEach(key => {
        const config = ESTADOS[key];
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
}

window.setFilter = function(key) {
    state.filter = state.filter === key ? 'all' : key;
    renderFiltros();
    renderMesas();
};

function renderMesas() {
    const container = document.getElementById('contenedor-zonas');
    if (!container) return;
    container.innerHTML = '';

    const filtered = state.filter === 'all' ? mesas : mesas.filter(m => m.status === state.filter);
    const zones = [...new Set(mesas.map(m => m.zone))];

    zones.forEach(zone => {
        const zoneMesas = filtered.filter(m => m.zone === zone);
        if (zoneMesas.length === 0) return;

        const zoneHtml = zoneMesas.map(mesa => {
            const conf = ESTADOS[mesa.status];
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
}

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

function renderBotonesEstado() {
    const mesa = mesas.find(m => m.id === state.activeMesaId);
    const container = document.getElementById('modal-botones-estado');
    container.innerHTML = '';

    Object.keys(ESTADOS).forEach(key => {
        const isActive = mesa.status === key;
        const conf = ESTADOS[key];
        container.innerHTML += `
            <button onclick="cambiarEstadoMesa('${key}')" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${isActive ? 'bg-background shadow-sm ' + conf.text : 'text-muted hover:text-foreground'}">
                ${conf.label}
            </button>
        `;
    });
}

window.cambiarEstadoMesa = function(nuevoEstado) {
    const mesa = mesas.find(m => m.id === state.activeMesaId);
    mesa.status = nuevoEstado;
    if (nuevoEstado === 'libre') mesa.orderId = null;
    renderBotonesEstado();
    renderMesas();
    renderFiltros();
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

function renderPedido() {
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
}

window.confirmarPedido = function() {
    const pedido = pedidos.find(p => p.id === state.activeOrderId);
    if (!pedido || pedido.items.length === 0) return alert("El pedido está vacío");
    
    alert(`Comanda enviada!\nOrden: ${state.activeOrderId}\nTotal: $${pedido.total.toFixed(2)}`);
    cerrarModalPedido();
};

// Arrancamos la app
initMesas();