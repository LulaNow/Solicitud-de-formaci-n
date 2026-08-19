-- =====================================================
-- VERIFICAR Y CORREGIR ROLES Y MENÚ
-- =====================================================

-- 1. Ver qué roles existen
SELECT id, name FROM roles ORDER BY name;

-- 2. Ver si el permiso existe
SELECT id, key, name FROM permissions WHERE key = 'reportes.solicitudes.view';

-- 3. Ver qué roles tienen el permiso asignado
SELECT 
    r.name as rol,
    p.key as permiso
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.key = 'reportes.solicitudes.view';

-- 4. Ver el menú creado
SELECT 
    id,
    label_es,
    path,
    is_active
FROM menu_items
WHERE id = 'reporte-solicitudes-formacion';

-- 5. Ver el usuario actual y sus roles
SELECT 
    u.username,
    u.email,
    r.name as rol
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'ileana.lucely.ruiz.carrillo@nadro.com.mx';

-- =====================================================
-- Si "Resolutor de tarea" no aparece en los roles,
-- ejecuta este bloque para crearlo:
-- =====================================================

-- DESCOMENTAR SI ES NECESARIO:
/*
-- Crear rol Resolutor de tarea
INSERT INTO roles (id, name, description, is_system, is_active)
VALUES (
    gen_random_uuid(),
    'Resolutor de tarea',
    'Usuario que puede resolver tareas asignadas',
    false,
    true
)
ON CONFLICT (name) DO NOTHING;

-- Asignar permiso al rol
DO $$
DECLARE
  perm_id UUID;
  role_id TEXT;
BEGIN
  SELECT id INTO perm_id FROM permissions WHERE key = 'reportes.solicitudes.view';
  SELECT id INTO role_id FROM roles WHERE name = 'Resolutor de tarea';
  
  IF perm_id IS NOT NULL AND role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (role_id, perm_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
*/
