-- Agregar columna tipo_tarea a la tabla tareas_flujo
ALTER TABLE tareas_flujo 
ADD COLUMN IF NOT EXISTS tipo_tarea VARCHAR(50);

-- Clasificar registros existentes
-- Si nombre_tarea contiene "Solicitud de aprobación" -> "Aprobación"
-- Si no -> "Tarea"
UPDATE tareas_flujo
SET tipo_tarea = CASE 
  WHEN nombre_tarea ILIKE '%Solicitud de aprobación%' THEN 'Aprobación'
  ELSE 'Tarea'
END
WHERE tipo_tarea IS NULL;

-- Verificar resultados
SELECT 
  tipo_tarea,
  COUNT(*) as cantidad,
  STRING_AGG(DISTINCT nombre_tarea, ', ') as ejemplos_nombres
FROM tareas_flujo
GROUP BY tipo_tarea
ORDER BY tipo_tarea;
