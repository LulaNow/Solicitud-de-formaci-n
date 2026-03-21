# 🧪 INSTRUCCIONES DE PRUEBA - Formularios con Grid Layout

## 📋 PRUEBA 1: Crear Formulario con Layout 1/2

1. **Abrir**: http://localhost:3000
2. **Login** con tu usuario admin
3. **Ir a**: Menú → Formularios → **"+ Nuevo Formulario"**
4. **Llenar**:
   - Nombre: `Prueba Grid Layout`
   - Descripción: `Formulario de prueba para verificar gridColumn`
5. **Agregar Campo 1**:
   - Click "Agregar Campo"
   - Etiqueta: `Nombre`
   - Tipo: `Texto`
   - **Ancho del Campo**: Click en **"1/2 (Mitad)"** ← IMPORTANTE
   - Click "Agregar Campo"
6. **Agregar Campo 2**:
   - Click "Agregar Campo"
   - Etiqueta: `Apellido`
   - Tipo: `Texto`
   - **Ancho del Campo**: Click en **"1/2 (Mitad)"** ← IMPORTANTE
   - Click "Agregar Campo"
7. **Verificar en editor**:
   - ¿Los 2 campos aparecen lado a lado en "Fila 1"? ✅ / ❌
8. **Guardar**: Click "Crear Formulario"

---

## 📋 PRUEBA 2: Editar y Verificar Persistencia

1. **Ir a**: Formularios → Click en "Prueba Grid Layout"
2. **Verificar**:
   - ¿Los campos "Nombre" y "Apellido" aparecen lado a lado? ✅ / ❌
   - Click en ✏️ de "Nombre"
   - ¿El selector muestra "1/2 (Mitad)" seleccionado (azul)? ✅ / ❌
3. **Si NO está seleccionado**:
   - ❌ **BUG CONFIRMADO**: gridColumn no se guarda
   - Tomar screenshot y reportar

---

## 📋 PRUEBA 3: Publicar Formulario

1. **En la página de edición**:
   - ¿Ves el badge "📝 Borrador" arriba? ✅ / ❌
   - ¿Ves el botón verde "Publicar" arriba derecha? ✅ / ❌
2. **Marcar público**:
   - Scroll abajo a "Información Básica"
   - ✅ Check "Formulario público (no requiere autenticación)"
   - ¿Aparece recuadro verde con URL? ✅ / ❌
3. **Publicar**:
   - Click botón verde "Publicar" (arriba)
   - ¿El badge cambió a "✅ Publicado"? ✅ / ❌
   - ¿El botón "Publicar" desapareció? ✅ / ❌

---

## 📋 PRUEBA 4: Formulario Público

1. **Copiar URL** del recuadro verde (ej: `http://localhost:3000/f/prueba-grid-layout`)
2. **Abrir en ventana incógnito** o logout
3. **Verificar**:
   - ¿Los campos "Nombre" y "Apellido" aparecen lado a lado? ✅ / ❌
   - ¿O aparecen uno debajo del otro? ❌ (BUG)
4. **Llenar y enviar**:
   - Nombre: `Juan`
   - Apellido: `Pérez`
   - Click "Enviar Formulario"
   - ¿Muestra "✅ Formulario Enviado"? ✅ / ❌

---

## 📋 PRUEBA 5: Ver Peticiones en Admin

1. **Login nuevamente** como admin
2. **Ir a**: Menú → Peticiones (o Registros)
3. **Verificar**:
   - ¿Aparece la petición de "Juan Pérez"? ✅ / ❌

---

## 🐛 REPORTE DE BUGS

Si alguna prueba falla, reporta:

### Bug 1: GridColumn no se guarda
- **Síntoma**: Al editar, el selector muestra "Ancho Completo" en vez de "1/2"
- **Causa probable**: ???
- **Archivos a revisar**: 
  - `src/app/(portal)/forms/[id]/edit/page.tsx`
  - `src/server/routers/forms.ts`

### Bug 2: Botón Publicar no existe
- **Síntoma**: No hay botón verde "Publicar"
- **Causa probable**: Componente no renderiza
- **Archivo**: `src/app/(portal)/forms/[id]/edit/page.tsx:340-350`

### Bug 3: Grid layout no funciona en público
- **Síntoma**: Campos aparecen uno debajo del otro
- **Causa probable**: CSS grid no aplicado
- **Archivo**: `src/app/f/[slug]/page.tsx:141`

---

## ✅ RESULTADO ESPERADO

- ✅ Campos lado a lado en editor
- ✅ Campos lado a lado en formulario público
- ✅ Botón "Publicar" visible y funcional
- ✅ URL pública accesible sin login
- ✅ Peticiones guardadas en admin
