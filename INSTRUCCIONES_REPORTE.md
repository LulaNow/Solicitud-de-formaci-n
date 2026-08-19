# Instrucciones para Agregar Reporte de Solicitudes de Formación

## Archivos creados:

1. **Página del reporte**: `src/app/(portal)/reportes/solicitudes-formacion/page.tsx`
2. **Endpoint API**: Modificado `src/server/routers/requests.ts` (endpoint `reporteSolicitudes`)
3. **Script SQL**: `agregar_menu_reporte.sql`

## Pasos para activar el reporte:

### 1. Ejecutar el script SQL en pgAdmin

Abre pgAdmin y ejecuta el archivo `agregar_menu_reporte.sql` en la base de datos **Becas**.

Este script:
- Crea el permiso `reportes.solicitudes.view`
- Asigna el permiso a los roles: **Administrador**, **Resolutor de tarea**, **Aprobador**
- Crea el menú "Reporte Solicitud de Formación"

### 2. Verificar que el menú aparece

Después de ejecutar el SQL:
1. Recarga la página en el navegador
2. El menú "Reporte Solicitud de Formación" debe aparecer para usuarios con los roles autorizados

## Características del reporte:

### Columnas incluidas (34 en total):

1. Solicitud (numero_ticket)
2. Convocatoria
3. CDR
4. Evento
5. Modalidad
6. Tipo
7. Empleado (no_empleado)
8. Nombre
9. Fecha ingreso
10. Puesto
11. Antigüedad en el puesto
12. CECO
13. Principales funciones
14. Total de participantes
15. Áreas
16. Nombre del curso o programa
17. Institución
18. Duración
19. Tipo de programa
20. Fecha inicio
21. Fecha fin
22. Beneficio/Indicador de impacto
23. Tipo de moneda
24. Costo
25. Tipo de IVA
26. IVA
27. Retención IVA
28. Retención ISR
29. Total
30. Porcentaje asignado
31. Monto beca
32. Autorizador
33. Estatus
34. Fecha de creación

### Funcionalidades:

- ✅ **Tabla completa** con todas las columnas solicitadas
- ✅ **Exportar a Excel** (formato CSV compatible)
- ✅ **Scroll horizontal** para ver todas las columnas
- ✅ **Columna "Solicitud" fija** (sticky) al hacer scroll
- ✅ **Formato de fechas** en español
- ✅ **Badges de estado** con colores
- ✅ **Contador de registros** totales
- ✅ **Restricción de acceso** solo para roles autorizados

### Permisos:

Solo pueden ver el reporte usuarios con los siguientes roles:
- **Administrador**
- **Resolutor de tarea**
- **Aprobador**

## Verificación:

1. Inicia sesión con un usuario que tenga uno de los roles autorizados
2. Busca en el menú lateral "Reporte Solicitud de Formación"
3. Haz clic y verifica que se muestra la tabla con todas las solicitudes
4. Prueba el botón "Exportar a Excel" para descargar el CSV

## Notas importantes:

- Los datos de **Porcentaje asignado** y **Monto beca** provienen de la tabla `parametros`
- Si una solicitud no tiene parámetros cargados, esos campos aparecerán vacíos
- El archivo exportado incluye todas las columnas con formato CSV compatible con Excel
- El nombre del archivo exportado incluye fecha y hora: `reporte_solicitudes_formacion_YYYYMMDD_HHMMSS.csv`
