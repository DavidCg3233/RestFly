// =========================================================
// CONFIGURACIÓN GLOBAL
// =========================================================
const URL_API_REPORTES = 'http://localhost:8000/api/reportes';

window.miGraficaReportes = null;
window.tabActual = 'ventas';

// =========================================================
// 1. CONEXIÓN AL BACKEND (FETCH) - LOS 4 MÓDULOS REALES
// =========================================================
async function obtenerVentasDesdeBackend(inicio = '', fin = '') {
    try {
        let url = `${URL_API_REPORTES}/ventas-diarias/`;
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
        const respuesta = await fetch(`${URL_API_REPORTES}/productos-top/?limite=${limite}`);
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
        const respuesta = await fetch(`${URL_API_REPORTES}/inventario-estado/`);
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
        let url = `${URL_API_REPORTES}/gastos/`;
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
    
    document.getElementById('filtro-fecha-inicio').value = haceUnMes.toISOString().split('T')[0];
    document.getElementById('filtro-fecha-fin').value = hoy.toISOString().split('T')[0];

    document.getElementById('filtro-fecha-inicio').addEventListener('change', window.actualizarDatosReportes);
    document.getElementById('filtro-fecha-fin').addEventListener('change', window.actualizarDatosReportes);
    
    const btnExportar = document.getElementById('btn-exportar-reportes');
    if(btnExportar) btnExportar.addEventListener('click', window.exportarAExcel);

    window.actualizarDatosReportes();
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

    document.getElementById('titulo-grafica').innerText = `Rendimiento de ${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
    
    window.actualizarDatosReportes();
};

window.actualizarDatosReportes = async function() {
    const contenedorTarjetas = document.getElementById('contenedor-tarjetas-resumen');
    const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
    const fechaFin = document.getElementById('filtro-fecha-fin').value;
    
    let datosExtra = null;

    // 1. Ocultar tarjetas en Inventario y Productos
    if (contenedorTarjetas) {
        contenedorTarjetas.innerHTML = ''; 
        if (window.tabActual === 'inventario' || window.tabActual === 'productos') {
            contenedorTarjetas.style.display = 'none';
        } else {
            contenedorTarjetas.style.display = 'grid';
        }
    }

    // 2. Traer datos reales del Backend dependiendo de la pestaña
    if (window.tabActual === 'productos') {
        datosExtra = await obtenerProductosTopDesdeBackend(10);
    } else if (window.tabActual === 'ventas') {
        datosExtra = await obtenerVentasDesdeBackend(fechaInicio, fechaFin);
    } else if (window.tabActual === 'inventario') {
        datosExtra = await obtenerInventarioDesdeBackend();
    } else if (window.tabActual === 'gastos') {
        datosExtra = await obtenerGastosDesdeBackend(fechaInicio, fechaFin);
    }

    // 3. (OPCIONAL) Inyectar resumen en las tarjetas basado en datosExtra si es Ventas o Gastos
    // Nota: Por ahora dejo una estructura vacía o calculada simple para que no salgan fijos.
    if (contenedorTarjetas && datosExtra && datosExtra.length > 0) {
        if (window.tabActual === 'ventas') {
            let totalDineros = datosExtra.reduce((sum, item) => sum + parseFloat(item.total), 0);
            let totalTransacciones = datosExtra.reduce((sum, item) => sum + parseInt(item.transacciones), 0);
            
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
            let totalEgresos = datosExtra.reduce((sum, item) => sum + parseFloat(item.monto), 0);
            
            contenedorTarjetas.className = "grid grid-cols-1 gap-4";
            contenedorTarjetas.innerHTML = `
                <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5">
                    <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Total Gastos (Periodo)</p>
                    <p class="text-3xl font-black text-[var(--peligro)]">$${totalEgresos.toLocaleString('es-CO')}</p>
                </div>
            `;
        }
    }

    // 4. Renderizar Gráfica y Tabla pasándole los DATOS REALES
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
        // Si no hay datos, gráfica vacía
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
            colorFondo = 'rgba(239, 68, 68, 0.1)'; // Rojo suave
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

window.exportarAExcel = function() {
    const tabla = document.getElementById('tabla-datos-reportes');
    if (!tabla) return;
    
    let csv = [];
    const filas = tabla.querySelectorAll('tr');
    
    for (let i = 0; i < filas.length; i++) {
        let filaData = [];
        const columnas = filas[i].querySelectorAll('td, th');
        for (let j = 0; j < columnas.length; j++) {
            let texto = columnas[j].innerText.replace(/"/g, '""').trim();
            filaData.push(`"${texto}"`);
        }
        csv.push(filaData.join(','));
    }
    
    const csvFile = new Blob(["\uFEFF" + csv.join('\n')], {type: 'text/csv;charset=utf-8;'});
    const url = window.URL.createObjectURL(csvFile);
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.download = `Reporte_${window.tabActual}_${new Date().toISOString().split('T')[0]}.csv`;
    enlaceDescarga.href = url;
    enlaceDescarga.style.display = 'none';
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    document.body.removeChild(enlaceDescarga);
    window.URL.revokeObjectURL(url);
};