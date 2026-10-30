-- =====================================================
-- AGREGAR COLUMNA reembolso_nadro A solicitudes
-- Guarda el reembolso capturado en la Tabla de Pagos
-- EJECUTAR EN pgAdmin - Base de datos: Becas
-- =====================================================

ALTER TABLE solicitudes
ADD COLUMN IF NOT EXISTS reembolso_nadro DECIMAL(12, 2);

-- Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'solicitudes' AND column_name = 'reembolso_nadro';
