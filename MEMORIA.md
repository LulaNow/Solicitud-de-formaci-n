# 📘 MEMORIA DEL PROYECTO — NADRO Enterprise Portal

> **Template para IA**: Este documento contiene toda la información necesaria para que una IA pueda modificar, extender y mantener este proyecto de forma autónoma.

---

## 🎯 INFORMACIÓN GENERAL

### Descripción del Proyecto
Portal empresarial para NADRO (distribuidora farmacéutica mexicana) con sistema de autenticación, gestión de usuarios, roles y permisos, y escenas animadas temáticas en la página de login.

### Stack Tecnológico
- **Framework**: Next.js 15.1.0 (App Router + React Server Components)
- **Lenguaje**: TypeScript 5.x
- **Base de datos**: PostgreSQL + Prisma ORM 6.2.0
- **Autenticación**: NextAuth.js v5 (beta) con Prisma Adapter
- **API**: tRPC 11.0.0-rc (type-safe API)
- **Estilos**: Tailwind CSS 3.x + CSS Modules
- **Animaciones**: CSS-only (sin librerías JS pesadas)
- **Testing**: Vitest + Playwright
- **Gestión de estado**: TanStack Query (React Query)

### Estructura del Proyecto
```
MDM_Materiales/
├── prisma/
│   ├── schema.prisma          # Modelos de base de datos
│   └── seed.ts                # Datos iniciales (admin, permisos, menús)
├── src/
│   ├── app/
│   │   ├── (auth)/            # Rutas públicas (login)
│   │   └── (portal)/          # Rutas protegidas (dashboard, admin)
│   ├── components/
│   │   ├── animated/          # LogisticsScene + CSS
│   │   └── ui/                # Componentes reutilizables
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   └── trpc/              # tRPC setup
│   └── server/
│       ├── routers/           # tRPC routers (appearance, auth, users, etc.)
│       └── trpc.ts            # Context + procedures
├── public/                    # Assets estáticos
└── MEMORIA.md                 # Este archivo
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### 1. Autenticación y Autorización

#### NextAuth.js v5 Configuration
**Archivo**: `src/lib/auth.ts`

```typescript
// Providers configurados:
- Credentials (username/password con Argon2)
- 2FA opcional con OTPAuth

// Callbacks importantes:
- session: Agrega userId, roleId, permissions al token
- jwt: Persiste datos del usuario en el token
```

**Flujo de autenticación**:
1. Usuario envía credenciales → `src/app/(auth)/login/page.tsx`
2. NextAuth valida contra Prisma → `src/lib/auth.ts`
3. Si válido, crea sesión JWT
4. Middleware protege rutas → `middleware.ts`

#### Sistema de Permisos
**Modelo**: RBAC (Role-Based Access Control)

```prisma
// prisma/schema.prisma
User → Role → RolePermission → Permission
```

**Permisos disponibles** (ver `prisma/seed.ts`):
- `users.view`, `users.create`, `users.edit`, `users.delete`
- `roles.manage`
- `permissions.manage`
- `menu.manage`
- `settings.manage`
- `audit.view`

**Cómo agregar un nuevo permiso**:
1. Agregar a `prisma/seed.ts` en el array `permissions`
2. Correr `npm run db:seed`
3. Usar en tRPC: `adminProcedure` o `protectedProcedure`

### 2. tRPC API Layer

#### Estructura de Routers
**Archivo principal**: `src/server/routers/_app.ts`

```typescript
export const appRouter = router({
  auth: authRouter,           // Login, logout, session
  users: usersRouter,         // CRUD usuarios
  roles: rolesRouter,         // CRUD roles
  permissions: permissionsRouter,
  menu: menuRouter,           // Menú dinámico
  appearance: appearanceRouter, // Configuración de escenas
  audit: auditRouter,         // Logs de auditoría
});
```

#### Procedures (Tipos de endpoints)
```typescript
// Público (sin auth)
publicProcedure

// Requiere login
protectedProcedure

// Requiere login + permiso específico
adminProcedure  // Automáticamente verifica rol admin
```

**Ejemplo de nuevo endpoint**:
```typescript
// src/server/routers/myRouter.ts
export const myRouter = router({
  getItems: protectedProcedure
    .input(z.object({ page: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.item.findMany({
        skip: input.page * 10,
        take: 10,
      });
    }),
});
```

### 3. Base de Datos (Prisma)

#### Modelos Principales
```prisma
User          # Usuarios del sistema
Role          # Roles (Admin, Operador, Externo)
Permission    # Permisos granulares
RolePermission # Relación N:N entre Role y Permission
MenuItem      # Menú dinámico del portal
AppSetting    # Configuraciones globales (appearance.*)
AuditLog      # Registro de acciones administrativas
```

#### Comandos útiles
```bash
# Generar cliente Prisma
npm run db:generate

# Push schema a DB (dev)
npm run db:push

# Crear migración (prod)
npm run db:migrate

# Seed inicial
npm run db:seed

# Setup completo (generate + push + seed)
npm run db:setup

# Abrir Prisma Studio (GUI)
npm run db:studio
```

#### Agregar un nuevo modelo
1. Editar `prisma/schema.prisma`
2. Correr `npm run db:push` (dev) o `npm run db:migrate` (prod)
3. Actualizar `seed.ts` si necesita datos iniciales
4. Crear router tRPC correspondiente

### 4. Sistema de Escenas Animadas (Login)

#### Arquitectura
**Componente**: `src/components/animated/LogisticsScene.tsx`  
**Estilos**: `src/components/animated/logistics-scene.css`

#### 10 Escenas Disponibles
| Escena | Tipo | Elementos |
|--------|------|-----------|
| 🌙 `night` | Clima | Estrellas, luna, cielo oscuro |
| ⛈️ `storm` | Clima | Lluvia, relámpagos, nubes oscuras |
| ☀️ `sunny` | Clima | Sol, nubes blancas, cielo azul |
| ❄️ `snow` | Clima | Copos cayendo, techos blancos |
| 🎄 `christmas` | Festivo | Luces, árbol, nieve, ventanas cálidas |
| 🎃 `halloween` | Calendario | Murciélagos, calabaza, luna naranja |
| 💀 `muertos` | Calendario | Cempasúchil, papel picado, calavera |
| 🇲🇽 `patrias` | Calendario | Fuegos artificiales tricolor |
| 💝 `valentine` | Calendario | Corazones cayendo, cielo rosa |
| 👑 `reyes` | Calendario | Estrella de Belén brillante |

#### Sistema de Configuración
**Router**: `src/server/routers/appearance.ts`

```typescript
// Configuración almacenada en AppSetting:
appearance.scene_mode       // "random" | "auto" | scene name
appearance.snow_enabled     // "true" | "false"
appearance.calendar_auto    // "true" | "false"
appearance.event_reyes      // "true" | "false"
appearance.event_valentine  // ...
appearance.event_patrias
appearance.event_halloween
appearance.event_muertos
appearance.event_christmas
```

**Prioridad de selección**:
1. **Calendario automático** (si `calendar_auto=true` y fecha coincide)
2. **Modo de escena** (`scene_mode`)
3. **Fallback**: `random` entre `["night", "storm", "sunny"]`

#### Cómo agregar una nueva escena

**Paso 1: CSS Variables + Visibility**
```css
/* logistics-scene.css */
.ls-nueva-escena {
  --sky-1: #color1;
  --sky-2: #color2;
  --sky-3: #color3;
  --sky-4: #color4;
}

/* Visibility */
.ls-nueva-escena .ls-nuevo-elemento {
  display: block;
}
```

**Paso 2: Efectos CSS**
```css
/* Nuevo elemento */
.ls-nuevo-elemento {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 8;
  overflow: hidden;
  contain: strict; /* GPU optimization */
}

.ls-nuevo-elemento::before {
  content: "";
  /* ... animación ... */
  animation: ls-nuevaAnimacion 5s linear infinite;
}

@keyframes ls-nuevaAnimacion {
  from { transform: translateY(-100px); }
  to { transform: translateY(100vh); }
}
```

**Paso 3: TypeScript (LogisticsScene.tsx)**
```typescript
// Agregar al type Scene
type Scene = "night" | "storm" | "sunny" | ... | "nueva-escena";

// Agregar a ALL_SCENES
const ALL_SCENES: Scene[] = [..., "nueva-escena"];

// Si es evento de calendario:
const CALENDAR_EVENTS: CalendarEvent[] = [
  ...,
  { 
    key: "event_nueva", 
    scene: "nueva-escena", 
    startMonth: 3, 
    startDay: 15, 
    endMonth: 3, 
    endDay: 17 
  },
];
```

**Paso 4: DOM (LogisticsScene.tsx return)**
```tsx
{/* Nueva escena: elementos */}
<div className="ls-nuevo-elemento" />
```

**Paso 5: Admin Settings**
```typescript
// src/app/(portal)/admin/settings/page.tsx
const SCENE_MODES = [
  ...,
  { 
    value: "nueva-escena", 
    label: "Nueva Escena", 
    desc: "Descripción breve", 
    icon: IconoLucide 
  },
];

// Si es calendario:
const CALENDAR_EVENTS = [
  ...,
  { 
    key: "event_nueva", 
    label: "Nueva Escena", 
    emoji: "🎉", 
    dates: "15-17 Marzo", 
    icon: IconoLucide, 
    color: "text-blue-500" 
  },
];
```

**Paso 6: Seed (prisma/seed.ts)**
```typescript
const settings = [
  ...,
  { key: "appearance.event_nueva", value: "true", type: "boolean" },
];
```

**Paso 7: tRPC Router (appearance.ts)**
```typescript
// Ya está genérico, solo agregar el key al array:
const eventKeys = [
  ...,
  "event_nueva",
];
```

#### Optimizaciones de Rendimiento (GPU)
**Aplicadas en `logistics-scene.css`**:

1. **`transform` en lugar de `left`/`top`**
   - Camión, autos, persona usan `translateX()` → GPU compositor
   
2. **`will-change` hints**
   ```css
   .ls-truck { will-change: transform, opacity; }
   .ls-cloud { will-change: transform; }
   .ls-city { will-change: filter; }
   ```

3. **`contain: strict`** para aislar repaints
   ```css
   .ls-rain, .ls-snowfall, .ls-bats, .ls-cempasuchil {
     contain: strict;
   }
   ```

4. **`backdrop-blur-md`** en lugar de `-xl`
   - Login card: 12px blur (40% menos GPU que 24px)

5. **`prefers-reduced-motion`**
   - Desactiva TODAS las animaciones si el usuario lo prefiere
   - Accesibilidad + hardware bajo

---

## 🔧 GUÍAS DE MODIFICACIÓN

### Agregar una nueva página protegida

**Paso 1: Crear página**
```tsx
// src/app/(portal)/mi-nueva-pagina/page.tsx
export default function MiNuevaPagina() {
  return <div>Contenido</div>;
}
```

**Paso 2: Agregar al menú (seed.ts)**
```typescript
const adminSubMenus = [
  ...,
  {
    label: "Mi Nueva Página",
    icon: "FileText",
    path: "/mi-nueva-pagina",
    order: 5,
    permKey: "settings.manage", // O crear nuevo permiso
  },
];
```

**Paso 3: Re-seed**
```bash
npm run db:seed
```

### Agregar un nuevo campo a User

**Paso 1: Schema**
```prisma
// prisma/schema.prisma
model User {
  // ... campos existentes
  nuevoCampo String?
}
```

**Paso 2: Migración**
```bash
npm run db:push  # Dev
# O
npm run db:migrate  # Prod
```

**Paso 3: Actualizar tRPC**
```typescript
// src/server/routers/users.ts
create: adminProcedure
  .input(z.object({
    // ... campos existentes
    nuevoCampo: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    return await ctx.prisma.user.create({
      data: {
        // ... campos existentes
        nuevoCampo: input.nuevoCampo,
      },
    });
  }),
```

**Paso 4: Actualizar UI**
```tsx
// src/app/(portal)/admin/users/page.tsx
<input
  name="nuevoCampo"
  value={formData.nuevoCampo}
  onChange={handleChange}
/>
```

### Cambiar colores del tema

**Archivo**: `tailwind.config.ts`

```typescript
theme: {
  extend: {
    colors: {
      brand: {
        50: '#f0f9f4',
        100: '#dbf0e3',
        // ... hasta 950
        DEFAULT: '#4D8B31', // Color principal NADRO
      },
    },
  },
},
```

**Uso en componentes**:
```tsx
<div className="bg-brand-500 text-white">
  Botón con color NADRO
</div>
```

### Agregar validación 2FA obligatoria

**Paso 1: Schema**
```prisma
model User {
  // ... campos existentes
  twoFactorRequired Boolean @default(false)
}
```

**Paso 2: Auth config**
```typescript
// src/lib/auth.ts
callbacks: {
  async signIn({ user }) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    
    if (dbUser?.twoFactorRequired && !dbUser.twoFactorSecret) {
      throw new Error("2FA requerido pero no configurado");
    }
    
    return true;
  },
}
```

---

## 🤖 INSTRUCCIONES PARA IA

### Principios de Modificación

1. **Siempre leer antes de editar**
   - Usar `read_file` para entender el contexto completo
   - No asumir estructura sin verificar

2. **Mantener consistencia**
   - Seguir patrones existentes (naming, estructura)
   - Usar las mismas librerías (no agregar nuevas sin razón)

3. **Type-safety primero**
   - Todos los endpoints tRPC deben tener `.input()` con Zod
   - No usar `any` en TypeScript

4. **Optimización GPU**
   - Nuevas animaciones CSS: usar `transform`, no `left`/`top`
   - Agregar `will-change` y `contain` cuando corresponda
   - Incluir en `prefers-reduced-motion`

5. **Seguridad**
   - Nunca exponer credenciales en código
   - Usar `adminProcedure` para rutas sensibles
   - Validar inputs con Zod

6. **Auditoría**
   - Acciones administrativas deben crear `AuditLog`
   - Ejemplo en `src/server/routers/users.ts`

### Comandos de Desarrollo

```bash
# Iniciar proyecto
npm install
npm run db:setup
npm run dev

# Desarrollo
npm run dev              # Next.js dev server (Turbopack)
npm run db:studio        # Prisma Studio GUI
npm run typecheck        # Verificar tipos

# Testing
npm run test             # Vitest
npm run test:e2e         # Playwright
npm run test:e2e:ui      # Playwright UI mode

# Producción
npm run build            # Build optimizado
npm start                # Servidor producción
```

### Debugging

**VS Code Tasks** (Cmd+Shift+P → "Run Task"):
- 🚀 Dev Server
- 🗄️ Prisma Studio
- 🌱 Database Seed
- ✅ Type Check

**VS Code Debug** (F5):
- 🐛 Next.js: Debug Server
- 🌐 Next.js: Debug Client

### Variables de Entorno Requeridas

```env
# .env
DATABASE_URL="postgresql://user:pass@localhost:5432/nadro"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### Estructura de Commits

```
feat(scope): descripción corta

- Detalle 1
- Detalle 2
- Detalle 3

Ejemplos:
feat(auth): add 2FA support with OTPAuth
fix(ui): toggle alignment in admin settings
perf(login): GPU optimization for animated scene
```

---

## 📊 MÉTRICAS Y RENDIMIENTO

### Lighthouse Goals
- Performance: >90
- Accessibility: 100
- Best Practices: 100
- SEO: >90

### Bundle Size
- First Load JS: <200KB
- Total Page Weight: <500KB

### Optimizaciones Aplicadas
1. **Next.js 15 + Turbopack**: Build ultra-rápido
2. **CSS-only animations**: Sin JS en animaciones
3. **tRPC**: Sin overhead de REST
4. **Prisma**: Queries optimizadas
5. **GPU compositing**: `transform` + `will-change`

---

## 🚨 TROUBLESHOOTING

### Error: "Prisma Client not generated"
```bash
npm run db:generate
```

### Error: "Module not found: @/..."
- Verificar `tsconfig.json` → `paths` → `"@/*": ["./src/*"]`

### Animaciones lentas en login
- Verificar que `backdrop-blur-md` esté activo (no `-xl`)
- Verificar que `transform` se use en lugar de `left`/`top`
- Activar `prefers-reduced-motion` en SO para testing

### tRPC "Unauthorized"
- Verificar que el usuario tenga sesión activa
- Verificar que el permiso esté asignado al rol
- Revisar `src/server/trpc.ts` → `createContext`

---

## 📚 RECURSOS ADICIONALES

### Documentación Oficial
- [Next.js 15](https://nextjs.org/docs)
- [tRPC](https://trpc.io/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js v5](https://authjs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Convenciones del Proyecto
- **Naming**: camelCase (JS/TS), kebab-case (CSS), PascalCase (Components)
- **Imports**: Absolutos con `@/` alias
- **Estilos**: Tailwind primero, CSS modules solo para animaciones
- **Comentarios**: JSDoc para funciones públicas

---

## 🔐 SEGURIDAD

### Autenticación
- Passwords hasheados con Argon2
- JWT firmado con `NEXTAUTH_SECRET`
- 2FA opcional con OTPAuth

### Autorización
- Middleware protege rutas `(portal)`
- tRPC procedures verifican permisos
- Audit log registra acciones admin

### Best Practices
- No exponer stack traces en producción
- Validar todos los inputs (Zod)
- Rate limiting en endpoints sensibles (TODO)
- HTTPS obligatorio en producción

---

## 📝 CHANGELOG

### v0.1.0 (Actual)
- ✅ Sistema de autenticación con NextAuth.js
- ✅ RBAC (Roles + Permisos)
- ✅ 10 escenas animadas en login
- ✅ Calendario automático mexicano
- ✅ Admin panel (Users, Roles, Settings)
- ✅ Optimización GPU (transform, will-change, contain)
- ✅ prefers-reduced-motion support
- ✅ Menú dinámico desde DB
- ✅ Audit logging

### Roadmap
- [ ] Rate limiting
- [ ] Email notifications
- [ ] Dashboard con métricas
- [ ] Módulo de inventario
- [ ] Módulo de pedidos
- [ ] Reportes exportables

---

**Última actualización**: 20 de Marzo, 2026  
**Mantenedor**: Sistema NADRO  
**Licencia**: Privado — Uso interno NADRO
