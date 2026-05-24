window.miGraficaReportes = null;
window.tabActual = 'ventas'; // Controla la pestaña activa

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

    // Event Listeners
    document.getElementById('filtro-fecha-inicio').addEventListener('change', window.actualizarDatosReportes);
    document.getElementById('filtro-fecha-fin').addEventListener('change', window.actualizarDatosReportes);
    
    const btnExportar = document.getElementById('btn-exportar-reportes');
    if(btnExportar) {
        btnExportar.addEventListener('click', window.exportarAExcel);
    }

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

window.actualizarDatosReportes = function() {
    // 1. Actualizar Tarjetas (Dummy Data)
    const totalVentas = Math.floor(Math.random() * 5000) + 1000;
    const transacciones = Math.floor(Math.random() * 150) + 20;
    const promedio = totalVentas / transacciones;
    const totalGastos = Math.floor(Math.random() * 2000) + 100;
    const utilidad = totalVentas - totalGastos;

    document.getElementById('card-total-ventas').innerText = `$${totalVentas.toFixed(2)}`;
    document.getElementById('card-tx-count').innerText = `${transacciones} transacciones`;
    document.getElementById('card-promedio').innerText = `$${promedio.toFixed(2)}`;
    document.getElementById('card-total-gastos').innerText = `$${totalGastos.toFixed(2)}`;
    document.getElementById('card-gastos-count').innerText = `${Math.floor(Math.random() * 10) + 1} registros`;
    
    const divUtilidad = document.getElementById('card-utilidad');
    divUtilidad.innerText = `$${utilidad.toFixed(2)}`;
    divUtilidad.className = `text-3xl font-black ${utilidad >= 0 ? 'text-[#10b981]' : 'text-[var(--peligro)]'}`; 

    // 2. Actualizar Gráfica
    window.dibujarGraficaPrincipal();

    // 3. Renderizar Tabla según el tab actual
    window.renderizarTabla(window.tabActual);
};

window.renderizarTabla = function(tabName) {
    const tabla = document.getElementById('tabla-datos-reportes');
    if (!tabla) return;
    
    const thead = tabla.querySelector('thead');
    const tbody = tabla.querySelector('tbody');
    
    let encabezados = [];
    let filasHTML = '';
    
    // Generar estructura según el módulo
    if (tabName === 'ventas') {
        encabezados = ['Fecha', 'Ticket', 'Cliente', 'Método Pago', 'Total'];
        for(let i=1; i<=5; i++) {
            filasHTML += `<tr class="border-b border-[var(--borde)] text-sm text-[var(--texto)]">
                <td class="py-3 px-4">2026-05-${10+i}</td>
                <td class="py-3 px-4">#TK-00${i}</td>
                <td class="py-3 px-4">Cliente Mostrador</td>
                <td class="py-3 px-4">Efectivo</td>
                <td class="py-3 px-4 font-bold text-[var(--primario)]">$${(Math.random() * 100).toFixed(2)}</td>
            </tr>`;
        }
    } else if (tabName === 'inventario') {
        encabezados = ['Ingrediente/Insumo', 'Categoría', 'Stock Actual', 'Mínimo', 'Estado'];
        for(let i=1; i<=5; i++) {
            let stock = Math.floor(Math.random() * 50);
            let estado = stock < 10 ? '<span class="text-[var(--peligro)]">Bajo</span>' : '<span class="text-[#10b981]">Óptimo</span>';
            filasHTML += `<tr class="border-b border-[var(--borde)] text-sm text-[var(--texto)]">
                <td class="py-3 px-4">Insumo ${i}</td>
                <td class="py-3 px-4">Abarrotes</td>
                <td class="py-3 px-4">${stock} Kg</td>
                <td class="py-3 px-4">10 Kg</td>
                <td class="py-3 px-4 font-bold">${estado}</td>
            </tr>`;
        }
    } else if (tabName === 'productos') {
        encabezados = ['Platillo/Producto', 'Vendidos', 'Costo', 'Precio Venta', 'Margen'];
        for(let i=1; i<=5; i++) {
            let costo = (Math.random() * 10).toFixed(2);
            let precio = (costo * 3).toFixed(2);
            filasHTML += `<tr class="border-b border-[var(--borde)] text-sm text-[var(--texto)]">
                <td class="py-3 px-4">Hamburguesa Doble ${i}</td>
                <td class="py-3 px-4">${Math.floor(Math.random() * 100)}</td>
                <td class="py-3 px-4">$${costo}</td>
                <td class="py-3 px-4">$${precio}</td>
                <td class="py-3 px-4 font-bold text-[#10b981]">66%</td>
            </tr>`;
        }
    } else if (tabName === 'gastos') {
        encabezados = ['Fecha', 'Concepto', 'Categoría', 'Responsable', 'Monto'];
        for(let i=1; i<=5; i++) {
            filasHTML += `<tr class="border-b border-[var(--borde)] text-sm text-[var(--texto)]">
                <td class="py-3 px-4">2026-05-${10+i}</td>
                <td class="py-3 px-4">Compra de Insumos</td>
                <td class="py-3 px-4">Proveedores</td>
                <td class="py-3 px-4">Admin</td>
                <td class="py-3 px-4 font-bold text-[var(--peligro)]">-$${(Math.random() * 300).toFixed(2)}</td>
            </tr>`;
        }
    }

    // Dibujar los encabezados
    let theadHTML = '<tr class="border-b-2 border-[var(--borde)] text-xs uppercase text-[var(--texto-apagado)]">';
    encabezados.forEach(enc => {
        theadHTML += `<th class="py-3 px-4 font-bold">${enc}</th>`;
    });
    theadHTML += '</tr>';
    
    thead.innerHTML = theadHTML;
    tbody.innerHTML = filasHTML;
};

window.dibujarGraficaPrincipal = function() {
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

    const primarioCSS = colorPrimario.startsWith('oklch') ? colorPrimario : `oklch(${colorPrimario})`;
    const textoCSS = colorTextoApagado.startsWith('oklch') ? colorTextoApagado : `oklch(${colorTextoApagado})`;
    const bordeCSS = colorBorde.startsWith('oklch') ? colorBorde : `oklch(${colorBorde})`;
    const tarjetaCSS = colorTarjeta.startsWith('oklch') ? colorTarjeta : `oklch(${colorTarjeta})`;

    const etiquetas = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const datosGrafica = Array.from({length: 7}, () => Math.floor(Math.random() * 1000) + 200);

    window.miGraficaReportes = new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [{
                label: `Datos de ${window.tabActual}`,
                data: datosGrafica,
                borderColor: primarioCSS, 
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: tarjetaCSS,
                pointBorderColor: primarioCSS,
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: bordeCSS },
                    ticks: { color: textoCSS }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textoCSS }
                }
            }
        }
    });
};

// Función nativa para exportar la tabla a Excel (formato CSV)
window.exportarAExcel = function() {
    const tabla = document.getElementById('tabla-datos-reportes');
    if (!tabla) return;
    
    let csv = [];
    // Leer todas las filas de la tabla
    const filas = tabla.querySelectorAll('tr');
    
    for (let i = 0; i < filas.length; i++) {
        let filaData = [];
        const columnas = filas[i].querySelectorAll('td, th');
        
        for (let j = 0; j < columnas.length; j++) {
            // Limpiamos el texto y lo ponemos entre comillas para evitar problemas con comas
            let texto = columnas[j].innerText.replace(/"/g, '""').trim();
            filaData.push(`"${texto}"`);
        }
        csv.push(filaData.join(','));
    }
    
    // Crear el archivo Blob y descargarlo
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