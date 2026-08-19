-- =====================================================
-- CORREGIR PERMISOS DEL REPORTE
-- Asignar a los roles que SÍ existen
-- =====================================================

-- 1. Asignar permiso a Usuario Interno (resolutores de tareas)
DO $$
DECLARE
  perm_id UUID;
  role_record RECORD;
BEGIN
  -- Obtener ID del permiso
  SELECT id INTO perm_id FROM permissions WHERE key = 'reportes.solicitudes.view';
  
  -- Asignar permiso a Administrador y Usuario Interno
  FOR role_record IN 
    SELECT id FROM roles 
    WHERE name IN ('Administrador', 'Usuario Interno')
  LOOP
    IF perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (role_record.id, perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
      
      RAISE NOTICE 'Permiso asignado al rol ID: %', role_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Permisos actualizados correctamente';
END $$;

-- 2. Verificar que se asignaron correctamente
SELECT 
    r.name as rol,
    p.key as permiso,
    p.name as nombre_permiso
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.key = 'reportes.solicitudes.view'
ORDER BY r.name;

-- =====================================================
-- RESULTADO ESPERADO:
-- Debe mostrar:
-- - Administrador | reportes.solicitudes.view
-- - Usuario Interno | reportes.solicitudes.view
-- =====================================================
