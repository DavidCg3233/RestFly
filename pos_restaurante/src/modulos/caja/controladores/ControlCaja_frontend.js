// --- DATA MOCK / ESTADO ---
window.estadoCaja = {
    isOpen: false,
    sesion: null,
    ventas: [
        { id: "v1", metodo: "efectivo", total: 45.50 },
        { id: "v2", metodo: "tarjeta", total: 120.00 },
        { id: "v3", metodo: "efectivo", total: 32.00 },
        { id: "v4", metodo: "transferencia", total: 85.00 }
    ],
    movimientos: [],
    formMovTipo: "entrada",
    efectivoEsperadoCache: 0
};

window.initControlCaja = function() {
    renderMainView();
};

window.renderMainView = function() {
    const vistaCerrada = document.getElementById("caja-cerrada-view");
    const vistaAbierta = document.getElementById("caja-abierta-view");

    if (!vistaCerrada || !vistaAbierta) return;

    if (window.estadoCaja.isOpen) {
        vistaCerrada.classList.add("hidden");
        vistaAbierta.classList.remove("hidden");
        vistaAbierta.classList.add("flex");
        actualizarDatosCaja();
    } else {
        vistaAbierta.classList.add("hidden");
        vistaAbierta.classList.remove("flex");
        vistaCerrada.classList.remove("hidden");
    }

    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.actualizarDatosCaja = function() {
    if (!window.estadoCaja.sesion) return;

    const fechaFormat = window.estadoCaja.sesion.abiertaEn.toLocaleString('es-ES', { 
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' 
    });
    document.getElementById("caja-info-apertura").textContent = `Sesión iniciada: ${fechaFormat}`;

    const totalVentas = window.estadoCaja.ventas.reduce((acc, v) => acc + v.total, 0);
    const totalMovs = window.estadoCaja.movimientos.reduce((acc, m) => {
        return m.tipo === "entrada" ? acc + m.monto : acc - m.monto;
    }, 0);

    const esperado = window.estadoCaja.sesion.montoInicial + totalVentas + totalMovs;
    window.estadoCaja.efectivoEsperadoCache = esperado;

    document.getElementById("stat-inicial").textContent = `$${window.estadoCaja.sesion.montoInicial.toFixed(2)}`;
    document.getElementById("stat-ventas").textContent = `$${totalVentas.toFixed(2)}`;
    
    const movEl = document.getElementById("stat-movimientos");
    movEl.textContent = `$${totalMovs.toFixed(2)}`;
    // Usamos el color de texto normal o peligro según si es negativo
    movEl.className = `text-2xl font-black ${totalMovs >= 0 ? 'text-[var(--tarjeta-texto)]' : 'text-[var(--peligro)]'}`;
    
    document.getElementById("stat-esperado").textContent = `$${esperado.toFixed(2)}`;
    document.getElementById("resumen-total-ventas").textContent = `$${totalVentas.toFixed(2)}`;

    renderListaMovimientos();
    renderResumenMetodos();
};

window.renderListaMovimientos = function() {
    const listContainer = document.getElementById("lista-movimientos");
    document.getElementById("movimientos-count").textContent = `${window.estadoCaja.movimientos.length} movimiento(s)`;

    if (window.estadoCaja.movimientos.length === 0) {
        listContainer.innerHTML = `<p class="text-sm text-[var(--texto-apagado)] text-center py-8">Sin movimientos registrados</p>`;
        return;
    }

    listContainer.innerHTML = window.estadoCaja.movimientos.map(mov => {
        const isEntrada = mov.tipo === "entrada";
        const icon = isEntrada ? 'trending-up' : 'trending-down';
        // Para entradas usamos el primario o texto normal, para salidas el peligro
        const colorClass = isEntrada ? 'text-[#10b981]' : 'text-[var(--peligro)]'; 
        const sign = isEntrada ? '+' : '-';
        const time = mov.fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        return `
            <div class="flex items-center justify-between p-3 rounded-lg bg-[var(--secundario)] border border-[var(--borde)]">
                <div class="flex items-center gap-3 flex-1">
                    <i data-lucide="${icon}" class="w-4 h-4 ${colorClass}"></i>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold truncate text-[var(--tarjeta-texto)]">${mov.desc}</p>
                        <p class="text-xs text-[var(--texto-apagado)] font-medium">${time}</p>
                    </div>
                </div>
                <p class="font-black text-right ${colorClass}">${sign}$${mov.monto.toFixed(2)}</p>
            </div>
        `;
    }).join('');
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.renderResumenMetodos = function() {
    const listContainer = document.getElementById("lista-resumen-ventas");
    const methods = ["efectivo", "tarjeta", "transferencia"];

    listContainer.innerHTML = methods.map(method => {
        const sales = window.estadoCaja.ventas.filter(v => v.metodo === method);
        const total = sales.reduce((acc, v) => acc + v.total, 0);
        const count = sales.length;

        return `
            <div class="flex justify-between items-center text-sm mb-1 p-2 rounded bg-[var(--secundario)]/50 border border-transparent">
                <span class="text-[var(--texto-apagado)] font-medium capitalize flex items-center gap-2">
                    ${method === 'efectivo' ? '<i data-lucide="dollar-sign" class="w-4 h-4"></i>' : 
                      method === 'tarjeta' ? '<i data-lucide="credit-card" class="w-4 h-4"></i>' : 
                      '<i data-lucide="building-2" class="w-4 h-4"></i>'}
                    ${method}
                </span>
                <span class="font-bold text-[var(--tarjeta-texto)]">$${total.toFixed(2)} <span class="text-xs text-[var(--texto-apagado)] font-normal">(${count})</span></span>
            </div>
        `;
    }).join('');
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.abrirModalApertura = () => toggleModal("modal-apertura", true);
window.cerrarModalApertura = () => {
    document.getElementById("apertura-monto").value = "";
    toggleModal("modal-apertura", false);
};
window.procesarApertura = () => {
    const val = parseFloat(document.getElementById("apertura-monto").value);
    if (isNaN(val) || val < 0) return alert("Ingresa un monto válido");

    window.estadoCaja.isOpen = true;
    window.estadoCaja.sesion = {
        id: `ses-${Date.now()}`,
        abiertaEn: new Date(),
        montoInicial: val
    };
    window.estadoCaja.movimientos = []; 
    
    cerrarModalApertura();
    renderMainView();
};

window.abrirModalCierre = () => {
    document.getElementById("cierre-esperado").textContent = `$${window.estadoCaja.efectivoEsperadoCache.toFixed(2)}`;
    document.getElementById("cierre-real").value = "";
    document.getElementById("cierre-diferencia-container").classList.add("hidden");
    toggleModal("modal-cierre", true);
};
window.cerrarModalCierre = () => toggleModal("modal-cierre", false);

window.calcularDiferencia = () => {
    const realInput = document.getElementById("cierre-real").value;
    const container = document.getElementById("cierre-diferencia-container");
    const diffText = document.getElementById("cierre-diferencia");

    if (!realInput) {
        container.classList.add("hidden");
        return;
    }

    const real = parseFloat(realInput) || 0;
    const diff = real - window.estadoCaja.efectivoEsperadoCache;
    
    container.classList.remove("hidden");
    diffText.textContent = `${diff >= 0 ? '+' : ''}$${diff.toFixed(2)}`;
    
    // Adaptación a modo oscuro/claro para la diferencia
    if (diff === 0) {
        container.className = "p-3 rounded-lg border bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]";
    } else if (diff > 0) {
        container.className = "p-3 rounded-lg border bg-[var(--primario)]/10 border-[var(--primario)]/30 text-[var(--primario)]";
    } else {
        container.className = "p-3 rounded-lg border bg-[var(--peligro)]/10 border-[var(--peligro)]/30 text-[var(--peligro)]";
    }
};

window.procesarCierre = () => {
    const real = document.getElementById("cierre-real").value;
    if (real === "") return alert("Ingresa el efectivo contado");

    window.estadoCaja.isOpen = false;
    window.estadoCaja.sesion = null;
    
    cerrarModalCierre();
    renderMainView();
};

window.abrirModalMov = () => {
    seleccionarTipoMov('entrada');
    document.getElementById("mov-monto").value = "";
    document.getElementById("mov-desc").value = "";
    toggleModal("modal-mov", true);
};
window.cerrarModalMov = () => toggleModal("modal-mov", false);

window.seleccionarTipoMov = (tipo) => {
    window.estadoCaja.formMovTipo = tipo;
    const btnEntrada = document.getElementById("btn-mov-entrada");
    const btnSalida = document.getElementById("btn-mov-salida");

    // Clases adaptadas a tus variables CSS
    const claseActiva = "flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all border bg-[var(--primario)] text-[var(--primario-texto)] border-[var(--primario)] shadow-sm";
    const claseInactiva = "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border bg-[var(--secundario)] text-[var(--secundario-texto)] border-[var(--borde)] opacity-70 hover:opacity-100";

    if (tipo === "entrada") {
        btnEntrada.className = claseActiva;
        btnSalida.className = claseInactiva;
    } else {
        btnSalida.className = "flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all border bg-[var(--peligro)] text-white border-[var(--peligro)] shadow-sm";
        btnEntrada.className = claseInactiva;
    }
};

window.procesarMovimiento = () => {
    const monto = parseFloat(document.getElementById("mov-monto").value);
    const desc = document.getElementById("mov-desc").value.trim();

    if (isNaN(monto) || monto <= 0) return alert("Ingresa un monto válido mayor a 0");
    if (!desc) return alert("Agrega una descripción");

    window.estadoCaja.movimientos.unshift({
        id: `mov-${Date.now()}`,
        tipo: window.estadoCaja.formMovTipo,
        monto: monto,
        desc: desc,
        fecha: new Date()
    });

    cerrarModalMov();
    actualizarDatosCaja();
};

window.toggleModal = function(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (show) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    } else {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
};

setTimeout(() => {
    window.initControlCaja();
}, 50);