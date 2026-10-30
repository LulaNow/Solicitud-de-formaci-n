-- =====================================================
-- MIGRAR TABLA pagos_solicitud A NUEVAS COLUMNAS
-- EJECUTAR EN pgAdmin - Base de datos: Becas
-- =====================================================

-- 1. Renombrar columnas existentes
ALTER TABLE pagos_solicitud RENAME COLUMN fecha_pago TO fecha_programada;
ALTER TABLE pagos_solicitud RENAME COLUMN costo_programa TO programa;
ALTER TABLE pagos_solicitud RENAME COLUMN pago TO pago_beca;
ALTER TABLE pagos_solicitud RENAME COLUMN numero_pagare TO pagare;

-- 2. Eliminar columnas que ya no se usan
ALTER TABLE pagos_solicitud DROP COLUMN periodo_pago;
ALTER TABLE pagos_solicitud DROP COLUMN concepto;

-- 3. Ajustar tipo de pagare
ALTER TABLE pagos_solicitud ALTER COLUMN pagare TYPE VARCHAR(150);

-- 4. Agregar nuevas columnas
ALTER TABLE pagos_solicitud ADD COLUMN estatus_pago VARCHAR(100);
ALTER TABLE pagos_solicitud ADD COLUMN factura VARCHAR(150);
ALTER TABLE pagos_solicitud ADD COLUMN monto_factura DECIMAL(12, 2);
ALTER TABLE pagos_solicitud ADD COLUMN observaciones TEXT;
ALTER TABLE pagos_solicitud ADD COLUMN calificaciones TEXT;

-- 5. Verificar estructura final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pagos_solicitud'
ORDER BY ordinal_position;

-- =====================================================
-- RESULTADO ESPERADO:
-- id, solicitud_id, numero_pago, fecha_programada,
-- programa, pago_beca, pago_empleado, estatus_pago,
-- pagare, factura, monto_factura, observaciones,
-- calificaciones, file_name, content_type, size_bytes,
-- hash, file_path, created_at, updated_at
-- =====================================================
