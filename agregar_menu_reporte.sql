-- =====================================================
-- AGREGAR MENÚ: Reporte Solicitud de Formación
-- EJECUTAR EN pgAdmin - Base de datos: Becas
-- =====================================================

-- 1. Crear permiso para el reporte (si no existe)
INSERT INTO permissions (id, name, key, module, action)
VALUES (
  gen_random_uuid(),
  'Ver Reporte Solicitudes',
  'reportes.solicitudes.view',
  'Reportes',
  'view'
)
ON CONFLICT (key) DO NOTHING;

-- 2. Asignar permiso a los roles autorizados
DO $$
DECLARE
  perm_id UUID;
  role_record RECORD;
BEGIN
  -- Obtener ID del permiso
  SELECT id INTO perm_id FROM permissions WHERE key = 'reportes.solicitudes.view';

  -- Asignar permiso a Administrador, Resolutor de tarea y Aprobador
  FOR role_record IN
    SELECT id FROM roles
    WHERE name IN ('Administrador', 'Resolutor de tarea', 'Aprobador')
  LOOP
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (role_record.id, perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;

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

  RAISE NOTICE 'Menú creado exitosamente';
END $$;

-- 3. Verificar que se creó correctamente
SELECT
  mi.id,
  mi.label_es as nombre,
  mi.path as ruta,
  p.key as permiso
FROM menu_items mi
LEFT JOIN permissions p ON mi.permission_id = p.id
WHERE mi.id = 'reporte-solicitudes-formacion';

-- =====================================================
-- RESULTADO ESPERADO:
-- Debe mostrar el menú "Reporte Solicitud de Formación"
-- con la ruta "/reportes/solicitudes-formacion"
-- =====================================================
