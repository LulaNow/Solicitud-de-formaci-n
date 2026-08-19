-- Script para agregar el menú "Crear solicitud de formación" al sidebar
-- Ejecutar este script en la base de datos PostgreSQL

-- Primero, buscar el menú padre "Peticiones" o crearlo si no existe
DO $$
DECLARE
    v_parent_menu_id TEXT;
    v_new_menu_id TEXT;
BEGIN
    -- Buscar el menú padre "Peticiones"
    SELECT id INTO v_parent_menu_id
    FROM "Menu"
    WHERE label = 'Requests' OR "labelEs" = 'Peticiones'
    LIMIT 1;

    -- Si no existe el menú padre, crearlo
    IF v_parent_menu_id IS NULL THEN
        INSERT INTO "Menu" (id, label, "labelEs", icon, path, "parentId", "order", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid()::TEXT,
            'Requests',
            'Peticiones',
            'Inbox',
            NULL,
            NULL,
            2,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_parent_menu_id;
        
        RAISE NOTICE 'Menú padre "Peticiones" creado con ID: %', v_parent_menu_id;
    ELSE
        RAISE NOTICE 'Menú padre "Peticiones" encontrado con ID: %', v_parent_menu_id;
    END IF;

    -- Verificar si ya existe el menú "Crear solicitud de formación"
    SELECT id INTO v_new_menu_id
    FROM "Menu"
    WHERE "labelEs" = 'Crear solicitud de formación'
    LIMIT 1;

    -- Si no existe, crearlo
    IF v_new_menu_id IS NULL THEN
        INSERT INTO "Menu" (id, label, "labelEs", icon, path, "parentId", "order", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid()::TEXT,
            'New Training Request',
            'Crear solicitud de formación',
            'FileText',
            '/requests/training/new',
            v_parent_menu_id,
            1,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_new_menu_id;
        
        RAISE NOTICE 'Menú "Crear solicitud de formación" creado con ID: %', v_new_menu_id;
    ELSE
        RAISE NOTICE 'Menú "Crear solicitud de formación" ya existe con ID: %', v_new_menu_id;
    END IF;

    -- Asignar el menú a todos los roles (opcional, ajustar según necesidad)
    -- Puedes comentar esta sección si quieres asignarlo manualmente
    INSERT INTO "MenuRole" ("menuId", "roleId", "createdAt", "updatedAt")
    SELECT v_new_menu_id, r.id, NOW(), NOW()
    FROM "Role" r
    WHERE NOT EXISTS (
        SELECT 1 FROM "MenuRole" mr
        WHERE mr."menuId" = v_new_menu_id AND mr."roleId" = r.id
    );

    RAISE NOTICE 'Menú asignado a todos los roles';

END $$;

-- Verificar que se creó correctamente
SELECT 
    m.id,
    m.label,
    m."labelEs",
    m.icon,
    m.path,
    m."parentId",
    m."order",
    p.label AS "parentLabel",
    p."labelEs" AS "parentLabelEs"
FROM "Menu" m
LEFT JOIN "Menu" p ON m."parentId" = p.id
WHERE m."labelEs" = 'Crear solicitud de formación';
