console.log("📦 Módulo de Inventario y Menú cargado.");

const INV_CATEGORIES = ["Carnes", "Mariscos", "Lácteos", "Verduras", "Bebidas", "Básicos", "Panadería"];

// Estado Global (Insumos y Platos)
let estadoInv = {
    search: "",
    filterCat: "all",
    items: [
        { id: "i1", name: "Carne de Res (Molida)", category: "Carnes", currentStock: 4.5, minStock: 10, unit: "kg", supplier: "Carnes Valle" },
        { id: "i2", name: "Tomate Chonto", category: "Verduras", currentStock: 18, minStock: 20, unit: "kg", supplier: "AgroFruver" },
        { id: "i3", name: "Queso Cheddar", category: "Lácteos", currentStock: 15, minStock: 10, unit: "tajadas", supplier: "Lácteos Pradera" },
        { id: "i4", name: "Pan Artesanal", category: "Panadería", currentStock: 30, minStock: 20, unit: "und", supplier: "Panadería Local" }
    ],
    // 🔥 NUEVO: Ejemplo de cómo se estructura un Plato y su Receta
    platos: [
        {
            id: "p1", 
            nombre: "Hamburguesa Clásica", 
            precio: 18000,
            categoria: "Comidas Rápidas",
            receta: [
                { idInsumo: "i4", cantidad: 1, unidad: "und", nombre: "Pan Artesanal" },
                { idInsumo: "i1", cantidad: 0.2, unidad: "kg", nombre: "Carne de Res (Molida)" },
                { idInsumo: "i3", cantidad: 2, unidad: "tajadas", nombre: "Queso Cheddar" }
            ]
        }
    ]
};

function initInventario() {
    renderFiltrosInv();
    renderOpcionesSelect();
    actualizarVista();
    renderPlatosEjemplo(); // Renderiza la nueva pestaña
}

// ================= NAVEGACIÓN (TABS) =================
window.cambiarTabInv = function(tab) {
    const vistaInsumos = document.getElementById('vista-insumos');
    const vistaPlatos = document.getElementById('vista-platos');
    const btnInsumos = document.getElementById('tab-btn-insumos');
    const btnPlatos = document.getElementById('tab-btn-platos');

    const claseActiva = "flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all bg-card shadow-sm text-foreground border border-border";
    const claseInactiva = "flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all text-muted hover:text-foreground border border-transparent";

    if(tab === 'insumos') {
        vistaInsumos.style.display = 'flex';
        vistaPlatos.style.display = 'none';
        btnInsumos.className = claseActiva;
        btnPlatos.className = claseInactiva;
    } else {
        vistaInsumos.style.display = 'none';
        vistaPlatos.style.display = 'flex';
        btnPlatos.className = claseActiva;
        btnInsumos.className = claseInactiva;
    }
};

// ================= RENDERIZADO INSUMOS (Tu código) =================
function actualizarVista() {
    renderTablaInv();
    renderAlertasInv();
    document.getElementById("inv-count-text").textContent = `${estadoInv.items.length} insumos en bodega`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

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
        <span class="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full border border-red-500/30">
            <i data-lucide="trending-down" class="w-3 h-3"></i> ${i.name}: ${i.currentStock} ${i.unit}
        </span>
    `).join('');

    container.innerHTML = `
        <div class="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"></i>
            <div>
                <p class="text-red-400 font-bold text-sm">Alerta de Stock: ${lowStock.length} insumos por debajo del mínimo</p>
                <div class="flex flex-wrap gap-2 mt-2">${chipsHtml}</div>
            </div>
        </div>
    `;
}

function renderTablaInv() {
    const tbody = document.getElementById("inv-table-body");
    const filtrados = estadoInv.items.filter(i => {
        const matchCat = estadoInv.filterCat === "all" || i.category === estadoInv.filterCat;
        const matchSearch = i.name.toLowerCase().includes(estadoInv.search.toLowerCase());
        return matchCat && matchSearch;
    });

    if(filtrados.length === 0){
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-muted italic">No se encontraron insumos.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrados.map(item => {
        const isBajo = item.currentStock < item.minStock;
        const status = calcularEstado(item);
        const pct = Math.min((item.currentStock / (item.minStock * 2)) * 100, 100);

        return `
            <tr class="border-b border-border hover:bg-secondary/50 transition-colors">
                <td class="px-4 py-3 font-medium text-foreground"><div class="flex items-center gap-2"><i data-lucide="package" class="w-3.5 h-3.5 text-muted"></i>${item.name}</div></td>
                <td class="px-4 py-3"><span class="text-xs px-2 py-1 rounded-full bg-secondary text-muted border border-border">${item.category}</span></td>
                <td class="px-4 py-3 font-bold ${isBajo ? 'text-red-400' : 'text-foreground'}">${item.currentStock} ${item.unit}</td>
                <td class="px-4 py-3 text-muted">${item.minStock} ${item.unit}</td>
                <td class="px-4 py-3"><div class="w-full h-1.5 rounded-full bg-border overflow-hidden"><div class="h-full rounded-full ${status.barColor}" style="width: ${pct}%"></div></div></td>
                <td class="px-4 py-3"><span class="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${status.bg} ${status.color}">${status.label}</span></td>
                <td class="px-4 py-3 text-muted text-sm">${item.supplier}</td>
                <td class="px-4 py-3 text-right"><button onclick='abrirModalInventario(${JSON.stringify(item)})' class="p-1.5 rounded-md hover:bg-secondary text-muted hover:text-foreground"><i data-lucide="pencil" class="w-4 h-4"></i></button></td>
            </tr>
        `;
    }).join('');
}

function calcularEstado(item) {
    const ratio = item.currentStock / item.minStock;
    if (ratio <= 0.5) return { label: "Crítico", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", barColor: "bg-red-500" };
    if (ratio < 1) return { label: "Bajo", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", barColor: "bg-yellow-500" };
    return { label: "OK", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", barColor: "bg-green-500" };
}

// ================= RENDERIZADO PLATOS Y RECETAS =================
function renderPlatosEjemplo() {
    const container = document.getElementById('platos-grid-container');
    
    container.innerHTML = estadoInv.platos.map(plato => {
        // Genera los "chips" de la receta
        const recetaHtml = plato.receta.map(ing => 
            `<span class="inline-flex items-center text-[10px] font-medium bg-secondary text-muted-foreground px-2 py-0.5 rounded border border-border">
                ${ing.cantidad} ${ing.unidad} de ${ing.nombre}
            </span>`
        ).join('');

        return `
        <div class="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col h-full">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <span class="text-[10px] font-bold text-primary uppercase tracking-wider">${plato.categoria}</span>
                    <h3 class="text-lg font-bold text-foreground leading-tight mt-1">${plato.nombre}</h3>
                </div>
                <button class="text-muted hover:text-primary transition-colors"><i data-lucide="more-vertical" class="w-5 h-5"></i></button>
            </div>
            
            <p class="text-2xl font-black text-foreground mb-4">$${plato.precio.toLocaleString()}</p>
            
            <div class="mt-auto border-t border-border pt-3">
                <p class="text-xs font-semibold text-muted mb-2 flex items-center gap-1">
                    <i data-lucide="chef-hat" class="w-3.5 h-3.5"></i> Receta (Descuenta de bodega):
                </p>
                <div class="flex flex-wrap gap-1.5">
                    ${recetaHtml}
                </div>
            </div>
        </div>
        `;
    }).join('');
}


// ================= EVENTOS Y MODALES (Tu código) =================
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
        const index = estadoInv.items.findIndex(i => i.id === id);
        if (index !== -1) estadoInv.items[index] = { id, name, currentStock, minStock, unit, category, supplier };
    } else {
        estadoInv.items.push({ id: `i-${Date.now()}`, name, currentStock, minStock, unit, category, supplier });
    }

    cerrarModalInventario();
    actualizarVista();
};

// Arrancar
initInventario();