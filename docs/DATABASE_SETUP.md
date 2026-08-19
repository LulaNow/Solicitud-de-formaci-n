# Configuración de Base de Datos

Este documento describe los pasos necesarios para configurar la base de datos del sistema desde cero.

## Requisitos Previos

- PostgreSQL 14 o superior instalado
- Acceso a la base de datos con permisos de administrador
- Node.js y npm instalados

## Pasos de Configuración

### 1. Crear la Base de Datos

```sql
CREATE DATABASE nadro_portal;
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nadro_portal"
```

### 3. Ejecutar Migraciones de Prisma

```bash
npx prisma migrate dev
```

### 4. Generar Cliente de Prisma

```bash
npx prisma generate
```

### 5. Ejecutar Migraciones Personalizadas

#### 5.1 Secuencia para Número de Ticket

Esta migración crea una secuencia automática para generar números de ticket con formato `SF0000001`.

**Opción A: Ejecutar script TypeScript (Recomendado)**

```bash
npx tsx scripts/migrations/add-numero-ticket-sequence.ts
```

**Opción B: Ejecutar SQL directamente**

```bash
psql -U usuario -d nadro_portal -f scripts/migrations/add-numero-ticket-sequence.sql
```

**SQL Manual:**

```sql
-- Crear secuencia para numero_ticket
CREATE SEQUENCE IF NOT EXISTS solicitud_ticket_seq START WITH 1;

-- Establecer valor por defecto en la columna numero_ticket
ALTER TABLE solicitudes 
ALTER COLUMN numero_ticket SET DEFAULT ('SF' || LPAD(nextval('solicitud_ticket_seq')::text, 7, '0'));

-- Actualizar registros existentes sin numero_ticket
UPDATE solicitudes 
SET numero_ticket = DEFAULT 
WHERE numero_ticket IS NULL;
```

#### 5.2 Agregar Columna tipo_tarea

```bash
npx tsx scripts/add-tipo-tarea.ts
```

#### 5.3 Agregar CDR Corporativo

```bash
npx tsx scripts/add-cdr-corporativo.ts
```

### 6. Poblar Datos Iniciales (Opcional)

#### Actualizar Gerentes de CDR

```bash
npx tsx scripts/update-cdrs-gerentes.ts
```

## Verificación

### Verificar Secuencia de Tickets

```sql
-- Ver información de la secuencia
SELECT * FROM information_schema.sequences WHERE sequence_name = 'solicitud_ticket_seq';

-- Ver valor por defecto de la columna
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'solicitudes' AND column_name = 'numero_ticket';

-- Probar creación de ticket
INSERT INTO solicitudes (usuario_id, tipo_proceso, estado, datos_entrada)
VALUES ('test-user-id', 'TEST', 'abierto', '{}')
RETURNING numero_ticket;
```

### Verificar Tablas Principales

```sql
-- Listar todas las tablas
\dt

-- Ver estructura de tabla solicitudes
\d solicitudes

-- Ver estructura de tabla tareas_flujo
\d tareas_flujo
```

## Mantenimiento

### Reiniciar Secuencia de Tickets

Si necesitas reiniciar la secuencia (por ejemplo, en ambiente de desarrollo):

```sql
ALTER SEQUENCE solicitud_ticket_seq RESTART WITH 1;
```

### Backup de Base de Datos

```bash
pg_dump -U usuario nadro_portal > backup_$(date +%Y%m%d).sql
```

### Restaurar desde Backup

```bash
psql -U usuario nadro_portal < backup_20260625.sql
```

## Troubleshooting

### Error: "sequence already exists"

Este error es normal si ejecutas la migración múltiples veces. La migración es idempotente y puede ejecutarse sin problemas.

### Error: "permission denied"

Asegúrate de que el usuario de la base de datos tenga permisos suficientes:

```sql
GRANT ALL PRIVILEGES ON DATABASE nadro_portal TO usuario;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO usuario;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO usuario;
```

### Números de Ticket Duplicados

Si encuentras duplicados, puedes resetear la secuencia al valor máximo actual:

```sql
SELECT setval('solicitud_ticket_seq', 
  (SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ticket FROM 3) AS INTEGER)), 0) 
   FROM solicitudes WHERE numero_ticket LIKE 'SF%')
);
```

## Estructura de Archivos

```
scripts/
├── migrations/
│   ├── add-numero-ticket-sequence.sql    # SQL puro
│   └── add-numero-ticket-sequence.ts     # Script TypeScript
├── add-tipo-tarea.ts
├── add-cdr-corporativo.ts
└── update-cdrs-gerentes.ts

docs/
└── DATABASE_SETUP.md                      # Este archivo
```

## Notas Importantes

1. **Secuencia de Tickets**: El formato es `SF` + 7 dígitos con ceros a la izquierda (ej: `SF0000001`)
2. **Idempotencia**: Todas las migraciones pueden ejecutarse múltiples veces sin causar errores
3. **Orden de Ejecución**: Ejecutar las migraciones en el orden listado en este documento
4. **Ambiente de Producción**: Siempre hacer backup antes de ejecutar migraciones en producción

## Referencias

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Sequences](https://www.postgresql.org/docs/current/sql-createsequence.html)
- [PostgreSQL LPAD Function](https://www.postgresql.org/docs/current/functions-string.html)
