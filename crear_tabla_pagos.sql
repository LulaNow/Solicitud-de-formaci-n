-- =====================================================
-- CREAR TABLA pagos_solicitud
-- EJECUTAR EN pgAdmin - Base de datos: Becas
-- =====================================================

-- 1. Crear la tabla
CREATE TABLE IF NOT EXISTS pagos_solicitud (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    numero_pago INTEGER NOT NULL,
    periodo_pago VARCHAR(100),
    fecha_pago DATE,
    concepto VARCHAR(255),
    costo_programa DECIMAL(12, 2),
    pago DECIMAL(12, 2),
    pago_empleado DECIMAL(12, 2),
    numero_pagare VARCHAR(100),
    file_name VARCHAR(255),
    content_type VARCHAR(100),
    size_bytes INTEGER,
    hash VARCHAR(64),
    file_path VARCHAR(500),
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- 2. Crear índice para buscar por solicitud_id
CREATE INDEX IF NOT EXISTS idx_pagos_solicitud_solicitud_id
    ON pagos_solicitud(solicitud_id);

-- 3. Verificar que se creó correctamente
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pagos_solicitud'
ORDER BY ordinal_position;

-- =====================================================
-- RESULTADO ESPERADO:
-- Debe mostrar las columnas: id, solicitud_id, numero_pago,
-- periodo_pago, fecha_pago, concepto, costo_programa, pago,
-- pago_empleado, numero_pagare, file_name, content_type,
-- size_bytes, hash, file_path, created_at, updated_at
-- =====================================================
