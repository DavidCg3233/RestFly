// =========================================================
// CONFIGURACIÓN GLOBAL - BLINDADA CONTRA RE-INYECCIÓN
// =========================================================
if (typeof window.URL_API_REPORTES === 'undefined') {
    window.URL_API_REPORTES = 'http://localhost:8000/api/reportes';
}

window.miGraficaReportes = null;
window.tabActual = 'ventas';

// =========================================================
// 1. CONEXIÓN AL BACKEND (FETCH)
// =========================================================
async function obtenerVentasDesdeBackend(inicio = '', fin = '') {
    try {
        let url = `${window.URL_API_REPORTES}/ventas-diarias/`;
        if (inicio && fin) url += `?inicio=${inicio}&fin=${fin}`;
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const json = await respuesta.json();
        return json.estado === 'exitoso' ? json.data : null;
    } catch (error) {
        console.error("🔥 Error al traer ventas:", error);
        return null;
    }
}

async function obtenerProductosTopDesdeBackend(limite = 10) {
    try {
        const respuesta = await fetch(`${window.URL_API_REPORTES}/productos-top/?limite=${limite}`);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const json = await respuesta.json();
        return json.estado === 'exitoso' ? json.data : [];
    } catch (error) {
        console.error("🔥 Error al traer productos top:", error);
        return [];
    }
}

async function obtenerInventarioDesdeBackend() {
    try {
        const respuesta = await fetch(`${window.URL_API_REPORTES}/inventario-estado/`);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const json = await respuesta.json();
        return json.estado === 'exitoso' ? json.data : [];
    } catch (error) {
        console.error("🔥 Error al traer inventario:", error);
        return [];
    }
}

async function obtenerGastosDesdeBackend(inicio = '', fin = '') {
    try {
        let url = `${window.URL_API_REPORTES}/gastos/`;
        if (inicio && fin) url += `?inicio=${inicio}&fin=${fin}`;
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const json = await respuesta.json();
        return json.estado === 'exitoso' ? json.data : [];
    } catch (error) {
        console.error("🔥 Error al traer gastos:", error);
        return [];
    }
}

// =========================================================
// 2. LÓGICA DE INICIALIZACIÓN Y VISTAS
// =========================================================
window.iniciarReportesRestFly = function() {
    const contenedor = document.getElementById('modulo-reportes-contenedor');
    if (!contenedor) {
        setTimeout(() => window.iniciarReportesRestFly(), 200);
        return;
    }

    if(typeof lucide !== 'undefined') lucide.createIcons();

    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);
    
    const inputInicio = document.getElementById('filtro-fecha-inicio');
    const inputFin = document.getElementById('filtro-fecha-fin');

    if (inputInicio && inputFin) {
        inputInicio.value = haceUnMes.toISOString().split('T')[0];
        inputFin.value = hoy.toISOString().split('T')[0];

        inputInicio.removeEventListener('change', window.actualizarDatosReportes);
        inputFin.removeEventListener('change', window.actualizarDatosReportes);
        inputInicio.addEventListener('change', window.actualizarDatosReportes);
        inputFin.addEventListener('change', window.actualizarDatosReportes);
    }
    
    // 🔥 SOLUCIÓN BUG 1: Forzamos el click virtual en "ventas" para que cargue la UI completa
    window.cambiarTabReportes('ventas');
};

window.cambiarTabReportes = function(tabName) {
    window.tabActual = tabName;
    const tabs = ['ventas', 'inventario', 'productos', 'gastos'];
    
    const claseInactiva = "py-2.5 rounded-lg text-sm font-bold transition-all bg-[var(--secundario)] text-[var(--texto)] border border-[var(--borde)] hover:border-[var(--primario)]";
    const claseActiva = "py-2.5 rounded-lg text-sm font-bold transition-all bg-[var(--primario)] text-[var(--primario-texto)] border border-transparent";

    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if(btn) btn.className = claseInactiva;
    });

    const btnActivo = document.getElementById(`tab-${tabName}`);
    if(btnActivo) btnActivo.className = claseActiva;

    const tituloGrafica = document.getElementById('titulo-grafica');
    if(tituloGrafica) {
        tituloGrafica.innerText = `Rendimiento de ${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
    }
    
    window.actualizarDatosReportes();
};

window.actualizarDatosReportes = async function() {
    const contenedorTarjetas = document.getElementById('contenedor-tarjetas-resumen');
    const inputInicio = document.getElementById('filtro-fecha-inicio');
    const inputFin = document.getElementById('filtro-fecha-fin');
    
    const fechaInicio = inputInicio ? inputInicio.value : '';
    const fechaFin = inputFin ? inputFin.value : '';
    
    let datosExtra = null;

    if (contenedorTarjetas) {
        contenedorTarjetas.innerHTML = ''; 
        if (window.tabActual === 'inventario' || window.tabActual === 'productos') {
            contenedorTarjetas.style.display = 'none';
        } else {
            contenedorTarjetas.style.display = 'grid';
        }
    }

    if (window.tabActual === 'productos') {
        datosExtra = await obtenerProductosTopDesdeBackend(10);
    } else if (window.tabActual === 'ventas') {
        datosExtra = await obtenerVentasDesdeBackend(fechaInicio, fechaFin);
    } else if (window.tabActual === 'inventario') {
        datosExtra = await obtenerInventarioDesdeBackend();
    } else if (window.tabActual === 'gastos') {
        datosExtra = await obtenerGastosDesdeBackend(fechaInicio, fechaFin);
    }

    if (contenedorTarjetas && datosExtra && datosExtra.length > 0) {
        if (window.tabActual === 'ventas') {
            let totalDineros = datosExtra.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
            let totalTransacciones = datosExtra.reduce((sum, item) => sum + parseInt(item.transacciones || 0), 0);
            
            contenedorTarjetas.className = "grid grid-cols-1 md:grid-cols-2 gap-4";
            contenedorTarjetas.innerHTML = `
                <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5">
                    <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Total Ingresos</p>
                    <p class="text-3xl font-black text-[var(--primario)]">$${totalDineros.toLocaleString('es-CO')}</p>
                </div>
                <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5">
                    <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Transacciones</p>
                    <p class="text-3xl font-black text-[var(--texto)]">${totalTransacciones}</p>
                </div>
            `;
        } else if (window.tabActual === 'gastos') {
            let totalEgresos = datosExtra.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
            
            contenedorTarjetas.className = "grid grid-cols-1 gap-4";
            contenedorTarjetas.innerHTML = `
                <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5">
                    <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Total Gastos (Periodo)</p>
                    <p class="text-3xl font-black text-[var(--peligro)]">$${totalEgresos.toLocaleString('es-CO')}</p>
                </div>
            `;
        }
    }

    window.dibujarGraficaPrincipal(datosExtra, window.tabActual);
    window.renderizarTabla(window.tabActual, datosExtra);
};

window.renderizarTabla = function(tabName, datosReales = null) {
    const tabla = document.getElementById('tabla-datos-reportes');
    if (!tabla) return;
    
    const thead = tabla.querySelector('thead');
    const tbody = tabla.querySelector('tbody');
    
    let encabezados = [];
    let filasHTML = '';
    
    if (!datosReales || datosReales.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-[var(--texto-apagado)]">No hay datos registrados en este periodo o el backend no está conectado.</td></tr>`;
        return;
    }

    if (tabName === 'ventas') {
        encabezados = ['Fecha', 'Transacciones', 'Total Día'];
        datosReales.forEach((dia) => {
            filasHTML += `<tr class="border-b border-[var(--borde)] text-sm text-[var(--texto)]">
                <td class="py-3 px-4">${dia.fecha}</td>
                <td class="py-3 px-4">${dia.transacciones}</td>
                <td class="py-3 px-4 font-bold text-[var(--primario)]">$${parseFloat(dia.total).toLocaleString('es-CO')}</td>
            </tr>`;
        });
        
    } else if (tabName === 'productos') {
        encabezados = ['Ranking', 'Platillo/Producto', 'Cantidad Vendida', 'Ingresos Generados'];
        datosReales.forEach((prod, index) => {
            filasHTML += `<tr class="border-b border-[var(--borde)] text-sm text-[var(--texto)]">
                <td class="py-3 px-4">#${index + 1}</td>
                <td class="py-3 px-4 font-bold">${prod.producto}</td>
                <td class="py-3 px-4">${prod.cantidad_vendida} unidades</td>
                <td class="py-3 px-4 font-bold text-[#10b981]">$${parseFloat(prod.ingresos).toLocaleString('es-CO')}</td>
            </tr>`;
        });
        
    } else if (tabName === 'inventario') {
        encabezados = ['Ingrediente/Insumo', 'Categoría', 'Stock Actual', 'Mínimo', 'Estado'];
        datosReales.forEach((item) => {
            let estado = parseFloat(item.stock_actual) <= parseFloat(item.stock_minimo) 
                ? '<span class="text-[var(--peligro)] font-bold">Bajo / Alerta</span>' 
                : '<span class="text-[#10b981]">Óptimo</span>';
                
            filasHTML += `<tr class="border-b border-[var(--borde)] text-sm text-[var(--texto)]">
                <td class="py-3 px-4 font-bold">${item.nombre_producto}</td>
                <td class="py-3 px-4">${item.categoria}</td>
                <td class="py-3 px-4">${item.stock_actual} ${item.unidad}</td>
                <td class="py-3 px-4">${item.stock_minimo} ${item.unidad}</td>
                <td class="py-3 px-4">${estado}</td>
            </tr>`;
        });
        
    } else if (tabName === 'gastos') {
        encabezados = ['Fecha', 'Concepto', 'Categoría', 'Responsable', 'Monto'];
        datosReales.forEach((gasto) => {
            filasHTML += `<tr class="border-b border-[var(--borde)] text-sm text-[var(--texto)]">
                <td class="py-3 px-4">${gasto.fecha}</td>
                <td class="py-3 px-4">${gasto.concepto}</td>
                <td class="py-3 px-4">${gasto.categoria}</td>
                <td class="py-3 px-4">${gasto.responsable}</td>
                <td class="py-3 px-4 font-bold text-[var(--peligro)]">-$${parseFloat(gasto.monto).toLocaleString('es-CO')}</td>
            </tr>`;
        });
    }

    let theadHTML = '<tr class="border-b-2 border-[var(--borde)] text-xs uppercase text-[var(--texto-apagado)]">';
    encabezados.forEach(enc => {
        theadHTML += `<th class="py-3 px-4 font-bold">${enc}</th>`;
    });
    theadHTML += '</tr>';
    
    thead.innerHTML = theadHTML;
    tbody.innerHTML = filasHTML;
};

window.dibujarGraficaPrincipal = function(datosReales = null, tipo = '') {
    const canvas = document.getElementById('grafica-principal');
    if (!canvas) return;

    if (window.miGraficaReportes) {
        window.miGraficaReportes.destroy();
    }

    const ctx = canvas.getContext('2d');
    const estilos = getComputedStyle(document.documentElement);
    
    const colorPrimario = estilos.getPropertyValue('--primario').trim();
    const colorTextoApagado = estilos.getPropertyValue('--texto-apagado').trim();
    const colorBorde = estilos.getPropertyValue('--borde').trim();
    const colorTarjeta = estilos.getPropertyValue('--tarjeta').trim();
    const colorPeligro = estilos.getPropertyValue('--peligro').trim() || '#ef4444';

    const primarioCSS = colorPrimario.startsWith('oklch') ? colorPrimario : `oklch(${colorPrimario})`;
    const textoCSS = colorTextoApagado.startsWith('oklch') ? colorTextoApagado : `oklch(${colorTextoApagado})`;
    const bordeCSS = colorBorde.startsWith('oklch') ? colorBorde : `oklch(${colorBorde})`;
    const tarjetaCSS = colorTarjeta.startsWith('oklch') ? colorTarjeta : `oklch(${colorTarjeta})`;

    let etiquetas = [];
    let datosGrafica = [];
    let tipoGrafica = 'line';
    let colorFondo = 'rgba(255, 99, 132, 0.1)';
    let colorLinea = primarioCSS;

    if (!datosReales || datosReales.length === 0) {
        etiquetas = ['Sin Datos'];
        datosGrafica = [0];
    } else {
        if (tipo === 'ventas') {
            etiquetas = datosReales.map(item => item.fecha);
            datosGrafica = datosReales.map(item => parseFloat(item.total));
        } else if (tipo === 'productos') {
            tipoGrafica = 'bar';
            etiquetas = datosReales.map(item => item.producto);
            datosGrafica = datosReales.map(item => parseInt(item.cantidad_vendida));
            colorFondo = primarioCSS;
        } else if (tipo === 'gastos') {
            etiquetas = datosReales.map(item => item.fecha);
            datosGrafica = datosReales.map(item => parseFloat(item.monto));
            colorLinea = colorPeligro.startsWith('oklch') ? colorPeligro : `oklch(${colorPeligro})`;
            colorFondo = 'rgba(239, 68, 68, 0.1)';
        } else if (tipo === 'inventario') {
            tipoGrafica = 'bar';
            etiquetas = datosReales.map(item => item.nombre_producto);
            datosGrafica = datosReales.map(item => parseFloat(item.stock_actual));
            colorFondo = primarioCSS;
        }
    }

    window.miGraficaReportes = new Chart(ctx, {
        type: tipoGrafica,
        data: {
            labels: etiquetas,
            datasets: [{
                label: `Métricas de ${tipo}`,
                data: datosGrafica,
                borderColor: colorLinea, 
                backgroundColor: colorFondo,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: tarjetaCSS,
                pointBorderColor: colorLinea,
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: bordeCSS }, ticks: { color: textoCSS } },
                x: { grid: { display: false }, ticks: { color: textoCSS } }
            }
        }
    });
};

// =========================================================
// 3. 🔥 SOLUCIÓN BUG 2: EXPORTACIÓN EXCEL DEFINITIVA
// =========================================================
window.descargarExcelBackend = function() {
    const inputInicio = document.getElementById('filtro-fecha-inicio');
    const inputFin = document.getElementById('filtro-fecha-fin');
    const fechaInicio = inputInicio ? inputInicio.value : '';
    const fechaFin = inputFin ? inputFin.value : '';
    
    const seccionActiva = window.tabActual || 'ventas';
    console.log(`🚀 Solicitando Excel a Django: Sección [${seccionActiva}] | Rango: ${fechaInicio} a ${fechaFin}`);
    
    const urlDescarga = `${window.URL_API_REPORTES}/exportar-excel/?tipo=${seccionActiva}&inicio=${fechaInicio}&fin=${fechaFin}`;
    window.location.href = urlDescarga;
};

// Por si tu botón HTML tiene un onclick="exportarAExcel()"
window.exportarAExcel = function(e) {
    if(e) e.preventDefault();
    window.descargarExcelBackend();
};

// Por si tu botón HTML solo tiene el id="btnExportarExcel" (Delegación de eventos global)
document.addEventListener('click', function(e) {
    const btnExcel = e.target.closest('#btnExportarExcel');
    if (btnExcel) {
        e.preventDefault();
        window.descargarExcelBackend();
    }


});

setTimeout(() => {
    if (typeof window.iniciarReportesRestFly === 'function') {
        window.iniciarReportesRestFly();
    }
}, 150);