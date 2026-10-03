-- =====================================================
-- CREAR TABLA archivos_solicitud
-- EJECUTAR EN pgAdmin - Base de datos: Becas
-- =====================================================

-- 1. Crear la tabla
CREATE TABLE IF NOT EXISTS archivos_solicitud (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    hash VARCHAR(64) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- 2. Crear índice para buscar por solicitud_id
CREATE INDEX IF NOT EXISTS idx_archivos_solicitud_solicitud_id 
    ON archivos_solicitud(solicitud_id);

-- 3. Crear índice único para evitar duplicados (mismo hash por solicitud)
CREATE UNIQUE INDEX IF NOT EXISTS idx_archivos_solicitud_hash 
    ON archivos_solicitud(solicitud_id, hash);

-- 4. Verificar que se creó correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'archivos_solicitud'
ORDER BY ordinal_position;

-- =====================================================
-- RESULTADO ESPERADO:
-- Debe mostrar las columnas: id, solicitud_id, file_name,
-- content_type, size_bytes, hash, file_path, created_at
-- =====================================================
