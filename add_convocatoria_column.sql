-- Agregar columna convocatoria a la tabla solicitudes
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS convocatoria VARCHAR(4);

-- Actualizar registros existentes con el año actual
UPDATE solicitudes 
SET convocatoria = EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR 
WHERE convocatoria IS NULL;

-- Comentario: Esta columna almacenará el año de la convocatoria (ej: "2025")
