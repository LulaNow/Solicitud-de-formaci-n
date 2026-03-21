# Test GridColumn Persistence

## Pasos para probar:

1. **Login al admin**: http://localhost:3000
2. **Ir a Formularios**: `/forms`
3. **Crear nuevo formulario**:
   - Nombre: "Test GridColumn"
   - Agregar 2 campos:
     - Campo 1: "Nombre" (TEXT) - **Ancho: 1/2 (Mitad)** ← gridColumn: 6
     - Campo 2: "Apellido" (TEXT) - **Ancho: 1/2 (Mitad)** ← gridColumn: 6
   - Guardar

4. **Editar el formulario recién creado**:
   - Verificar que los campos aparezcan lado a lado (2 columnas)
   - Verificar que el selector "Ancho del Campo" muestre "1/2 (Mitad)" seleccionado

5. **Publicar**:
   - Marcar ✅ "Formulario público"
   - Click botón verde "Publicar" (arriba derecha)
   - Copiar URL pública

6. **Abrir formulario público**:
   - Ir a `/f/test-gridcolumn`
   - Verificar que "Nombre" y "Apellido" aparezcan lado a lado (no uno debajo del otro)

## Verificación en código:

### Frontend (Edit Page)
- Modal tiene selector de ancho ✅
- `modalField.gridColumn` se actualiza ✅
- `saveField()` guarda en state ✅
- `handleSubmit()` envía `fields` con spread `...f` ✅

### Backend (Router)
- `fieldSchema` incluye `gridColumn: z.number().min(1).max(12).default(12)` ✅
- `update` mutation hace `createMany({ data: fields.map((f, i) => ({ ...f, formId: id }))` ✅

### Database
- Prisma schema tiene `gridColumn Int @default(12) @map("grid_column")` ✅
- `prisma db push` ejecutado ✅

### Posible problema:
- ¿El Prisma Client está desactualizado?
- ¿Hay algún middleware que esté filtrando el campo?
