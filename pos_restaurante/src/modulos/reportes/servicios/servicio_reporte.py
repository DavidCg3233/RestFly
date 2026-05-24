from src.modulos.reportes.repositorios.repositorio_reporte import RepositorioReporte

class ServicioReporte:
    
    @staticmethod
    def procesar_reporte(fecha_inicio, fecha_fin, tab):
        # 1. Obtener métricas para las tarjetas superiores (siempre se cargan)
        tarjetas = RepositorioReporte.obtener_metricas_globales(fecha_inicio, fecha_fin)
        
        # 2. Inicializar estructuras
        grafica = {'etiquetas': [], 'datos': []}
        tabla = []

        # 3. Lógica específica por Pestaña (Tab)
        if tab == 'ventas':
            tabla = RepositorioReporte.obtener_datos_tabla_ventas(fecha_inicio, fecha_fin)
            grafica = RepositorioReporte.obtener_grafica_ventas(fecha_inicio, fecha_fin)
        
        elif tab == 'gastos':
            tabla = RepositorioReporte.obtener_datos_tabla_gastos(fecha_inicio, fecha_fin)
            
        elif tab == 'inventario':
            tabla = RepositorioReporte.obtener_datos_tabla_inventario()
            
        elif tab == 'productos':
            tabla = [] 

        return {
            'tarjetas': tarjetas,
            'grafica': grafica,
            'tabla': tabla
        }