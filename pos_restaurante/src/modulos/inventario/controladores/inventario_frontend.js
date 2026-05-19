console.log("📦 Módulo de Inventario y Menú cargado.");

const API_BASE = "http://127.0.0.1:8000/api/inventario";
const INV_CATEGORIES = ["Carnes", "Mariscos", "Lácteos", "Verduras", "Bebidas", "Básicos", "Panadería"];

// Estado Global (Nace vacío, se llena con la DB)
let estadoInv = {
    search: "",
    filterCat: "all",
    items: [], 
    platos: [] // Temporalmente vacío hasta que creemos la tabla 'receta' en MySQL
};

// ================= COMUNICACIÓN CON BACKEND (DJANGO) =================

async function cargarInsumosBackend() {
    try {
        const res = await fetch(`${API_BASE}/insumos/`);
        const data = await res.json();
        
        if (data.estado === "exitoso") {
            // Mapeamos los campos de la DB a los campos que espera tu UI
            estadoInv.items = data.data.map(item => ({
                id: item.id_inventario,
                name: item.nombre,
                category: "Básicos", // Hardcodeado por ahora hasta unir la tabla categoría
                currentStock: parseFloat(item.stock_actual),
                minStock: parseFloat(item.stock_minimo),
                unit: item.unidad_medida,
                supplier: "Sin registrar" // Hardcodeado hasta tener tabla proveedores
            }));
        }
    } catch (error) {
        console.error("Error conectando al backend (Insumos):", error);
    }
}

async function guardarInsumoBackend(insumoPayload) {
    try {
        const res = await fetch(`${API_BASE}/insumos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(insumoPayload)
        });
        const data = await res.json();
        
        if (data.estado === "exitoso") {
            // Si guarda en DB, recargamos la lista completa y cerramos modal
            await cargarInsumosBackend();
            actualizarVista();
            cerrarModalInventario();
        } else {
            alert("Error del servidor: " + data.mensaje);
        }
    } catch (error) {
        console.error("Error enviando datos al backend:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

// ================= INICIALIZACIÓN =================

async function initInventario() {
    await cargarInsumosBackend(); // 1. Esperamos a que lleguen los datos de la DB
    renderFiltrosInv();
    renderOpcionesSelect();
    actualizarVista();
    renderTablaPlatos();}

// ================= CONTROLADORES DE UI (Insumos) =================

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

function actualizarVista() {
    renderTablaInv();
    renderAlertasInv();
    document.getElementById("inv-count-text").textContent = `${estadoInv.items.length} insumos en bodega`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function renderFiltrosInv() {
    const container = document.getElementById("inv-filters-container");
    
    // 🔥 EL GUARDRAIL: Si el HTML aún no se ha renderizado en el DOM, frenamos la ejecución
    if (!container) return;
    
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

// 🔥 MODIFICADO PARA ENVIAR AL BACKEND EN LUGAR DE GUARDAR LOCAL
window.guardarInsumo = function() {
    const id = document.getElementById("inv-form-id").value; // TODO: Implementar PUT/Editar en Backend después
    const name = document.getElementById("inv-form-name").value.trim();
    const currentStock = parseFloat(document.getElementById("inv-form-current").value) || 0;
    const minStock = parseFloat(document.getElementById("inv-form-min").value) || 1;
    const unit = document.getElementById("inv-form-unit").value.trim();

    if (!name || !unit) {
        alert("El nombre y la unidad son obligatorios.");
        return;
    }

    // Armamos el JSON según lo que espera el controlador de Django
    const payload = {
        nombre: name,
        stock_actual: currentStock,
        stock_minimo: minStock,
        unidad_medida: unit
    };

    // Llamamos a la API
    guardarInsumoBackend(payload);
};


// ================= LÓGICA DE PLATOS Y RECETAS (Mantenida local por ahora) =================

function renderTablaPlatos() {
    const tbody = document.getElementById('platos-table-body');
    
    if (estadoInv.platos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-muted italic">No hay platos registrados. Crea uno nuevo.</td></tr>`;
        return;
    }

    tbody.innerHTML = estadoInv.platos.map(plato => {
        // Armamos un texto resumen de la receta (ej: "Pan Artesanal, Carne de Res...")
        const resumenReceta = plato.receta.map(ing => ing.nombre).join(', ');
        const recetaTexto = resumenReceta.length > 35 ? resumenReceta.substring(0, 35) + '...' : resumenReceta;

        return `
            <tr class="border-b border-border hover:bg-secondary/50 transition-colors">
                <td class="px-4 py-3 font-medium text-foreground">
                    <div class="flex items-center gap-2">   
                        <i data-lucide="utensils-crossed" class="w-4 h-4 text-muted"></i>
                        ${plato.nombre}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-full bg-secondary text-muted border border-border">${plato.categoria}</span>
                </td>
                <td class="px-4 py-3 font-bold text-foreground">
                    $${plato.precio.toLocaleString()}
                </td>
                <td class="px-4 py-3 text-xs text-muted" title="${resumenReceta}">
                    <span class="font-bold text-foreground">${plato.receta.length} insumos:</span> ${recetaTexto || 'Sin receta'}
                </td>
                <td class="px-4 py-3 text-right">
                    <button onclick='abrirModalPlato(${JSON.stringify(plato)})' class="p-1.5 rounded-md hover:bg-secondary text-muted hover:text-foreground transition-colors" title="Editar Plato">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Renderizamos los íconos nuevos
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

let recetaTemporal = []; 

window.abrirModalPlato = function(plato = null) {
    const modal = document.getElementById("plato-modal");
    const content = document.getElementById("plato-modal-content");
    const title = document.getElementById("plato-modal-title");
    const btn = document.getElementById("plato-btn-save");

    // Llenar select de insumos desde la data real de la BD
    const selectInsumos = document.getElementById("plato-form-insumo");
    selectInsumos.innerHTML = estadoInv.items.map(i => 
        `<option value="${i.id}" data-unidad="${i.unit}" data-nombre="${i.name}">${i.name} (${i.unit})</option>`
    ).join('');

    if (plato) {
        title.textContent = "Editar Plato";
        btn.textContent = "Guardar cambios";
        document.getElementById("plato-form-id").value = plato.id;
        document.getElementById("plato-form-name").value = plato.nombre;
        document.getElementById("plato-form-price").value = plato.precio;
        document.getElementById("plato-form-category").value = plato.categoria;
        recetaTemporal = JSON.parse(JSON.stringify(plato.receta)); 
    } else {
        title.textContent = "Nuevo Plato";
        btn.textContent = "Crear Plato";
        document.getElementById("plato-form-id").value = "";
        document.getElementById("plato-form-name").value = "";
        document.getElementById("plato-form-price").value = "";
        document.getElementById("plato-form-category").value = "Comidas Rápidas";
        recetaTemporal = [];
    }

    renderRecetaTemporal();
    modal.classList.remove("hidden");
    setTimeout(() => content.classList.replace("scale-95", "scale-100"), 10);
};

window.cerrarModalPlato = function() {
    const modal = document.getElementById("plato-modal");
    const content = document.getElementById("plato-modal-content");
    content.classList.replace("scale-100", "scale-95");
    setTimeout(() => modal.classList.add("hidden"), 200);
};

window.agregarInsumoReceta = function() {
    const select = document.getElementById("plato-form-insumo");
    const option = select.options[select.selectedIndex];
    const cantidadInput = document.getElementById("plato-form-cantidad");
    const cantidad = parseFloat(cantidadInput.value);

    if (!option || isNaN(cantidad) || cantidad <= 0) {
        alert("Selecciona un insumo y una cantidad válida mayor a 0.");
        return;
    }

    const idInsumo = option.value;
    
    const existente = recetaTemporal.find(r => r.idInsumo === idInsumo);
    if (existente) {
        existente.cantidad += cantidad;
    } else {
        recetaTemporal.push({
            idInsumo: idInsumo,
            nombre: option.dataset.nombre,
            unidad: option.dataset.unidad,
            cantidad: cantidad
        });
    }

    cantidadInput.value = ""; 
    renderRecetaTemporal();
};

window.quitarInsumoReceta = function(idInsumo) {
    recetaTemporal = recetaTemporal.filter(r => r.idInsumo !== idInsumo);
    renderRecetaTemporal();
};

window.renderRecetaTemporal = function() {
    const container = document.getElementById("plato-receta-lista");
    if (recetaTemporal.length === 0) {
        container.innerHTML = `<p class="text-xs text-muted italic text-center py-2">No has agregado ingredientes.</p>`;
        return;
    }

    container.innerHTML = recetaTemporal.map(ing => `
        <div class="flex justify-between items-center bg-background border border-border px-3 py-2 rounded-md">
            <span class="text-sm font-medium text-foreground">${ing.nombre}</span>
            <div class="flex items-center gap-3">
                <span class="text-xs text-muted font-bold">${ing.cantidad} ${ing.unidad}</span>
                <button onclick="quitarInsumoReceta('${ing.idInsumo}')" class="text-red-400 hover:text-red-500 transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

// TODO: Cuando hagamos el backend de platos, esto enviará un POST
window.guardarPlato = function() {
    const id = document.getElementById("plato-form-id").value;
    const nombre = document.getElementById("plato-form-name").value.trim();
    const precio = parseFloat(document.getElementById("plato-form-price").value) || 0;
    const categoria = document.getElementById("plato-form-category").value.trim();

    if (!nombre || precio <= 0 || recetaTemporal.length === 0) {
        alert("El plato debe tener nombre, precio válido y al menos un ingrediente en su receta.");
        return;
    }

    const nuevoPlato = { id: id || `p-${Date.now()}`, nombre, precio, categoria, receta: [...recetaTemporal] };

    if (id) {
        const index = estadoInv.platos.findIndex(p => p.id === id);
        if (index !== -1) estadoInv.platos[index] = nuevoPlato;
    } else {
        estadoInv.platos.push(nuevoPlato);
    }

    cerrarModalPlato();
    renderTablaPlatos(); 
};

// Arrancar
initInventario();