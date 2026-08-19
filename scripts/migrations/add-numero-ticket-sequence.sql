-- =====================================================
-- Migración: Agregar secuencia para numero_ticket
-- Descripción: Crea una secuencia para generar números
--              de ticket automáticos con formato SF0000001
-- Fecha: 2026-06-25
-- =====================================================

-- Crear secuencia para numero_ticket si no existe
CREATE SEQUENCE IF NOT EXISTS solicitud_ticket_seq START WITH 1;

-- Establecer valor por defecto en la columna numero_ticket
-- Formato: SF + número de 7 dígitos con ceros a la izquierda
-- Ejemplo: SF0000001, SF0000002, etc.
ALTER TABLE solicitudes 
ALTER COLUMN numero_ticket SET DEFAULT ('SF' || LPAD(nextval('solicitud_ticket_seq')::text, 7, '0'));

-- Verificar que la secuencia se creó correctamente
SELECT 
    sequence_name, 
    start_value, 
    increment_by, 
    last_value 
FROM information_schema.sequences 
WHERE sequence_name = 'solicitud_ticket_seq';

-- Verificar el valor por defecto de la columna
SELECT 
    column_name, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'solicitudes' 
AND column_name = 'numero_ticket';

-- =====================================================
-- NOTAS:
-- - Esta migración es idempotente (puede ejecutarse múltiples veces)
-- - Si ya existen registros sin numero_ticket, se les puede asignar uno con:
--   UPDATE solicitudes SET numero_ticket = DEFAULT WHERE numero_ticket IS NULL;
-- - Para reiniciar la secuencia: ALTER SEQUENCE solicitud_ticket_seq RESTART WITH 1;
-- =====================================================
