-- =====================================================
-- EJECUTAR ESTE SCRIPT EN pgAdmin
-- Base de datos: Becas
-- =====================================================

-- 1. Agregar columna convocatoria a la tabla solicitudes
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS convocatoria VARCHAR(4);

-- 2. Actualizar registros existentes con el año actual
UPDATE solicitudes 
SET convocatoria = EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR 
WHERE convocatoria IS NULL;

-- 3. Verificar que se agregó correctamente
SELECT 
    COUNT(*) as total_solicitudes,
    COUNT(convocatoria) as con_convocatoria,
    COUNT(*) - COUNT(convocatoria) as sin_convocatoria
FROM solicitudes;

-- 4. Ver algunas solicitudes con la nueva columna
SELECT 
    numero_ticket,
    convocatoria,
    estado,
    created_at
FROM solicitudes
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- RESULTADO ESPERADO:
-- - Todas las solicitudes deben tener convocatoria
-- - El valor debe ser el año actual (ej: "2025")
-- =====================================================
