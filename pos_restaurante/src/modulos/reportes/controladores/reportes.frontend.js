window.miGraficaReportes = null;

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

    window.actualizarDatosReportes();
};

window.cambiarTabReportes = function(tabName) {
    const tabs = ['ventas', 'inventario', 'productos', 'gastos'];
    
    // Clases basadas en tus variables CSS
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
    // Usamos el color de éxito de tu proyecto (o un verde estándar) y el peligro de tus variables
    divUtilidad.className = `text-3xl font-black ${utilidad >= 0 ? 'text-[#10b981]' : 'text-[var(--peligro)]'}`; 

    window.dibujarGraficaPrincipal();
};

window.dibujarGraficaPrincipal = function() {
    const canvas = document.getElementById('grafica-principal');
    if (!canvas) return;

    if (window.miGraficaReportes) {
        window.miGraficaReportes.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Extraemos los colores reales de tu CSS para pasárselos a Chart.js
    const estilos = getComputedStyle(document.documentElement);
    const colorPrimario = estilos.getPropertyValue('--primario').trim();
    const colorTextoApagado = estilos.getPropertyValue('--texto-apagado').trim();
    const colorBorde = estilos.getPropertyValue('--borde').trim();
    const colorTarjeta = estilos.getPropertyValue('--tarjeta').trim();

    // Chart.js soporta OKLCH en versiones recientes, pasamos la función CSS directamente
    const primarioCSS = colorPrimario.startsWith('oklch') ? colorPrimario : `oklch(${colorPrimario})`;
    const textoCSS = colorTextoApagado.startsWith('oklch') ? colorTextoApagado : `oklch(${colorTextoApagado})`;
    const bordeCSS = colorBorde.startsWith('oklch') ? colorBorde : `oklch(${colorBorde})`;
    const tarjetaCSS = colorTarjeta.startsWith('oklch') ? colorTarjeta : `oklch(${colorTarjeta})`;

    const etiquetas = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const datosVentas = Array.from({length: 7}, () => Math.floor(Math.random() * 1000) + 200);

    window.miGraficaReportes = new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Ingresos ($)',
                data: datosVentas,
                borderColor: primarioCSS, 
                backgroundColor: 'rgba(255, 99, 132, 0.1)', // Fondo semi-transparente de respaldo
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
            plugins: {
                legend: { display: false }
            },
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