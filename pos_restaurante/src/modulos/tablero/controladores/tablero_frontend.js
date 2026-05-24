// tablero_frontend.js
console.log("🟢 Script del tablero_frontend.js cargado correctamente");

window.ventasChartInstancia = window.ventasChartInstancia || null;

cargarDatosTablero();

async function cargarDatosTablero() {
    try {
        console.log("🟡 Intentando conectar con el backend...");
        
        const respuesta = await fetch('http://127.0.0.1:8000/api/tablero/resumen/'); 
        
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        console.log("🟢 Datos recibidos:", datos);

        document.getElementById('tablero-total-ventas').textContent = `$${datos.tarjetas.ventas_hoy.toFixed(2)}`;
        document.getElementById('tablero-mesas-ocupadas').innerHTML = `${datos.tarjetas.mesas_ocupadas} <span class="text-sm font-normal text-muted">/ ${datos.tarjetas.total_mesas}</span>`;
        document.getElementById('tablero-pedidos-pendientes').textContent = datos.tarjetas.pedidos_pendientes;
        document.getElementById('tablero-alertas-inv').innerHTML = `${datos.tarjetas.alertas_inventario} <span class="text-sm font-normal text-muted">ítems</span>`;

        const tendenciaEl = document.getElementById('tablero-tendencia-ventas');
        if (datos.tarjetas.tendencia_ventas >= 0) {
            tendenciaEl.textContent = `+${datos.tarjetas.tendencia_ventas}%`;
            tendenciaEl.className = "text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md";
        } else {
            tendenciaEl.textContent = `${datos.tarjetas.tendencia_ventas}%`;
            tendenciaEl.className = "text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md";
        }

        if (typeof Chart !== 'undefined') {
            renderizarGrafica(datos.grafica.labels, datos.grafica.data);
        } else {
            console.error("🔴 No se encontró Chart.js.");
        }

        renderizarTopPlatos(datos.top_platos);
        renderizarActividad(datos.actividad);

    } catch (error) {
        console.error("🔴 Error crítico cargando el tablero:", error);
        
        const contenedorPlatos = document.getElementById('tablero-top-platos');
        if(contenedorPlatos) {
            contenedorPlatos.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center p-4">
                    <p class="text-sm font-bold text-destructive">Error de conexión</p>
                    <p class="text-xs text-muted mt-1">¿Backend prendido en puerto 3000?</p>
                    <p class="text-xs text-muted mt-1">(${error.message})</p>
                </div>
            `;
        }
        
        const contenedorActividad = document.getElementById('tablero-actividad-reciente');
        if(contenedorActividad) {
            contenedorActividad.innerHTML = `
                <p class="text-sm text-destructive font-medium border-l-2 border-destructive pl-2">No se pudo cargar la actividad.</p>
            `;
        }
    }
}

function renderizarGrafica(labels, data) {
    const canvas = document.getElementById('ventasChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (window.ventasChartInstancia) {
        window.ventasChartInstancia.destroy();
    }

    window.ventasChartInstancia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas ($)',
                data: data,
                borderColor: '#f97316', 
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: 3,
                tension: 0.4, 
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#f97316',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderizarTopPlatos(platos) {
    const contenedor = document.getElementById('tablero-top-platos');
    if (!contenedor) return;
    
    contenedor.innerHTML = ''; 
    
    if (!platos || platos.length === 0) {
        contenedor.innerHTML = '<p class="text-sm text-muted text-center mt-4">No hay platos registrados aún.</p>';
        return;
    }

    const estilos = [
        { border: 'hover:border-yellow-500/50', bg: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' }, 
        { border: 'hover:border-slate-400/50', bg: 'bg-slate-400/20 text-slate-500 border-slate-400/30' },     
        { border: 'hover:border-amber-700/50', bg: 'bg-amber-700/20 text-amber-700 border-amber-700/30' }      
    ];

    platos.forEach((plato, index) => {
        const estilo = estilos[index] || estilos[2]; 
        
        const html = `
            <div class="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border transition-colors ${estilo.border}">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-8 h-8 rounded-full font-black flex shrink-0 items-center justify-center border text-xs ${estilo.bg}">
                        ${index + 1}
                    </div>
                    <div class="truncate">
                        <p class="font-bold text-foreground text-sm truncate">${plato.nombre}</p>
                        <p class="text-xs text-muted">${plato.cantidad} und.</p>
                    </div>
                </div>
                <div class="text-right shrink-0 ml-2">
                    <p class="font-black text-primary text-sm">$${plato.ingresos.toFixed(2)}</p>
                </div>
            </div>
        `;
        contenedor.innerHTML += html;
    });
}

function renderizarActividad(actividades) {
    const contenedor = document.getElementById('tablero-actividad-reciente');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';

    if (!actividades || actividades.length === 0) {
        contenedor.innerHTML = '<p class="text-sm text-muted">No hay actividad reciente.</p>';
        return;
    }

    actividades.forEach(act => {
        let horaStr = "Ahora";
        if (act.fecha) {
            const fechaAct = new Date(act.fecha);
            horaStr = fechaAct.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        const html = `
            <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0">
                <div class="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                <p class="flex-1 text-sm text-muted">
                    <span class="font-medium text-foreground">${horaStr}</span> - ${act.mensaje} 
                    <span class="font-bold text-green-500">($${act.monto.toFixed(2)})</span>
                </p>
            </div>
        `;
        contenedor.innerHTML += html;
    });
}