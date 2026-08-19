# Nuevas Tablas: CDRs y Grupos de Asignación

## Resumen

Se han creado exitosamente dos nuevas tablas en la base de datos PostgreSQL:

1. **cdrs** - Tabla para gestionar CDRs (Centros de Responsabilidad)
2. **grupos_asignacion** - Tabla para gestionar grupos de asignación de usuarios

## Estructura de las Tablas

### Tabla: `cdrs`

| Campo                     | Tipo      | Descripción                          |
|---------------------------|-----------|--------------------------------------|
| `id`                      | TEXT      | Identificador único (PK)             |
| `nombre`                  | TEXT      | Nombre del CDR                       |
| `valor`                   | TEXT      | Valor del CDR                        |
| `gerente_talento_cultura` | TEXT      | Gerente de Talento y Cultura         |
| `gerente_cdr`             | TEXT      | Gerente del CDR                      |
| `created_at`              | TIMESTAMP | Fecha de creación                    |
| `updated_at`              | TIMESTAMP | Fecha de última actualización        |

**Nombre en base de datos:** `cdrs`

### Tabla: `grupos_asignacion`

| Campo        | Tipo      | Descripción                          |
|--------------|-----------|--------------------------------------|
| `id`         | TEXT      | Identificador único (PK)             |
| `nombre`     | TEXT      | Nombre del grupo                     |
| `usuario`    | TEXT      | Usuario asignado                     |
| `created_at` | TIMESTAMP | Fecha de creación                    |
| `updated_at` | TIMESTAMP | Fecha de última actualización        |

**Nombre en base de datos:** `grupos_asignacion`

## Modelos de Prisma

Los modelos han sido agregados al archivo `prisma/schema.prisma`:

```prisma
model Cdr {
  id                     String   @id @default(cuid())
  nombre                 String
  valor                  String
  gerenteTalentoCultura  String   @map("gerente_talento_cultura")
  gerenteCdr             String   @map("gerente_cdr")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")

  @@map("cdrs")
}

model GrupoAsignacion {
  id        String   @id @default(cuid())
  nombre    String
  usuario   String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("grupos_asignacion")
}
```

## Uso en el Código

### Importar Prisma Client

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

### Crear un CDR

```typescript
const cdr = await prisma.cdr.create({
  data: {
    nombre: 'CDR Ejemplo',
    valor: 'VALOR001',
    gerenteTalentoCultura: 'Juan Pérez',
    gerenteCdr: 'María García',
  },
});
```

### Crear un Grupo de Asignación

```typescript
const grupo = await prisma.grupoAsignacion.create({
  data: {
    nombre: 'Grupo A',
    usuario: 'usuario@ejemplo.com',
  },
});
```

### Consultar CDRs

```typescript
// Obtener todos los CDRs
const cdrs = await prisma.cdr.findMany();

// Buscar un CDR específico
const cdr = await prisma.cdr.findUnique({
  where: { id: 'cdr-id' },
});

// Buscar CDRs por gerente
const cdrsPorGerente = await prisma.cdr.findMany({
  where: {
    gerenteCdr: 'María García',
  },
});
```

### Consultar Grupos de Asignación

```typescript
// Obtener todos los grupos
const grupos = await prisma.grupoAsignacion.findMany();

// Buscar grupos por usuario
const gruposPorUsuario = await prisma.grupoAsignacion.findMany({
  where: {
    usuario: 'usuario@ejemplo.com',
  },
});
```

### Actualizar Registros

```typescript
// Actualizar un CDR
const cdrActualizado = await prisma.cdr.update({
  where: { id: 'cdr-id' },
  data: {
    gerenteCdr: 'Nuevo Gerente',
  },
});

// Actualizar un grupo
const grupoActualizado = await prisma.grupoAsignacion.update({
  where: { id: 'grupo-id' },
  data: {
    nombre: 'Nuevo Nombre',
  },
});
```

### Eliminar Registros

```typescript
// Eliminar un CDR
await prisma.cdr.delete({
  where: { id: 'cdr-id' },
});

// Eliminar un grupo
await prisma.grupoAsignacion.delete({
  where: { id: 'grupo-id' },
});
```

## Scripts Disponibles

Se han creado varios scripts útiles en la carpeta `scripts/`:

1. **`create-tables-pg.ts`** - Script para crear las tablas en la base de datos
2. **`verify-tables.ts`** - Script para verificar la estructura de las tablas
3. **`example-usage-new-tables.ts`** - Ejemplo de uso de las nuevas tablas

### Ejecutar los Scripts

```bash
# Crear las tablas (ya ejecutado)
npx tsx scripts/create-tables-pg.ts

# Verificar las tablas
npx tsx scripts/verify-tables.ts

# Ejecutar ejemplo de uso
npx tsx scripts/example-usage-new-tables.ts
```

## Notas Importantes

1. **IDs Automáticos**: Los IDs se generan automáticamente usando `cuid()` al crear nuevos registros.
2. **Timestamps**: Los campos `created_at` y `updated_at` se gestionan automáticamente por Prisma.
3. **Validación**: Todos los campos de texto son obligatorios (NOT NULL).
4. **Cliente de Prisma**: El cliente de Prisma ha sido regenerado para incluir las nuevas tablas.

## Próximos Pasos

Para usar estas tablas en tu aplicación:

1. Importa `PrismaClient` en tus archivos
2. Usa los métodos de Prisma para interactuar con las tablas
3. Considera agregar validaciones adicionales en tu lógica de negocio
4. Implementa endpoints API si necesitas exponer estas tablas a través de tu aplicación

## Soporte

Si necesitas agregar más campos o modificar la estructura de las tablas:

1. Edita el archivo `prisma/schema.prisma`
2. Ejecuta `npx prisma generate` para actualizar el cliente
3. Crea una migración o usa `npx prisma db push` para actualizar la base de datos
