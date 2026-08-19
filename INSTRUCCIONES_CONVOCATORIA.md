# Instrucciones para agregar columna CONVOCATORIA

## Pasos a seguir:

### 1. Detener el servidor de desarrollo
```powershell
Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*npm*" } | Stop-Process -Force
```

### 2. Ejecutar el script SQL
Abre pgAdmin o tu cliente PostgreSQL favorito y ejecuta el archivo:
```
add_convocatoria_column.sql
```

O ejecuta directamente este SQL:
```sql
-- Agregar columna convocatoria a la tabla solicitudes
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS convocatoria VARCHAR(4);

-- Actualizar registros existentes con el año actual
UPDATE solicitudes 
SET convocatoria = EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR 
WHERE convocatoria IS NULL;
```

### 3. Regenerar el cliente de Prisma
```powershell
npx prisma generate
```

### 4. Reiniciar el servidor
```powershell
npm run dev
```

## ¿Qué hace este cambio?

1. **Columna nueva**: Se agrega `convocatoria` (VARCHAR(4)) a la tabla `solicitudes`
2. **Valor por defecto**: Todas las solicitudes nuevas tendrán el año actual (ej: "2025")
3. **Registros existentes**: Se actualizan con el año actual
4. **Payload a n8n**: Ahora incluye el campo `convocatoria` automáticamente

## Archivos modificados:

- `prisma/schema.prisma` - Modelo Solicitud actualizado
- `src/lib/services/n8n-service.ts` - Payload incluye convocatoria
- `add_convocatoria_column.sql` - Script SQL para ejecutar

## Verificación:

Después de aplicar los cambios, verifica que:
1. La columna existe en la tabla: `SELECT convocatoria FROM solicitudes LIMIT 1;`
2. Las nuevas solicitudes tienen el año actual
3. El payload enviado a n8n incluye el campo `convocatoria`
