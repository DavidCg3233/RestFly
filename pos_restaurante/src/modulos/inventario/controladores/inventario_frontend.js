console.log("📦 Módulo de Inventario cargado.");

const INV_CATEGORIES = ["Carnes", "Mariscos", "Lácteos", "Verduras", "Bebidas", "Básicos"];

// Estado Global
let estadoInv = {
    search: "",
    filterCat: "all",
    items: [
        { id: "i1", name: "Lomo de Res", category: "Carnes", currentStock: 4.5, minStock: 10, unit: "kg", supplier: "Distribuidora Carnes del Valle" },
        { id: "i2", name: "Tomate Chonto", category: "Verduras", currentStock: 18, minStock: 20, unit: "kg", supplier: "AgroFruver" },
        { id: "i3", name: "Queso Mozzarella", category: "Lácteos", currentStock: 15, minStock: 10, unit: "kg", supplier: "Lácteos La Pradera" },
        { id: "i4", name: "Cerveza Artesanal", category: "Bebidas", currentStock: 8, minStock: 24, unit: "und", supplier: "Cervecería Local" },
        { id: "i5", name: "Arroz Blanco", category: "Básicos", currentStock: 50, minStock: 15, unit: "kg", supplier: "Granos El Sol" }
    ]
};

function initInventario() {
    renderFiltrosInv();
    renderOpcionesSelect();
    actualizarVista();
}

function actualizarVista() {
    renderTablaInv();
    renderAlertasInv();
    document.getElementById("inv-count-text").textContent = `${estadoInv.items.length} insumos registrados`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= RENDERIZADO =================

function renderFiltrosInv() {
    const container = document.getElementById("inv-filters-container");
    let html = `<button onclick="setFiltroInv('all')" class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${estadoInv.filterCat === 'all' ? 'bg-primary/20 text-primary border-primary/40' : 'bg-card border-border text-muted hover:border-primary/30'}">Todos</button>`;
    
    INV_CATEGORIES.forEach(cat => {
        const activo = estadoInv.filterCat === cat;
        html += `<button onclick="setFiltroInv('${cat}')" class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activo ? 'bg-primary/20 text-primary border-primary/40' : 'bg-card border-border text-muted hover:border-primary/30'}">${cat}</button>`;
    });
    container.innerHTML = html;
}

function renderOpcionesSelect() {
    const select = document.getElementById("inv-form-category");
    select.innerHTML = INV_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderAlertasInv() {
    const lowStock = estadoInv.items.filter(i => i.currentStock < i.minStock);
    const container = document.getElementById("inv-alert-container");
    
    if (lowStock.length === 0) {
        container.classList.add("hidden");
        return;
    }

    container.classList.remove("hidden");
    const chipsHtml = lowStock.map(i => `
        <span class="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full border border-red-500/30">
            <i data-lucide="trending-down" class="w-3 h-3"></i>
            ${i.name}: ${i.currentStock} ${i.unit} (mín: ${i.minStock})
        </span>
    `).join('');

    container.innerHTML = `
        <div class="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"></i>
            <div>
                <p class="text-red-400 font-bold text-sm tracking-wide">
                    ${lowStock.length} producto${lowStock.length > 1 ? 's' : ''} con stock bajo el mínimo requerido
                </p>
                <div class="flex flex-wrap gap-2 mt-2">${chipsHtml}</div>
            </div>
        </div>
    `;
}

function renderTablaInv() {
    const tbody = document.getElementById("inv-table-body");
    const filtrados = estadoInv.items.filter(i => {
        const matchCat = estadoInv.filterCat === "all" || i.category === estadoInv.filterCat;
        const matchSearch = i.name.toLowerCase().includes(estadoInv.search.toLowerCase()) || i.supplier.toLowerCase().includes(estadoInv.search.toLowerCase());
        return matchCat && matchSearch;
    });

    if(filtrados.length === 0){
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-muted italic">No se encontraron insumos.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrados.map(item => {
        const isBajo = item.currentStock < item.minStock;
        const rowBg = isBajo ? "bg-red-500/5" : "hover:bg-secondary/50 transition-colors";
        const status = calcularEstado(item);
        
        // Barra de progreso
        const pct = Math.min((item.currentStock / (item.minStock * 2)) * 100, 100);

        return `
            <tr class="border-b border-border ${rowBg}">
                <td class="px-4 py-3 font-medium text-foreground">
                    <div class="flex items-center gap-2">
                        <i data-lucide="package" class="w-3.5 h-3.5 text-muted"></i>
                        ${item.name}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-full bg-secondary text-muted border border-border">${item.category}</span>
                </td>
                <td class="px-4 py-3 font-bold ${isBajo ? 'text-red-400' : 'text-foreground'}">
                    ${item.currentStock} ${item.unit}
                </td>
                <td class="px-4 py-3 text-muted">${item.minStock} ${item.unit}</td>
                <td class="px-4 py-3">
                    <div class="w-full h-1.5 rounded-full bg-border overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500 ${status.barColor}" style="width: ${pct}%"></div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${status.bg} ${status.color}">
                        ${status.label}
                    </span>
                </td>
                <td class="px-4 py-3 text-muted text-sm truncate max-w-[150px]">${item.supplier}</td>
                <td class="px-4 py-3 text-right">
                    <button onclick='abrirModalInventario(${JSON.stringify(item)})' class="p-1.5 rounded-md hover:bg-secondary text-muted hover:text-foreground transition-colors">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ================= LÓGICA & HELPERS =================

function calcularEstado(item) {
    const ratio = item.currentStock / item.minStock;
    if (ratio <= 0.5) return { label: "Crítico", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", barColor: "bg-red-500" };
    if (ratio < 1) return { label: "Bajo", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", barColor: "bg-yellow-500" };
    return { label: "OK", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", barColor: "bg-green-500" };
}

window.filtrarInventario = function() {
    estadoInv.search = document.getElementById("inv-search").value;
    renderTablaInv();
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.setFiltroInv = function(cat) {
    estadoInv.filterCat = cat;
    renderFiltrosInv();
    renderTablaInv();
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

// ================= MODAL =================

window.abrirModalInventario = function(item = null) {
    const modal = document.getElementById("inv-modal");
    const content = document.getElementById("inv-modal-content");
    const title = document.getElementById("inv-modal-title");
    const btn = document.getElementById("inv-btn-save");

    if (item) {
        title.textContent = "Editar Insumo";
        btn.textContent = "Guardar cambios";
        document.getElementById("inv-form-id").value = item.id;
        document.getElementById("inv-form-name").value = item.name;
        document.getElementById("inv-form-current").value = item.currentStock;
        document.getElementById("inv-form-min").value = item.minStock;
        document.getElementById("inv-form-unit").value = item.unit;
        document.getElementById("inv-form-category").value = item.category;
        document.getElementById("inv-form-supplier").value = item.supplier;
    } else {
        title.textContent = "Nuevo Insumo";
        btn.textContent = "Agregar insumo";
        document.getElementById("inv-form-id").value = "";
        document.getElementById("inv-form-name").value = "";
        document.getElementById("inv-form-current").value = "0";
        document.getElementById("inv-form-min").value = "1";
        document.getElementById("inv-form-unit").value = "kg";
        document.getElementById("inv-form-category").value = "Básicos";
        document.getElementById("inv-form-supplier").value = "";
    }

    modal.classList.remove("hidden");
    setTimeout(() => content.classList.replace("scale-95", "scale-100"), 10);
};

window.cerrarModalInventario = function() {
    const modal = document.getElementById("inv-modal");
    const content = document.getElementById("inv-modal-content");
    content.classList.replace("scale-100", "scale-95");
    setTimeout(() => modal.classList.add("hidden"), 200);
};

window.guardarInsumo = function() {
    const id = document.getElementById("inv-form-id").value;
    const name = document.getElementById("inv-form-name").value.trim();
    const currentStock = parseFloat(document.getElementById("inv-form-current").value) || 0;
    const minStock = parseFloat(document.getElementById("inv-form-min").value) || 1;
    const unit = document.getElementById("inv-form-unit").value.trim();
    const category = document.getElementById("inv-form-category").value;
    const supplier = document.getElementById("inv-form-supplier").value.trim();

    if (!name || !unit) {
        alert("El nombre y la unidad son obligatorios.");
        return;
    }

    if (id) {
        // Editar
        const index = estadoInv.items.findIndex(i => i.id === id);
        if (index !== -1) {
            estadoInv.items[index] = { id, name, currentStock, minStock, unit, category, supplier };
        }
    } else {
        // Crear
        estadoInv.items.push({
            id: `i-${Date.now()}`, name, currentStock, minStock, unit, category, supplier
        });
    }

    cerrarModalInventario();
    actualizarVista();
};

// Arrancar
initInventario();