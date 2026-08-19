# Migraciones de Base de Datos

Este documento lista todas las migraciones personalizadas que deben ejecutarse para configurar correctamente la base de datos.

## Orden de Ejecución

Las migraciones deben ejecutarse en el siguiente orden después de ejecutar `npx prisma migrate dev`:

### 1. Secuencia para Número de Ticket ✅

**Descripción**: Crea una secuencia automática para generar números de ticket con formato `SF0000001`.

**Archivo**: `scripts/migrations/execute-numero-ticket-migration.ts`

**Comando**:
```bash
npx tsx scripts/migrations/execute-numero-ticket-migration.ts
```

**SQL Equivalente**:
```sql
CREATE SEQUENCE IF NOT EXISTS solicitud_ticket_seq START WITH 1;

ALTER TABLE solicitudes
ALTER COLUMN numero_ticket SET DEFAULT ('SF' || LPAD(nextval('solicitud_ticket_seq')::text, 7, '0'));

UPDATE solicitudes
SET numero_ticket = ('SF' || LPAD(nextval('solicitud_ticket_seq')::text, 7, '0'))
WHERE numero_ticket IS NULL;
```

**Resultado Esperado**:
- Secuencia creada: `solicitud_ticket_seq`
- Formato de tickets: `SF0000001`, `SF0000002`, etc.
- Registros existentes actualizados con números de ticket

---

### 2. Columna tipo_tarea

**Descripción**: Agrega la columna `tipo_tarea` a la tabla `tareas_flujo` para clasificar tareas.

**Archivo**: `scripts/add-tipo-tarea.ts`

**Comando**:
```bash
npx tsx scripts/add-tipo-tarea.ts
```

**Valores**:
- `"Tarea"` - Tareas normales
- `"Aprobación"` - Solicitudes de aprobación

---

### 3. CDR Corporativo

**Descripción**: Agrega el CDR "1000 - CORPORATIVO" a la tabla `cdrs`.

**Archivo**: `scripts/add-cdr-corporativo.ts`

**Comando**:
```bash
npx tsx scripts/add-cdr-corporativo.ts
```

---

### 4. Tabla de Parámetros

**Descripción**: Crea la tabla `parametros` para almacenar los parámetros de becas con cálculos de porcentajes y montos.

**Archivo**: `scripts/migrations/create-parametros-table.ts`

**Comando**:
```bash
npx tsx scripts/migrations/create-parametros-table.ts
```

**Estructura de la tabla**:
- `id` (UUID) - Identificador único
- `numero_ticket` (VARCHAR) - Número de ticket de la solicitud
- `json_parametros` (JSONB) - Array de parámetros con nombre, porcentaje, cumple, no_cumple
- `porcentaje_asignado` (DECIMAL) - Suma total de porcentajes
- `monto_beca` (DECIMAL) - Monto calculado de la beca
- `created_at`, `updated_at` (TIMESTAMPTZ) - Timestamps

**Ejemplo de json_parametros**:
```json
[
  {
    "nombre": "Antigüedad",
    "porcentaje_asignado": 10,
    "cumple": true,
    "no_cumple": false
  },
  {
    "nombre": "Curso PID",
    "porcentaje_asignado": 5,
    "cumple": true,
    "no_cumple": false
  }
]
```

---

### 5. Actualizar Gerentes de CDR (Opcional)

**Descripción**: Actualiza los correos de gerentes para CDRs existentes (solo para desarrollo/pruebas).

**Archivo**: `scripts/update-cdrs-gerentes.ts`

**Comando**:
```bash
npx tsx scripts/update-cdrs-gerentes.ts
```

---

## Verificación

### Verificar Secuencia de Tickets

```sql
-- Ver el último valor de la secuencia
SELECT last_value FROM solicitud_ticket_seq;

-- Ver tickets generados
SELECT id, numero_ticket, tipo_proceso, created_at
FROM solicitudes
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar tipo_tarea

```sql
-- Ver distribución de tipos de tarea
SELECT tipo_tarea, COUNT(*)
FROM tareas_flujo
GROUP BY tipo_tarea;
```

### Verificar CDRs

```sql
-- Ver todos los CDRs
SELECT valor, nombre, gerente_cdr
FROM cdrs
ORDER BY valor;
```

---

## Rollback

### Revertir Secuencia de Tickets

```sql
-- Eliminar valor por defecto
ALTER TABLE solicitudes ALTER COLUMN numero_ticket DROP DEFAULT;

-- Eliminar secuencia
DROP SEQUENCE IF EXISTS solicitud_ticket_seq;

-- Limpiar números de ticket (opcional)
UPDATE solicitudes SET numero_ticket = NULL;
```

### Revertir tipo_tarea

```sql
ALTER TABLE tareas_flujo DROP COLUMN IF EXISTS tipo_tarea;
```

---

## Notas Importantes

1. **Idempotencia**: Todas las migraciones son idempotentes y pueden ejecutarse múltiples veces sin causar errores.

2. **Orden**: Es importante ejecutar las migraciones en el orden especificado.

3. **Backup**: Siempre hacer backup de la base de datos antes de ejecutar migraciones en producción:
   ```bash
   pg_dump -U usuario nadro_portal > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Ambiente**: Estas migraciones están diseñadas para PostgreSQL 14+.

---

## Troubleshooting

### Error: "sequence already exists"

✅ **Normal** - La migración es idempotente. Continúa con normalidad.

### Error: "permission denied"

❌ **Solución**: Otorgar permisos necesarios:
```sql
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO usuario;
```

### Números de ticket duplicados

❌ **Solución**: Resetear secuencia al máximo actual:
```sql
SELECT setval('solicitud_ticket_seq',
  (SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ticket FROM 3) AS INTEGER)), 0)
   FROM solicitudes WHERE numero_ticket LIKE 'SF%')
);
```

---

## Historial de Migraciones

| Fecha | Migración | Descripción | Estado |
|-------|-----------|-------------|--------|
| 2026-06-25 | Tabla parametros | Almacenamiento de parámetros de becas con cálculos | ✅ Ejecutada |
| 2026-06-25 | Secuencia numero_ticket | Generación automática de tickets SF0000XXX | ✅ Ejecutada |
| 2026-06-24 | Columna tipo_tarea | Clasificación de tareas (Tarea/Aprobación) | ✅ Ejecutada |
| 2026-06-23 | CDR Corporativo | Agregar CDR 1000 - CORPORATIVO | ✅ Ejecutada |

---

## Referencias

- [Documentación de Configuración de BD](./DATABASE_SETUP.md)
- [Integración con n8n](./N8N_INTEGRATION.md)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
