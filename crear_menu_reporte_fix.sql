-- =====================================================
-- CREAR MENÚ REPORTE (VERSIÓN CORREGIDA)
-- =====================================================

-- 1. Obtener el ID del permiso y crear el menú
DO $$
DECLARE
  perm_id UUID;
BEGIN
  -- Obtener ID del permiso
  SELECT id INTO perm_id FROM permissions WHERE key = 'reportes.solicitudes.view';
  
  IF perm_id IS NULL THEN
    RAISE EXCEPTION 'Permiso reportes.solicitudes.view no encontrado';
  END IF;
  
  -- Crear el menú item
  INSERT INTO menu_items (id, label, label_es, icon, path, "order", permission_id, is_active)
  VALUES (
    'reporte-solicitudes-formacion',
    'Training Request Report',
    'Reporte Solicitud de Formación',
    'FileBarChart',
    '/reportes/solicitudes-formacion',
    5,
    perm_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    label_es = EXCLUDED.label_es,
    icon = EXCLUDED.icon,
    path = EXCLUDED.path,
    "order" = EXCLUDED."order",
    permission_id = EXCLUDED.permission_id,
    is_active = EXCLUDED.is_active;
    
  RAISE NOTICE 'Menú creado/actualizado exitosamente';
END $$;

-- 2. Verificar que se creó correctamente
SELECT 
    mi.id,
    mi.label_es as nombre,
    mi.path as ruta,
    mi.is_active as activo,
    p.key as permiso
FROM menu_items mi
LEFT JOIN permissions p ON mi.permission_id = p.id
WHERE mi.id = 'reporte-solicitudes-formacion';

-- 3. Ver todos los menús activos
SELECT 
    id,
    label_es,
    path,
    "order"
FROM menu_items
WHERE is_active = true
ORDER BY "order";
