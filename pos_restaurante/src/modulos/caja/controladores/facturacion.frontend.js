console.log("💰 Módulo de Facturación cargado.");

// --- DATA MOCK (Para ver la UI viva) ---
let estadoFacturacion = {
    searchTerm: "",
    selectedOrderId: null,
    selectedPayment: "efectivo",
    taxRate: 0.16, // 16% IVA
    
    // Pedidos con status "entregado" listos para cobrar
    pedidosActivos: [
        { id: "ord-106", tableNumber: "09", waiter: "Juan M.", total: 45.50, items: [
            { name: "Cheesecake Frutos R.", quantity: 1, price: 15.00 },
            { name: "Café Americano", quantity: 2, price: 5.00 },
            { name: "Sándwich de Pollo", quantity: 1, price: 20.50 }
        ]},
        { id: "ord-107", tableNumber: "Terraza 2", waiter: "María P.", total: 120.00, items: [
            { name: "Parrillada Familiar", quantity: 1, price: 90.00 },
            { name: "Cerveza Artesanal", quantity: 4, price: 7.50 }
        ]}
    ],
    
    // Ventas ya concretadas
    historialVentas: [
        { id: "VTA-001", tableNumber: "04", waiter: "Carlos R.", paymentMethod: "tarjeta", total: 85.00, completedAt: new Date(Date.now() - 3600000) },
        { id: "VTA-002", tableNumber: "12", waiter: "María P.", paymentMethod: "efectivo", total: 32.50, completedAt: new Date(Date.now() - 7200000) },
        { id: "VTA-003", tableNumber: "Bar", waiter: "Juan M.", paymentMethod: "transferencia", total: 150.00, completedAt: new Date(Date.now() - 14400000) }
    ]
};

// 1. Inicialización
function initFacturacion() {
    renderPedidosPendientes();
    renderEstadisticas();
    renderHistorialVentas();
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// 2. Renderizar Pedidos Pendientes
function renderPedidosPendientes() {
    const listContainer = document.getElementById("fac-pending-list");
    const countText = document.getElementById("fac-pending-count");
    
    countText.textContent = `${estadoFacturacion.pedidosActivos.length} pedido(s) pendiente(s)`;

    if (estadoFacturacion.pedidosActivos.length === 0) {
        listContainer.innerHTML = `<p class="text-sm text-muted text-center py-8">Sin pedidos pendientes de pago</p>`;
        return;
    }

    listContainer.innerHTML = estadoFacturacion.pedidosActivos.map(order => `
        <button onclick="abrirModalPago('${order.id}')" class="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/50 transition-all text-left group">
            <div class="flex-1">
                <p class="font-bold text-foreground text-base group-hover:text-primary transition-colors">Mesa ${order.tableNumber}</p>
                <p class="text-xs text-muted font-medium mt-0.5">${order.items.length} artículos</p>
            </div>
            <div class="text-right">
                <p class="font-black text-primary text-lg">$${order.total.toFixed(2)}</p>
                <p class="text-xs text-muted mt-0.5 flex items-center justify-end gap-1">
                    <i data-lucide="user" class="w-3 h-3"></i> ${order.waiter}
                </p>
            </div>
        </button>
    `).join('');
}

// 3. Renderizar Estadísticas
function renderEstadisticas() {
    const totalSales = estadoFacturacion.historialVentas.reduce((acc, sale) => acc + sale.total, 0);
    document.getElementById("fac-stats-total").textContent = `$${totalSales.toFixed(2)}`;
    document.getElementById("fac-stats-count").textContent = `${estadoFacturacion.historialVentas.length} transacción(es)`;

    const methods = ["efectivo", "tarjeta", "transferencia"];
    const container = document.getElementById("fac-stats-methods");
    
    container.innerHTML = methods.map(method => {
        const salesOfMethod = estadoFacturacion.historialVentas.filter(s => s.paymentMethod === method);
        const count = salesOfMethod.length;
        const total = salesOfMethod.reduce((acc, s) => acc + s.total, 0);
        
        return `
            <div class="flex justify-between items-center text-sm p-3 rounded-lg bg-secondary/30 border border-border/50">
                <span class="text-muted font-medium capitalize flex items-center gap-2">
                    ${method === 'efectivo' ? '<i data-lucide="dollar-sign" class="w-4 h-4"></i>' : 
                      method === 'tarjeta' ? '<i data-lucide="credit-card" class="w-4 h-4"></i>' : 
                      '<i data-lucide="building-2" class="w-4 h-4"></i>'}
                    ${method}
                </span>
                <div class="text-right">
                    <p class="text-foreground font-bold">$${total.toFixed(2)}</p>
                    <p class="text-xs text-muted">${count} vta(s)</p>
                </div>
            </div>
        `;
    }).join('');
}

// 4. Renderizar Historial de Ventas
function renderHistorialVentas() {
    const tbody = document.getElementById("fac-history-table");
    const term = estadoFacturacion.searchTerm.toLowerCase();
    
    const filtradas = estadoFacturacion.historialVentas.filter(sale => 
        sale.id.toLowerCase().includes(term) || 
        sale.waiter.toLowerCase().includes(term) ||
        sale.tableNumber.toLowerCase().includes(term)
    );

    document.getElementById("fac-history-count").textContent = `${filtradas.length} transacción(es)`;

    if (filtradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-muted italic">Sin ventas registradas</td></tr>`;
        return;
    }

    tbody.innerHTML = filtradas.map(sale => {
        const time = sale.completedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return `
            <tr class="border-b border-border hover:bg-secondary/40 transition-colors">
                <td class="py-3 px-6 font-mono font-medium text-foreground">${sale.id}</td>
                <td class="py-3 px-6 text-foreground font-medium">${sale.tableNumber}</td>
                <td class="py-3 px-6 text-muted">${sale.waiter}</td>
                <td class="py-3 px-6">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary capitalize border border-primary/20">
                        ${sale.paymentMethod}
                    </span>
                </td>
                <td class="py-3 px-6 text-right font-black text-primary">$${sale.total.toFixed(2)}</td>
                <td class="py-3 px-6 text-muted text-xs font-medium">${time}</td>
            </tr>
        `;
    }).join('');
}

// 5. Lógica del Modal (Abrir, Cerrar, Seleccionar Pago)
window.abrirModalPago = function(orderId) {
    const order = estadoFacturacion.pedidosActivos.find(o => o.id === orderId);
    if (!order) return;
    
    estadoFacturacion.selectedOrderId = orderId;
    seleccionarMetodoPago('efectivo'); // Default

    document.getElementById("fac-modal-mesa").textContent = `Mesa ${order.tableNumber}`;
    
    // Calcular totales
    const subtotal = order.total;
    const iva = subtotal * estadoFacturacion.taxRate;
    const totalNeto = subtotal + iva;

    document.getElementById("fac-modal-subtotal").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("fac-modal-iva").textContent = `$${iva.toFixed(2)}`;
    document.getElementById("fac-modal-total").textContent = `$${totalNeto.toFixed(2)}`;

    // Inyectar items
    document.getElementById("fac-modal-items").innerHTML = order.items.map(item => `
        <div class="flex justify-between text-sm">
            <span class="text-muted"><span class="font-bold text-foreground">${item.quantity}x</span> ${item.name}</span>
            <span class="text-foreground font-medium">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    // Mostrar modal con animación
    const modal = document.getElementById("fac-modal");
    const content = document.getElementById("fac-modal-content");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    setTimeout(() => content.classList.replace("scale-95", "scale-100"), 10);
};

window.cerrarModalPago = function() {
    const modal = document.getElementById("fac-modal");
    const content = document.getElementById("fac-modal-content");
    content.classList.replace("scale-100", "scale-95");
    estadoFacturacion.selectedOrderId = null;
    setTimeout(() => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }, 200);
};

window.seleccionarMetodoPago = function(metodo) {
    estadoFacturacion.selectedPayment = metodo;
    const botones = ["efectivo", "tarjeta", "transferencia"];
    
    botones.forEach(m => {
        const btn = document.getElementById(`btn-pay-${m}`);
        if (m === metodo) {
            btn.className = "flex flex-col items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all border bg-primary text-primary-foreground border-primary shadow-sm scale-105";
        } else {
            btn.className = "flex flex-col items-center justify-center py-2 px-3 rounded-lg text-xs font-medium transition-all border bg-secondary text-muted border-border hover:border-primary/50 hover:text-foreground";
        }
    });
};

// 6. Procesar Venta Final
window.procesarPago = function() {
    if (!estadoFacturacion.selectedOrderId) return;

    const orderIndex = estadoFacturacion.pedidosActivos.findIndex(o => o.id === estadoFacturacion.selectedOrderId);
    if (orderIndex === -1) return;

    const order = estadoFacturacion.pedidosActivos[orderIndex];
    const totalConIva = order.total * (1 + estadoFacturacion.taxRate);

    // Mover de Activos a Historial
    const nuevaVenta = {
        id: `VTA-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        tableNumber: order.tableNumber,
        waiter: order.waiter,
        paymentMethod: estadoFacturacion.selectedPayment,
        total: totalConIva,
        completedAt: new Date()
    };

    estadoFacturacion.historialVentas.unshift(nuevaVenta); // Añadir al inicio
    estadoFacturacion.pedidosActivos.splice(orderIndex, 1); // Remover de pendientes

    // Actualizar UI
    cerrarModalPago();
    renderPedidosPendientes();
    renderEstadisticas();
    renderHistorialVentas();
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

// Buscador
window.filtrarHistorial = function() {
    estadoFacturacion.searchTerm = document.getElementById("fac-search").value;
    renderHistorialVentas();
};

// Arrancar Módulo
initFacturacion(); 