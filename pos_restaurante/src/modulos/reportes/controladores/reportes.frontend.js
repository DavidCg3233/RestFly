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

    // Event Listeners para cambios de filtros
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
    const contenedorTarjetas = document.getElementById('contenedor-tarjetas-resumen');
    
    // 1. Manejo dinámico de las Tarjetas de Resumen según el módulo
    if (window.tabActual === 'inventario' || window.tabActual === 'productos') {
        // En Inventario y Productos se ocultan por completo
        if (contenedorTarjetas) contenedorTarjetas.style.display = 'none';
    } else {
        // Asegurar que se vuelvan a mostrar en Ventas y Gastos
        if (contenedorTarjetas) contenedorTarjetas.style.display = 'grid';
        
        if (window.tabActual === 'ventas') {
            // Generar datos aleatorios de ventas para simulación
            const totalVentas = Math.floor(Math.random() * 5000) + 1000;
            const transacciones = Math.floor(Math.random() * 150) + 20;
            const promedio = totalVentas / transacciones;
            const totalGastos = Math.floor(Math.random() * 2000) + 100;
            const utilidad = totalVentas - totalGastos;
            
            // Layout responsivo de 4 columnas
            if (contenedorTarjetas) {
                contenedorTarjetas.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";
                contenedorTarjetas.innerHTML = `
                    <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5 transition-colors duration-300">
                        <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Total Ventas</p>
                        <p class="text-3xl font-black text-[var(--primario)]">$${totalVentas.toFixed(2)}</p>
                        <p class="text-xs text-[var(--texto-apagado)] mt-2">${transacciones} transacciones</p>
                    </div>
                    <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5 transition-colors duration-300">
                        <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Promedio</p>
                        <p class="text-3xl font-black text-[var(--primario)]">$${promedio.toFixed(2)}</p>
                        <p class="text-xs text-[var(--texto-apagado)] mt-2">Por transacción</p>
                    </div>
                    <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5 transition-colors duration-300">
                        <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Total Gastos</p>
                        <p class="text-3xl font-black text-[var(--peligro)]">$${totalGastos.toFixed(2)}</p>
                        <p class="text-xs text-[var(--texto-apagado)] mt-2">${Math.floor(Math.random() * 10) + 1} registros</p>
                    </div>
                    <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5 transition-colors duration-300">
                        <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Utilidad Neta</p>
                        <p class="text-3xl font-black ${utilidad >= 0 ? 'text-[#10b981]' : 'text-[var(--peligro)]'}">$${utilidad.toFixed(2)}</p>
                        <p class="text-xs text-[var(--texto-apagado)] mt-2">Ventas - Gastos</p>
                    </div>
                `;
            }
        } else if (window.tabActual === 'gastos') {
            // Generar datos aleatorios de gastos para simulación
            const totalGastos = Math.floor(Math.random() * 2000) + 100;
            const registrosGastos = Math.floor(Math.random() * 10) + 1;
            const promedioGasto = totalGastos / registrosGastos;
            const porcentajeVentas = (Math.random() * 25).toFixed(1); // Simulación de % sobre ventas
            
            // Layout responsivo de 3 columnas para que queden simétricas
            if (contenedorTarjetas) {
                contenedorTarjetas.className = "grid grid-cols-1 md:grid-cols-3 gap-4";
                contenedorTarjetas.innerHTML = `
                    <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5 transition-colors duration-300">
                        <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Total Gastos</p>
                        <p class="text-3xl font-black text-[var(--peligro)]">$${totalGastos.toFixed(2)}</p>
                        <p class="text-xs text-[var(--texto-apagado)] mt-2">${registrosGastos} registros</p>
                    </div>
                    <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5 transition-colors duration-300">
                        <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">Promedio</p>
                        <p class="text-3xl font-black text-[var(--peligro)]">$${promedioGasto.toFixed(2)}</p>
                        <p class="text-xs text-[var(--texto-apagado)] mt-2">Por registro de gasto</p>
                    </div>
                    <div class="bg-[var(--tarjeta)] border border-[var(--borde)] rounded-xl p-5 transition-colors duration-300">
                        <p class="text-xs font-bold text-[var(--texto-apagado)] mb-2">% de Ventas</p>
                        <p class="text-3xl font-black text-[var(--tarjeta-texto)]">${porcentajeVentas}%</p>
                        <p class="text-xs text-[var(--texto-apagado)] mt-2">Relación sobre ingresos</p>
                    </div>
                `;
            }
        }
    }

    // 2. Renderizar Gráfica
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