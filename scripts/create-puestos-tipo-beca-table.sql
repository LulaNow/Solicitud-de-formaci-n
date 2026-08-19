-- Crear tabla puestos_tipo_beca
CREATE TABLE IF NOT EXISTS puestos_tipo_beca (
  id VARCHAR(255) PRIMARY KEY,
  puesto VARCHAR(255) NOT NULL,
  tipo_beca VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas por puesto
CREATE INDEX IF NOT EXISTS idx_puestos_tipo_beca_puesto ON puestos_tipo_beca(puesto);

-- Comentario de la tabla
COMMENT ON TABLE puestos_tipo_beca IS 'Tabla que relaciona puestos con tipos de beca';
