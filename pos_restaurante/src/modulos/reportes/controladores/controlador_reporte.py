import openpyxl
from decimal import Decimal
from datetime import datetime, date
from django.db import connection
from django.http import JsonResponse, HttpResponse
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

# Función auxiliar para formatear los resultados del cursor de SQL a Diccionarios
def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

# =========================================================
# 1. ENDPOINT: VENTAS DIARIAS
# =========================================================
def api_ventas_diarias(request):
    inicio = request.GET.get('inicio', '')
    fin = request.GET.get('fin', '')
    
    query = """
        SELECT 
            DATE(fecha_venta) AS fecha,
            COUNT(id_venta) AS transacciones,
            SUM(total_venta) AS total
        FROM venta
        WHERE 1=1
    """
    params = []
    
    if inicio and fin:
        query += " AND DATE(fecha_venta) BETWEEN %s AND %s"
        params.extend([inicio, fin])
        
    query += " GROUP BY DATE(fecha_venta) ORDER BY fecha ASC;"
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            datos = dictfetchall(cursor)
            
        for fila in datos:
            if fila['fecha']:
                fila['fecha'] = fila['fecha'].strftime('%Y-%m-%d')
                
        return JsonResponse({"estado": "exitoso", "data": datos})
    except Exception as e:
        return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

# =========================================================
# 2. ENDPOINT: TOP PRODUCTOS
# =========================================================
def api_productos_top(request):
    try:
        limite = int(request.GET.get('limite', 10))
    except ValueError:
        limite = 10
        
    query = """
        SELECT 
            p.nombre_producto AS producto,
            SUM(dp.cantidad) AS cantidad_vendida,
            SUM(dp.cantidad * dp.precio_unitario) AS ingresos
        FROM detalle_pedido dp
        INNER JOIN producto p ON dp.id_producto = p.id_producto
        INNER JOIN pedido ped ON dp.id_pedido = ped.id_pedido
        INNER JOIN venta v ON ped.id_pedido = v.id_pedido
        GROUP BY p.id_producto, p.nombre_producto
        ORDER BY cantidad_vendida DESC
        LIMIT %s;
    """
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, [limite])
            datos = dictfetchall(cursor)
        return JsonResponse({"estado": "exitoso", "data": datos})
    except Exception as e:
        return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

# =========================================================
# 3. ENDPOINT: ESTADO DEL INVENTARIO
# =========================================================
def api_inventario_estado(request):
    query = """
        SELECT 
            p.nombre_producto,
            cp.nombre_categoria AS categoria,
            i.stock_actual,
            i.stock_minimo,
            i.unidad_medida AS unidad
        FROM inventario i
        INNER JOIN producto p ON i.id_producto = p.id_producto
        INNER JOIN categoria_producto cp ON p.id_categoria = cp.id_categoria
        ORDER BY i.stock_actual ASC;
    """
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            datos = dictfetchall(cursor)
            
        for fila in datos:
            fila['stock_actual'] = float(fila['stock_actual'])
            fila['stock_minimo'] = float(fila['stock_minimo'])
            
        return JsonResponse({"estado": "exitoso", "data": datos})
    except Exception as e:
        return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)

# =========================================================
# 4. ENDPOINT: GESTIÓN DE GASTOS
# =========================================================
def api_gastos(request):
    inicio = request.GET.get('inicio', '')
    fin = request.GET.get('fin', '')
    
    query = """
        SELECT 
            DATE(mc.fecha_movimiento) AS fecha,
            mc.descripcion AS concepto,
            tm.nombre_tipo_movimiento AS categoria,
            u.username AS responsable,
            mc.monto
        FROM movimiento_caja mc
        INNER JOIN tipo_movimiento tm ON mc.id_tipo_movimiento = tm.id_tipo_movimiento
        INNER JOIN caja c ON mc.id_caja = c.id_caja
        INNER JOIN usuario u ON c.id_usuario = u.id_usuario
        WHERE LOWER(tm.nombre_tipo_movimiento) LIKE %s
    """
    params = ['%egreso%']
    
    if inicio and fin:
        query += " AND DATE(mc.fecha_movimiento) BETWEEN %s AND %s"
        params.extend([inicio, fin])
        
    query += " ORDER BY mc.fecha_movimiento DESC;"
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            datos = dictfetchall(cursor)
            
        for fila in datos:
            if fila['fecha']:
                fila['fecha'] = fila['fecha'].strftime('%Y-%m-%d')
            fila['monto'] = float(fila['monto'])
            
        return JsonResponse({"estado": "exitoso", "data": datos})
    except Exception as e:
        return JsonResponse({"estado": "error", "mensaje": str(e)}, status=500)
    

# =========================================================
# 5. ENDPOINT: EXPORTACIÓN INTELIGENTE A EXCEL
# =========================================================
def api_exportar_excel(request):
    tipo = request.GET.get('tipo', 'ventas')
    inicio = request.GET.get('inicio', '')
    fin = request.GET.get('fin', '')
    
    # 1. Inicializar el libro de Excel
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.views.sheetView[0].showGridLines = True # Asegura que se vean las líneas de cuadrícula
    
    # Estilos profesionales (Muted Navy Blue)
    fill_header = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    fill_zebra = PatternFill(start_color="F2F6FA", end_color="F2F6FA", fill_type="solid")
    font_title = Font(name="Calibri", size=16, bold=True, color="1F4E79")
    font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=11, bold=True)
    font_regular = Font(name="Calibri", size=11)
    
    border_thin = Border(
        left=Side(style='thin', color='D3D3D3'),
        right=Side(style='thin', color='D3D3D3'),
        top=Side(style='thin', color='D3D3D3'),
        bottom=Side(style='thin', color='D3D3D3')
    )
    border_total = Border(
        top=Side(style='thin', color='1F4E79'),
        bottom=Side(style='double', color='1F4E79')
    )
    
    align_center = Alignment(horizontal='center', vertical='center')
    align_right = Alignment(horizontal='right', vertical='center')
    align_left = Alignment(horizontal='left', vertical='center')

    # 2. Definir Queries y Estructuras según la sección seleccionada
    query = ""
    params = []
    headers = []
    titulo_reporte = ""
    
    if tipo == 'ventas':
        titulo_reporte = f"Reporte de Ventas Diarias ({inicio} a {fin})" if inicio else "Reporte Global de Ventas Diarias"
        ws.title = "Ventas"
        headers = ["Fecha", "Transacciones", "Total Ventas"]
        query = """
            SELECT DATE(fecha_venta) AS f, COUNT(id_venta), SUM(total_venta) 
            FROM venta WHERE 1=1
        """
        if inicio and fin:
            query += " AND DATE(fecha_venta) BETWEEN %s AND %s"
            params.extend([inicio, fin])
        query += " GROUP BY DATE(fecha_venta) ORDER BY f ASC;"
        
    elif tipo == 'gastos':
        titulo_reporte = f"Reporte de Egresos de Caja ({inicio} a {fin})" if inicio else "Reporte General de Egresos"
        ws.title = "Gastos y Egresos"
        headers = ["Fecha", "Concepto / Descripción", "Categoría", "Responsable", "Monto"]
        query = """
            SELECT DATE(mc.fecha_movimiento) AS f, mc.descripcion, tm.nombre_tipo_movimiento, u.username, mc.monto
            FROM movimiento_caja mc
            INNER JOIN tipo_movimiento tm ON mc.id_tipo_movimiento = tm.id_tipo_movimiento
            INNER JOIN caja c ON mc.id_caja = c.id_caja
            INNER JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE LOWER(tm.nombre_tipo_movimiento) LIKE %s
        """
        params.append('%egreso%')
        if inicio and fin:
            query += " AND DATE(mc.fecha_movimiento) BETWEEN %s AND %s"
            params.extend([inicio, fin])
        query += " ORDER BY mc.fecha_movimiento DESC;"
        
    elif tipo == 'productos':
        titulo_reporte = "Top 10 Productos Más Vendidos"
        ws.title = "Top Productos"
        headers = ["Producto", "Cantidad Vendida", "Ingresos Generados"]
        query = """
            SELECT p.nombre_producto, SUM(dp.cantidad), SUM(dp.cantidad * dp.precio_unitario)
            FROM detalle_pedido dp
            INNER JOIN producto p ON dp.id_producto = p.id_producto
            INNER JOIN pedido ped ON dp.id_pedido = ped.id_pedido   
            INNER JOIN venta v ON ped.id_pedido = v.id_pedido
            GROUP BY p.id_producto, p.nombre_producto
            ORDER BY SUM(dp.cantidad) DESC LIMIT 10;
        """
    else: # inventario
        titulo_reporte = "Estado Actual del Inventario RestFly"
        ws.title = "Inventario"
        headers = ["Producto", "Categoría", "Stock Actual", "Stock Mínimo", "Unidad"]
        query = """
            SELECT p.nombre_producto, cp.nombre_categoria, i.stock_actual, i.stock_minimo, i.unidad_medida
            FROM inventario i
            INNER JOIN producto p ON i.id_producto = p.id_producto
            INNER JOIN categoria_producto cp ON p.id_categoria = cp.id_categoria
            ORDER BY i.stock_actual ASC;
        """

    # 3. Escribir Título en el Excel
    ws.append([titulo_reporte])
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=max(len(headers), 3))
    ws.cell(row=1, column=1).font = font_title
    ws.row_dimensions[1].height = 30
    ws.append([]) # Fila en blanco de separación

    # 4. Escribir Encabezados de la Tabla
    ws.append(headers)
    header_row_idx = 3
    ws.row_dimensions[header_row_idx].height = 24
    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=header_row_idx, column=col_idx)
        cell.fill = fill_header
        cell.font = font_header
        cell.alignment = align_center
        cell.border = border_thin

    # 5. Ejecutar la Consulta y Llenar Datos
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            filas_db = cursor.fetchall()
            
        current_row = 4
        for r_idx, registro in enumerate(filas_db):
            row_data = list(registro)
            
            # Formatear fechas a string limpio
            if row_data and isinstance(row_data[0], (datetime, date)):
                row_data[0] = row_data[0].strftime('%Y-%m-%d')
                
            ws.append(row_data)
            ws.row_dimensions[current_row].height = 18
            
            # Aplicar estilos fila por fila
            for c_idx in range(1, len(headers) + 1):
                cell = ws.cell(row=current_row, column=c_idx)
                cell.font = font_regular
                cell.border = border_thin
                
                # Zebra striping alternando filas
                if current_row % 2 == 0:
                    cell.fill = fill_zebra
                    
                # Alineaciones y formatos numéricos específicos
                val = cell.value
                if isinstance(val, (int, float, Decimal)):
                    if tipo == 'ventas' and c_idx == 3: # Dinero en Ventas
                        cell.number_format = '"$"#,##0.00'
                        cell.alignment = align_right
                    elif tipo == 'gastos' and c_idx == 5: # Dinero en Gastos
                        cell.number_format = '"$"#,##0.00'
                        cell.alignment = align_right
                    elif tipo == 'productos' and c_idx == 3: # Dinero en productos
                        cell.number_format = '"$"#,##0.00'
                        cell.alignment = align_right
                    elif tipo == 'productos' and c_idx == 2: # Cantidad entera en productos
                        cell.number_format = '#,##0'
                        cell.alignment = align_right
                    elif (c_idx in [3, 4] if tipo == 'inventario' else False): # Pesos/cantidades con decimales en Inventario
                        cell.number_format = '#,##0.00'
                        cell.alignment = align_right
                    else:
                        cell.number_format = '#,##0'
                        cell.alignment = align_right
                else:
                    if c_idx == 1:
                        cell.alignment = align_center # Fechas centradas
                    else:
                        cell.alignment = align_left

            current_row += 1

        # 6. Agregar fila de Totales Dinámicos si aplica (Ventas y Gastos)
        if tipo in ['ventas', 'gastos', 'productos']:
            ws.cell(row=current_row, column=1, value="TOTALES").font = font_bold
            ws.cell(row=current_row, column=1).alignment = align_left
            ws.cell(row=current_row, column=1).border = border_total
            
            for c_idx in range(2, len(headers) + 1):
                cell = ws.cell(row=current_row, column=c_idx)
                cell.border = border_total
                
                # Columnas que merecen sumatoria automática
                if (tipo == 'ventas' and c_idx in [2, 3]) or (tipo == 'gastos' and c_idx == 5) or (tipo == 'productos' and c_idx in [2, 3]):
                    col_letter = get_column_letter(c_idx)
                    cell.value = f"=SUM({col_letter}4:{col_letter}{current_row-1})"
                    cell.font = font_bold
                    cell.alignment = align_right
                    if c_idx == len(headers) or (tipo == 'ventas' and c_idx == 3) or (tipo == 'productos' and c_idx == 3):
                        cell.number_format = '"$"#,##0.00'
                    else:
                        cell.number_format = '#,##0'

        # 7. Auto-ajustar el tamaño de las columnas para evitar el horrible "###"
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                if cell.row == 1: continue # ignora el título largo para el cálculo de anchura
                if cell.value:
                    max_len = max(max_len, len(str(cell.value)))
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    except Exception as e:
        return HttpResponse(f"Error generando reporte de excel: {str(e)}", status=500)

    # 8. Preparar respuesta de descarga http
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename=reporte_{tipo}_{datetime.now().strftime("%Y%m%d")}.xlsx'
    wb.save(response)
    return response