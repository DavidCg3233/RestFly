/**
 * Nombre del Archivo: inventario_frontend.js
 * Ruta: src/modulos/inventario/controladores/inventario_frontend.js
 * Descripción: Controlador blindado para la gestión de Insumos y Platos (Menú).
 * Sincroniza dinámicamente con el backend de Django y protege el entorno global.
 */

(function() {
    console.log("📦 Módulo de Inventario y Menú cargado y blindado en archivo independiente.");

    // --- RUTAS API (DJANGO) ---
    var API_BASE = "http://127.0.0.1:8000/api/inventario";
    
    // Categorías para materias primas (Insumos)
    var INV_CATEGORIES = ["Carnes", "Mariscos", "Lácteos", "Verduras", "Bebidas", "Básicos", "Panadería"];
    
    // 🟢 NUEVO: Categorías exclusivas para los Platos Terminados (Menú)
    window.CATEGORIAS_PLATOS = ["Comida", "Bebida", "Postre"];

    // --- ESTADO PROTEGIDO DEL MÓDULO ---
    window.estadoInv = window.estadoInv || {
        search: "",
        filterCat: "all",
        items: [], 
        platos: [] 
    };

    window.recetaTemporal = window.recetaTemporal || [];

    // ==========================================
    // 1. INICIALIZACIÓN Y SINCRONIZACIÓN
    // ==========================================
    async function initInventario() {
        console.log("🔄 Sincronizando inventario y menú con el backend...");
        await cargarInsumosBackend(); 
        await cargarPlatosBackend(); 
        
        renderFiltrosInv();
        renderOpcionesSelect(); // Mapea opciones del form de insumos
        actualizarVista();
        renderTablaPlatos();
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ==========================================
    // 2. COMUNICACIÓN CON EL BACKEND (DJANGO)
    // ==========================================
    async function cargarInsumosBackend() {
        try {
            const res = await fetch(`${API_BASE}/insumos/`);
            const data = await res.json();
            
            if (data.estado === "exitoso") {
                window.estadoInv.items = data.data.map(item => ({
                    id: item.id_inventario,
                    name: item.nombre,
                    category: item.categoria || "Básicos", 
                    currentStock: parseFloat(item.stock_actual),
                    minStock: parseFloat(item.stock_minimo),
                    unit: item.unidad_medida,
                    supplier: item.proveedor || "Sin registrar" 
                }));
            }
        } catch (error) {
            console.error("❌ Error conectando al backend (Insumos):", error);
            window.estadoInv.items = []; 
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
                cerrarModalInventario();
                await initInventario(); 
            } else {
                alert("Error del servidor: " + data.mensaje);
            }
        } catch (error) {
            console.error("❌ Error enviando datos al backend:", error);
            alert("No se pudo conectar con el servidor.");
        }
    }

    async function cargarPlatosBackend() {
        try {
            const res = await fetch(`${API_BASE}/platos/`);
            const data = await res.json();
            
            if (data.estado === "exitoso") {
                window.estadoInv.platos = data.data; 
            }
        } catch (error) {
            console.error("❌ Error conectando al backend (Platos):", error);
            window.estadoInv.platos = [];
        }
    }

    async function guardarPlatoBackend(platoPayload) {
        try {
            const res = await fetch(`${API_BASE}/platos/`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(platoPayload)
            });
            const data = await res.json();
            
            if (data.estado === "exitoso") {
                window.cerrarModalPlato();
                await initInventario(); 
            } else {
                alert("Error del servidor: " + data.mensaje);
            }
        } catch (error) {
            console.error("❌ Error enviando plato al backend:", error);
            alert("No se pudo conectar con el servidor.");
        }
    }

    // ==========================================
    // 3. CONTROLADORES DE RENDERIZADO VISUAL (DOM)
    // ==========================================
    function actualizarVista() {
        renderTablaInv();
        renderAlertasInv();
        
        const countText = document.getElementById("inv-count-text");
        if (countText) {
            countText.textContent = `${window.estadoInv.items.length} insumos en bodega`;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderFiltrosInv() {
        const container = document.getElementById("inv-filters-container");
        if (!container) return; 
        
        let html = `<button onclick="window.setFiltroInv('all')" class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${window.estadoInv.filterCat === 'all' ? 'bg-primary/20 text-primary border-primary/40' : 'bg-card border-border text-muted hover:border-primary/30'}">Todos</button>`;
        
        INV_CATEGORIES.forEach(cat => {
            const activo = window.estadoInv.filterCat === cat;
            html += `<button onclick="window.setFiltroInv('${cat}')" class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activo ? 'bg-primary/20 text-primary border-primary/40' : 'bg-card border-border text-muted hover:border-primary/30'}">${cat}</button>`;
        });
        
        container.innerHTML = html;
    }

    function renderOpcionesSelect() {
        const selectInsumo = document.getElementById("inv-form-category");
        if (selectInsumo) {
            selectInsumo.innerHTML = INV_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
        }
        
        // 🟢 NUEVO: Renderiza el combo box del formulario de Plato con las 3 opciones oficiales
        const selectPlato = document.getElementById("plato-form-category");
        if (selectPlato) {
            selectPlato.innerHTML = window.CATEGORIAS_PLATOS.map(c => `<option value="${c}">${c}</option>`).join('');
        }
    }

    function renderAlertasInv() {
        const lowStock = window.estadoInv.items.filter(i => i.currentStock < i.minStock);
        const container = document.getElementById("inv-alert-container");
        if (!container) return;
        
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
        if (!tbody) return;

        const filtrados = window.estadoInv.items.filter(i => {
            const matchCat = window.estadoInv.filterCat === "all" || i.category === window.estadoInv.filterCat;
            const matchSearch = i.name.toLowerCase().includes(window.estadoInv.search.toLowerCase());
            return matchCat && matchSearch;
        });

        if (filtrados.length === 0) {
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
                    <td class="px-4 py-3 text-right">
                        <div class="flex justify-end gap-2">
                            <button onclick='window.abrirModalInventarioConDatos(${JSON.stringify(item).replace(/'/g, "&apos;")})' class="p-1.5 rounded-md hover:bg-secondary text-muted hover:text-foreground">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                            <button onclick="window.eliminarInsumo(${item.id})" class="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-500">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
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

    function renderTablaPlatos() {
        const tbody = document.getElementById('platos-table-body');
        if (!tbody) return;
        
        if (window.estadoInv.platos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-muted italic">No hay platos registrados. Crea uno nuevo.</td></tr>`;
            return;
        }

        tbody.innerHTML = window.estadoInv.platos.map(plato => {
            const recetaArreglo = Array.isArray(plato.receta) ? plato.receta : [];
            const resumenReceta = recetaArreglo.map(ing => ing.nombre).join(', ');
            const recetaTexto = resumenReceta.length > 35 ? resumenReceta.substring(0, 35) + '...' : resumenReceta;

            let badgeClass = "bg-green-500/10 text-green-400 border-green-500/30";
            let estadoLabel = plato.estado || "Activo";

            if (estadoLabel.toLowerCase() === 'inactivo') {
                badgeClass = "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
            } else if (estadoLabel.toLowerCase() === 'agotado') {
                badgeClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
            }

            return `
                <tr class="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td class="px-4 py-3 font-medium text-foreground"><div class="flex items-center gap-2"><i data-lucide="utensils-crossed" class="w-4 h-4 text-muted"></i>${plato.nombre}</div></td>
                    <td class="px-4 py-3"><span class="text-xs px-2 py-1 rounded-full bg-secondary text-muted border border-border">${plato.categoria}</span></td>
                    <td class="px-4 py-3 font-bold text-foreground">$${plato.precio.toLocaleString()}</td>
                    <td class="px-4 py-3 text-xs text-muted" title="${resumenReceta}"><span class="font-bold text-foreground">${recetaArreglo.length} insumos:</span> ${recetaTexto || 'Sin receta'}</td>
                    
                    <td class="px-4 py-3">
                        <span class="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${badgeClass}">
                            ${estadoLabel.toUpperCase()}
                        </span>
                    </td>

                    <td class="px-4 py-3 text-right">
                        <div class="flex justify-end gap-2">
                            <button onclick='window.abrirModalPlatoConDatos(${JSON.stringify(plato).replace(/'/g, "&apos;")})' class="p-1.5 rounded-md hover:bg-secondary text-muted hover:text-foreground transition-colors" title="Editar Plato">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                            <button onclick="window.eliminarPlato(${plato.id})" class="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-colors" title="Eliminar Plato">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderRecetaTemporal() {
        const container = document.getElementById("plato-receta-lista");
        if (!container) return;

        if (window.recetaTemporal.length === 0) {
            container.innerHTML = `<p class="text-xs text-muted italic text-center py-2">No has agregado ingredientes.</p>`;
            return;
        }

        container.innerHTML = window.recetaTemporal.map(ing => `
            <div class="flex justify-between items-center bg-background border border-border px-3 py-2 rounded-md">
                <span class="text-sm font-medium text-foreground">${ing.nombre}</span>
                <div class="flex items-center gap-3">
                    <span class="text-xs text-muted font-bold">${ing.cantidad} ${ing.unidad}</span>
                    <button onclick="window.quitarInsumoReceta('${ing.idInsumo}')" class="text-red-400 hover:text-red-500 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ==========================================
    // 4. FUNCIONES GLOBALES (Ancladas a Window)
    // ==========================================
    window.cambiarTabInv = function(tab) {
        const vistaInsumos = document.getElementById('vista-insumos');
        const vistaPlatos = document.getElementById('vista-platos');
        const btnInsumos = document.getElementById('tab-btn-insumos');
        const btnPlatos = document.getElementById('tab-btn-platos');

        if (!vistaInsumos || !vistaPlatos) return;

        const claseActiva = "flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all bg-card shadow-sm text-foreground border border-border";
        const claseInactiva = "flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all text-muted hover:text-foreground border border-transparent";

        if (tab === 'insumos') {
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

    // 🔥 NUEVO: Puente de comunicación para el módulo de Caja
    window.forzarSincronizacionInventario = async function() {
        console.log("⚡ Venta detectada. Refrescando el stock en tiempo real...");
        await cargarInsumosBackend(); // Solo recargamos insumos, los platos no cambian por una venta
        actualizarVista();            // Volvemos a pintar las alertas y la tabla
    };

    window.filtrarInventario = function() {
        const searchInput = document.getElementById("inv-search");
        if (searchInput) {
            window.estadoInv.search = searchInput.value;
            renderTablaInv();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };

    window.setFiltroInv = function(cat) {
        window.estadoInv.filterCat = cat;
        renderFiltrosInv();
        renderTablaInv();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.abrirModalInventario = function() {
        const modal = document.getElementById("inv-modal");
        const content = document.getElementById("inv-modal-content");
        const title = document.getElementById("inv-modal-title");
        const btn = document.getElementById("inv-btn-save");

        if (!modal || !content) return;

        title.textContent = "Nuevo Insumo";
        btn.textContent = "Agregar insumo";
        document.getElementById("inv-form-id").value = "";
        document.getElementById("inv-form-name").value = "";
        document.getElementById("inv-form-current").value = "0";
        document.getElementById("inv-form-min").value = "1";
        document.getElementById("inv-form-unit").value = "kg";
        document.getElementById("inv-form-category").value = "Básicos";
        document.getElementById("inv-form-supplier").value = "";

        modal.classList.remove("hidden");
        setTimeout(() => content.classList.replace("scale-95", "scale-100"), 10);
    };

    window.abrirModalInventarioConDatos = function(item) {
        const modal = document.getElementById("inv-modal");
        const content = document.getElementById("inv-modal-content");
        if (!modal || !content) return;

        document.getElementById("inv-modal-title").textContent = "Editar Insumo";
        document.getElementById("inv-btn-save").textContent = "Guardar cambios";
        document.getElementById("inv-form-id").value = item.id;
        document.getElementById("inv-form-name").value = item.name;
        document.getElementById("inv-form-current").value = item.currentStock;
        document.getElementById("inv-form-min").value = item.minStock;
        document.getElementById("inv-form-unit").value = item.unit;
        document.getElementById("inv-form-category").value = item.category;
        document.getElementById("inv-form-supplier").value = item.supplier;

        modal.classList.remove("hidden");
        setTimeout(() => content.classList.replace("scale-95", "scale-100"), 10);
    };

    function cerrarModalInventario() {
        const modal = document.getElementById("inv-modal");
        const content = document.getElementById("inv-modal-content");
        if (!modal || !content) return;
        content.classList.replace("scale-100", "scale-95");
        setTimeout(() => modal.classList.add("hidden"), 200);
    }
    window.cerrarModalInventario = cerrarModalInventario;

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

        const payload = {
            id: id || null,
            nombre: name,
            stock_actual: currentStock,
            stock_minimo: minStock,
            unidad_medida: unit,
            categoria: category,
            proveedor: supplier || "Sin registrar"
        };

        guardarInsumoBackend(payload);
    };

    window.eliminarInsumo = async function(idInsumo) {
        if (!confirm("⚠️ ¿Estás seguro de que deseas eliminar este insumo de la bodega? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/insumos/`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idInsumo })
            });
            const data = await res.json();
            
            if (data.estado === "exitoso") {
                await initInventario(); 
            } else {
                alert("Restricción del sistema: " + data.mensaje);
            }
        } catch (error) {
            console.error("❌ Error eliminando insumo:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };

    window.eliminarPlato = async function(idPlato) {
        if (!confirm("⚠️ ¿Estás seguro de que deseas quitar este plato del menú?")) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/platos/`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idPlato })
            });
            const data = await res.json();
            
            if (data.estado === "exitoso") {
                alert("✅ " + data.mensaje);
                await initInventario(); 
            } else {
                alert("❌ Error al eliminar: " + data.mensaje);
            }
        } catch (error) {
            console.error("❌ Error eliminando plato:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };

    window.abrirModalPlato = function() {
        const modal = document.getElementById("plato-modal");
        const content = document.getElementById("plato-modal-content");
        if (!modal || !content) return;

        const selectInsumos = document.getElementById("plato-form-insumo");
        selectInsumos.innerHTML = window.estadoInv.items.map(i => 
            `<option value="${i.id}" data-unidad="${i.unit}" data-nombre="${i.name}">${i.name} (${i.unit})</option>`
        ).join('');
        
        // 🟢 NUEVO: Nos aseguramos de forzar el mapeo de opciones correctas
        renderOpcionesSelect(); 

        document.getElementById("plato-modal-title").textContent = "Nuevo Plato";
        document.getElementById("plato-btn-save").textContent = "Crear Plato";
        document.getElementById("plato-form-id").value = "";
        document.getElementById("plato-form-name").value = "";
        document.getElementById("plato-form-price").value = "";
        document.getElementById("plato-form-category").value = "Comida"; // 🟢 NUEVO: Default 'Comida'
        
        window.recetaTemporal = [];

        renderRecetaTemporal();
        modal.classList.remove("hidden");
        setTimeout(() => content.classList.replace("scale-95", "scale-100"), 10);
    };

    window.abrirModalPlatoConDatos = function(plato) {
        const modal = document.getElementById("plato-modal");
        const content = document.getElementById("plato-modal-content");
        if (!modal || !content) return;

        const selectInsumos = document.getElementById("plato-form-insumo");
        selectInsumos.innerHTML = window.estadoInv.items.map(i => 
            `<option value="${i.id}" data-unidad="${i.unit}" data-nombre="${i.name}">${i.name} (${i.unit})</option>`
        ).join('');
        
        renderOpcionesSelect();

        document.getElementById("plato-modal-title").textContent = "Editar Plato";
        document.getElementById("plato-btn-save").textContent = "Guardar cambios";
        document.getElementById("plato-form-id").value = plato.id;
        document.getElementById("plato-form-name").value = plato.nombre;
        document.getElementById("plato-form-price").value = plato.precio;
        document.getElementById("plato-form-category").value = plato.categoria;
        
        window.recetaTemporal = JSON.parse(JSON.stringify(plato.receta));

        renderRecetaTemporal();
        modal.classList.remove("hidden");
        setTimeout(() => content.classList.replace("scale-95", "scale-100"), 10);
    };

    window.cerrarModalPlato = function() {
        const modal = document.getElementById("plato-modal");
        const content = document.getElementById("plato-modal-content");
        if (!modal || !content) return;
        content.classList.replace("scale-100", "scale-95");
        setTimeout(() => modal.classList.add("hidden"), 200);
    };

    window.agregarInsumoReceta = function() {
        const select = document.getElementById("plato-form-insumo");
        if (!select) return;
        const option = select.options[select.selectedIndex];
        const cantidadInput = document.getElementById("plato-form-cantidad");
        const cantidad = parseFloat(cantidadInput.value);

        if (!option || isNaN(cantidad) || cantidad <= 0) {
            alert("Selecciona un insumo y una cantidad válida mayor a 0.");
            return;
        }

        const idInsumo = option.value;
        const existente = window.recetaTemporal.find(r => r.idInsumo === idInsumo);
        if (existente) {
            existente.cantidad += cantidad;
        } else {
            window.recetaTemporal.push({
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
        window.recetaTemporal = window.recetaTemporal.filter(r => String(r.idInsumo) !== String(idInsumo));
        renderRecetaTemporal();
    };

    window.guardarPlato = function() {
        const id = document.getElementById("plato-form-id").value;
        const nombre = document.getElementById("plato-form-name").value.trim();
        const precio = parseFloat(document.getElementById("plato-form-price").value) || 0;
        const categoria = document.getElementById("plato-form-category").value.trim();

        if (!nombre || precio <= 0 || window.recetaTemporal.length === 0) {
            alert("El plato debe tener nombre, precio válido y al menos un ingrediente en su receta.");
            return;
        }

        const payload = {
            id: id || null, 
            nombre: nombre,
            precio: precio,
            categoria: categoria,
            receta: [...window.recetaTemporal]
        };

        guardarPlatoBackend(payload);
    };

    // ==========================================
    // 5. VIGILANTE DE NAVEGACIÓN ACTIVO
    // ==========================================
    function vigilarPestañaInventario() {
        const moduloInventario = document.getElementById("app-inventario");
        if (moduloInventario) {
            const esVisible = moduloInventario.offsetParent !== null;
            
            if (esVisible) {
                if (!moduloInventario.dataset.inicializado) {
                    moduloInventario.dataset.inicializado = "true";
                    initInventario(); 
                }
            } else {
                moduloInventario.removeAttribute("data-inicializado");
            }
        }
    }

    if (window.vigilanteInvInterval) {
        clearInterval(window.vigilanteInvInterval);
    }
    window.vigilanteInvInterval = setInterval(vigilarPestañaInventario, 300);

})();