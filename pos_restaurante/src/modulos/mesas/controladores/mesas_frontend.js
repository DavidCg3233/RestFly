// 1. Datos de prueba (Sustitúyelo por tu fetch a la API de Django si es necesario)
const platosEjemplo = [
    { id: 1, nombre: "Hamburguesa Artisanal", precio: 12.50, categoria: "cocina", descripcion: "Carne 200g, queso cheddar, salsa de la casa." },
    { id: 2, nombre: "Papas Supremas", precio: 6.00, categoria: "cocina", descripcion: "Con queso fundido y trozos de tocino." },
    { id: 3, nombre: "Mojito Clásico", precio: 8.00, categoria: "bar", descripcion: "Ron blanco, menta fresca, limón y soda." },
    { id: 4, nombre: "Cerveza Artesanal", precio: 5.50, categoria: "bar", descripcion: "Ipa local de la casa." },
    { id: 5, nombre: "Volcán de Chocolate", precio: 7.00, categoria: "postre", descripcion: "Con helado de vainilla artesanal." }
];

// Variable global para rastrear el pedido actual de la mesa abierta
let carritoActual = [];

// 2. FUNCIÓN PARA ABRIR EL MODAL (Asegúrate de llamarla al tocar una mesa)
window.abrirModalPedido = function(numeroMesa) {
    const modal = document.getElementById('modal-pedido');
    const titulo = document.getElementById('modal-titulo-mesa');
    
    if (modal && titulo) {
        titulo.innerText = `Mesa # ${numeroMesa}`;
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Recuerda que usa flex para centrarse
        
        // Forzamos que cargue 'cocina' por defecto al abrir
        window.cambiarTab('cocina');
    }
};

window.cerrarModalPedido = function() {
    const modal = document.getElementById('modal-pedido');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// 3. CONTROLADOR DE PESTAÑAS (TABS) GLOBAL
window.cambiarTab = function(categoria) {
    // Alternar clases activas en los botones visuales
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-primary', 'text-primary-foreground');
        btn.classList.add('text-muted', 'hover:bg-secondary');
    });

    const tabActiva = document.getElementById(`tab-${categoria}`);
    if (tabActiva) {
        tabActiva.classList.add('active', 'bg-primary', 'text-primary-foreground');
        tabActiva.classList.remove('text-muted', 'hover:bg-secondary');
    }

    // Filtrar los platos por la categoría seleccionada
    const platosFiltrados = platosEjemplo.filter(plato => plato.categoria === categoria);
    
    // Renderizar en el contenedor
    window.renderizarMenu(platosFiltrados);
};

// 4. RENDERIZADO DINÁMICO DEL MENÚ (Aquí ocurre la magia)
window.renderizarMenu = function(platos) {
    const contenedor = document.getElementById('contenedor-menu');
    if (!contenedor) return;

    if (platos.length === 0) {
        contenedor.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-muted">
                <i data-lucide="utensils-crossedges" class="w-8 h-8 mb-2 opacity-50"></i>
                <p class="text-sm font-medium">No hay platos en esta categoría</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    // Mapeamos los platos a tarjetas HTML limpias y responsivas
    contenedor.innerHTML = platos.map(plato => `
        <div class="bg-card border border-border p-3.5 rounded-xl flex flex-col justify-between hover:border-primary/40 transition-all group">
            <div class="min-w-0">
                <div class="flex justify-between items-start gap-2">
                    <h4 class="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">${plato.nombre}</h4>
                    <span class="font-mono font-bold text-xs text-primary shrink-0">$${plato.precio.toFixed(2)}</span>
                </div>
                <p class="text-muted text-xs mt-1 line-clamp-2">${plato.descripcion || 'Sin descripción'}</p>
            </div>
            
            <button onclick="window.agregarAlPedido(${plato.id})" class="w-full mt-3 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Agregar
            </button>
        </div>
    `).join('');

    // ¡CRUCIAL! Volver a renderizar los iconos de Lucide cargados dinámicamente
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

// 5. ACCIÓN PARA AGREGAR ITEMS AL CARRITO LATERAL
window.agregarAlPedido = function(idPlato) {
    const plato = platosEjemplo.find(p => p.id === idPlato);
    if (!plato) return;

    // Buscar si ya existe en el carrito de la mesa para sumarle cantidad
    const itemExistente = carritoActual.find(item => item.id === idPlato);
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carritoActual.push({ ...plato, cantidad: 1 });
    }

    window.actualizarDetallePedido();
};

// 6. RENDERIZAR LA COLUMNA DEL CARRITO (DERECHA)
window.actualizarDetallePedido = function() {
    const contenedorItems = document.getElementById('contenedor-pedido-items');
    const txtTotal = document.getElementById('pedido-total');
    if (!contenedorItems || !txtTotal) return;

    if (carritoActual.length === 0) {
        contenedorItems.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center py-20 text-muted/60">
                <i data-lucide="shopping-bag" class="w-10 h-10 mb-2 stroke-1"></i>
                <p class="text-xs font-medium">Comanda vacía</p>
            </div>
        `;
        txtTotal.innerText = "$0.00";
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    let total = 0;

    contenedorItems.innerHTML = carritoActual.map(item => {
        const subtotalItem = item.precio * item.cantidad;
        total += subtotalItem;

        return `
            <div class="bg-background border border-border p-3 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div class="min-w-0 flex-1">
                    <h5 class="font-bold text-xs text-foreground truncate">${item.nombre}</h5>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[11px] font-mono font-medium text-muted-foreground">${item.cantidad}x $${item.precio.toFixed(2)}</span>
                        <span class="text-[11px] font-mono font-bold text-primary">$${subtotalItem.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="flex items-center gap-1.5 bg-secondary rounded-lg p-0.5 border border-border">
                    <button onclick="window.modificarCantidad(${item.id}, -1)" class="p-1 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-colors">
                        <i data-lucide="minus" class="w-3 h-3"></i>
                    </button>
                    <span class="text-xs font-bold px-1 min-w-[16px] text-center">${item.cantidad}</span>
                    <button onclick="window.modificarCantidad(${item.id}, 1)" class="p-1 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-colors">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    txtTotal.innerText = `$${total.toFixed(2)}`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// 7. MODIFICAR CANTIDADES O ELIMINAR DEL CARRITO
window.modificarCantidad = function(idPlato, cambio) {
    const item = carritoActual.find(i => i.id === idPlato);
    if (!item) return;

    item.cantidad += cambio;

    if (item.cantidad <= 0) {
        carritoActual = carritoActual.filter(i => i.id !== idPlato);
    }

    window.actualizarDetallePedido();
};

// 8. BOTÓN DE ENVIAR A COCINA
window.confirmarPedido = function(event) {
    if (event) event.preventDefault();
    
    if (carritoActual.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Comanda vacía',
            text: 'Debes agregar al menos un plato antes de enviar a la cocina.',
            confirmButtonColor: 'var(--primary, #7627E6)'
        });
        return;
    }

    Swal.fire({
        icon: 'success',
        title: '¡Pedido Enviado!',
        text: 'La comanda se ha mandado exitosamente a producción.',
        timer: 2000,
        showConfirmButton: false
    });

    // Resetear carrito y cerrar
    carritoActual = [];
    window.actualizarDetallePedido();
    window.cerrarModalPedido();
};