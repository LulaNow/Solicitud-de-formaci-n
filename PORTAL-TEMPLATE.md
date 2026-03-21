# 🎨 Portal Template - Estructura Base

Este es un **template profesional** para portales públicos de clientes. Diseñado para ser reutilizado por IAs en proyectos futuros.

## 📁 Estructura del Portal

```
/portal/                          # Portal público principal
├── page.tsx                      # Página principal con hero, catálogo, servicios
├── item/[slug]/page.tsx         # Detalle de servicio/producto
├── my-requests/page.tsx         # Mis solicitudes (requiere login)
├── support/page.tsx             # Soporte
└── kb/page.tsx                  # Base de conocimiento

/f/[slug]/                       # Formularios públicos
└── page.tsx                     # Vista de formulario público

/components/portal/              # Componentes reutilizables del portal
├── Hero.tsx                     # Sección hero con gradiente
├── ServiceCard.tsx              # Card de servicio/producto
├── CategoryGrid.tsx             # Grid de categorías
├── SearchBar.tsx                # Barra de búsqueda
├── QuickActions.tsx             # Acciones rápidas
└── PortalFooter.tsx             # Footer del portal
```

## 🎨 Diseño y Estilo

### Paleta de Colores
- **Primary**: Indigo 600 → Purple 600 (gradientes)
- **Secondary**: Pink 600
- **Background**: Slate 50 → Blue 50 → Indigo 50 (gradiente)
- **Cards**: White con shadow-lg
- **Text**: Gray 900 (títulos), Gray 600 (descripción)

### Componentes Clave

#### 1. Hero Section
```tsx
<div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
  <h1 className="text-5xl font-bold">Portal de Servicios</h1>
  <p className="text-xl text-indigo-100">Descripción atractiva</p>
  <SearchBar />
</div>
```

#### 2. Service Card
```tsx
<Link href={`/portal/item/${slug}`} className="bg-white rounded-xl shadow-lg hover:shadow-2xl">
  <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100">
    <span className="text-6xl">{icon}</span>
  </div>
  <div className="p-6">
    <h3 className="text-xl font-bold">{name}</h3>
    <p className="text-gray-600">{description}</p>
    <span className="text-indigo-600 font-semibold">Solicitar →</span>
  </div>
</Link>
```

#### 3. Category Grid
```tsx
<button className={`p-6 rounded-xl shadow-lg ${
  selected ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : 'bg-white'
}`}>
  <div className="text-4xl">{icon}</div>
  <div className="font-semibold">{name}</div>
</button>
```

## 🔧 Funcionalidades

### Portal Principal (`/portal`)
- ✅ Hero con gradiente y buscador
- ✅ Grid de categorías con iconos
- ✅ Catálogo de servicios/productos
- ✅ Filtrado por categoría y búsqueda
- ✅ Quick actions (Mis solicitudes, Soporte, KB)
- ✅ Footer profesional
- ✅ Estados de carga (skeletons)
- ✅ Manejo de portal deshabilitado

### Formularios Públicos (`/f/[slug]`)
- ✅ Grid layout responsive (12 columnas)
- ✅ Soporte para todos los tipos de campo
- ✅ Validación de campos requeridos
- ✅ Mensaje de éxito/error
- ✅ Diseño moderno con gradientes
- ✅ Control de acceso (público/roles)

## 📊 Datos Dinámicos (tRPC)

### Endpoints Necesarios
```typescript
// Portal de servicios
trpc.servicePortal.getPortalConfig.useQuery()
trpc.servicePortal.getCategories.useQuery()
trpc.servicePortal.getItems.useQuery({ categoryId?, search? })

// Formularios
trpc.forms.getBySlug.useQuery(slug)
trpc.forms.submit.useMutation()
```

## 🎯 Casos de Uso

### 1. Portal de Materiales (Actual)
- Catálogo de materiales de construcción
- Solicitud de equipos
- Formularios de pedidos

### 2. Portal de Servicios Profesionales
- Catálogo de servicios (legal, contable, etc.)
- Formularios de contacto
- Agendamiento de citas

### 3. Portal de E-commerce
- Catálogo de productos
- Formularios de cotización
- Seguimiento de pedidos

### 4. Portal Educativo
- Catálogo de cursos
- Formularios de inscripción
- Recursos descargables

## 🚀 Cómo Usar Este Template

### Para IAs Generadoras de Proyectos:

1. **Clonar estructura** de `/portal` y `/f/[slug]`
2. **Personalizar colores** en gradientes y paleta
3. **Adaptar contenido** del hero y secciones
4. **Configurar endpoints** tRPC según modelo de datos
5. **Agregar secciones** específicas del negocio

### Personalización Rápida:

```typescript
// 1. Cambiar branding
const BRAND_CONFIG = {
  name: "Tu Empresa",
  primaryColor: "indigo",
  secondaryColor: "purple",
  accentColor: "pink",
  heroTitle: "Tu Portal Profesional",
  heroSubtitle: "Descripción de tu servicio",
};

// 2. Configurar categorías
const CATEGORIES = [
  { name: "Categoría 1", icon: "📦", color: "#6366f1" },
  { name: "Categoría 2", icon: "🛠️", color: "#8b5cf6" },
];

// 3. Quick actions personalizadas
const QUICK_ACTIONS = [
  { title: "Acción 1", icon: "📋", href: "/portal/action1" },
  { title: "Acción 2", icon: "💬", href: "/portal/action2" },
];
```

## 📱 Responsive Design

- **Mobile**: Grid 1 columna, hero compacto
- **Tablet**: Grid 2 columnas, categorías 4 cols
- **Desktop**: Grid 3 columnas, categorías 6 cols

## ♿ Accesibilidad

- Contraste WCAG AA
- Navegación por teclado
- ARIA labels en botones
- Focus visible

## 🔐 Seguridad

- Formularios públicos con validación
- Control de acceso por roles
- Rate limiting en endpoints
- Sanitización de inputs

## 📈 Métricas Sugeridas

- Visitas al portal
- Servicios más solicitados
- Tasa de conversión de formularios
- Tiempo promedio en portal

---

**Última actualización**: 2026-03-21
**Versión**: 1.0.0
**Licencia**: Template Base para Proyectos Internos
