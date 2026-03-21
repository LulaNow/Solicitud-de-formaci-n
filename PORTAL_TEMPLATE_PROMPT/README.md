# 🎨 Portal Template - Documentación Completa

Esta carpeta contiene toda la documentación del **Portal Template Base** para proyectos futuros.

> 🔒 **IMPORTANTE**: Antes de modificar o generar código del portal, **LEER OBLIGATORIAMENTE** `SECURITY.md` para evitar vulnerabilidades de seguridad.

## 📁 Contenido

1. **PORTAL-TEMPLATE.md** - Estructura del portal público
2. **FORM-TEMPLATE.md** - Patrón completo de formularios con validaciones y n8n
3. **SECURITY.md** - 🔒 **CRÍTICO**: Guías de seguridad y pentesting results
4. **README.md** - Setup y configuración inicial del portal (este archivo)

---

## 🚀 Setup Inicial del Portal

### 1. Habilitar el Portal

El portal está deshabilitado por defecto. Para habilitarlo:

**Opción A: Via Script (Recomendado)**

```bash
npx tsx PORTAL_TEMPLATE_PROMPT/scripts/enable-portal.ts
```

**Opción B: Via Base de Datos**

```sql
INSERT INTO app_settings (key, value, type)
VALUES ('service_portal_enabled', 'true', 'boolean')
ON CONFLICT (key) DO UPDATE SET value = 'true';
```

**Opción C: Via Admin UI** (si existe panel de configuración)

1. Login como admin
2. Ir a Configuración → Portal
3. Activar "Portal Habilitado"

---

## 🎯 URLs del Portal

- **Portal Principal**: `http://localhost:3000/portal`
- **Formularios Públicos**: `http://localhost:3000/f/{slug}`
- **Ejemplo Incidentes**: `http://localhost:3000/f/reporte-incidentes`

---

## 🔧 Configuración del Portal

### Settings en Base de Datos

| Key | Value | Descripción |
|-----|-------|-------------|
| `service_portal_enabled` | `"true"` / `"false"` | Habilita/deshabilita el portal |
| `service_portal_maintenance_message` | Texto | Mensaje cuando está en mantenimiento |

### Ejemplo de Configuración

```typescript
// Habilitar portal
await prisma.appSetting.upsert({
  where: { key: "service_portal_enabled" },
  create: {
    key: "service_portal_enabled",
    value: "true",
    type: "boolean",
  },
  update: { value: "true" },
});

// Mensaje de mantenimiento (opcional)
await prisma.appSetting.upsert({
  where: { key: "service_portal_maintenance_message" },
  create: {
    key: "service_portal_maintenance_message",
    value: "El portal está temporalmente en mantenimiento. Volveremos pronto.",
    type: "string",
  },
  update: { value: "El portal está temporalmente en mantenimiento. Volveremos pronto." },
});
```

---

## 📊 Datos del Portal

### Categorías de Servicios

El portal muestra categorías dinámicas desde la BD:

```typescript
// Crear categoría
await prisma.serviceCategory.create({
  data: {
    name: "Materiales",
    icon: "📦",
    color: "#6366f1",
    order: 0,
  },
});
```

### Items/Servicios

```typescript
// Crear servicio
await prisma.serviceItem.create({
  data: {
    name: "Cemento Portland",
    slug: "cemento-portland",
    shortDescription: "Cemento de alta resistencia",
    categoryId: "...",
    isAvailable: true,
    icon: "🏗️",
    estimatedTime: "24-48 horas",
    price: "250.00",
  },
});
```

### Formularios Públicos

Los formularios con `isPublic: true` y `status: "PUBLISHED"` aparecen automáticamente en el portal.

---

## 🎨 Personalización

### Colores del Portal

Editar en `src/app/portal/page.tsx`:

```typescript
// Hero gradient
className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"

// Categorías seleccionadas
className="bg-gradient-to-br from-indigo-600 to-purple-600"

// Background general
className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
```

### Textos del Portal

```typescript
// Hero
<h1>Portal de Servicios</h1>
<p>Solicita materiales, equipos y servicios de forma rápida y sencilla</p>

// Footer
<p>Portal de Servicios • MDM Materiales © 2026</p>
```

---

## 🔐 Control de Acceso

### Portal Público vs Privado

**Público** (actual):
- Cualquiera puede ver el portal
- Solo formularios con `isPublic: true` son visibles
- No requiere login para ver catálogo

**Privado** (opcional):
- Requiere login para acceder
- Puede mostrar todos los formularios
- Control por roles

Para hacer el portal privado, cambiar en `src/app/portal/page.tsx`:

```typescript
// Agregar al inicio del componente
const { data: user } = trpc.auth.me.useQuery();

if (!user) {
  return <LoginRequired />;
}
```

---

## 📝 Checklist de Setup

- [ ] Ejecutar script de habilitación del portal
- [ ] Verificar que el portal carga en `/portal`
- [ ] Crear categorías de servicios (opcional)
- [ ] Crear items/servicios (opcional)
- [ ] Crear al menos 1 formulario público
- [ ] Publicar formulario (`status: PUBLISHED`, `isPublic: true`)
- [ ] Verificar que el formulario aparece en el portal
- [ ] Probar envío de formulario
- [ ] Configurar n8n webhook (si aplica)
- [ ] Personalizar colores y textos

---

## 🐛 Troubleshooting

### "Portal en Mantenimiento"

**Causa**: `service_portal_enabled` no existe o es `"false"`

**Solución**:
```bash
npx tsx PORTAL_TEMPLATE_PROMPT/scripts/enable-portal.ts
```

### "No se encontraron resultados" en servicios

**Causa**: No hay categorías o items en la BD

**Solución**:
- Crear categorías y servicios desde admin UI
- O ejecutar seed script (si existe)

### Formularios no aparecen en el portal

**Causa**: Formulario no está publicado o no es público

**Solución**:
1. Editar formulario en `/forms/{id}/edit`
2. Marcar ✅ "Formulario público"
3. Click botón "Publicar"

### Error 404 en formulario público

**Causa**: Formulario no tiene `status: PUBLISHED`

**Solución**: Publicar desde admin UI

---

## 🚀 Próximos Pasos

1. ✅ Portal habilitado
2. ✅ Formulario de ejemplo creado
3. 📝 Crear más formularios según necesidad
4. 🎨 Personalizar diseño y colores
5. 📊 Agregar categorías y servicios
6. 🔗 Configurar webhooks n8n
7. 📧 Configurar notificaciones
8. 🧪 Testing end-to-end

---

**Última actualización**: 2026-03-21
**Versión**: 1.0.0
**Soporte**: Consultar documentación en esta carpeta
