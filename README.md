<div align="center">

# 🏥 NADRO Enterprise Portal

### Portal Empresarial de Última Generación para Distribución Farmacéutica

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![tRPC](https://img.shields.io/badge/tRPC-11.0-2596BE?style=for-the-badge&logo=trpc)](https://trpc.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**Versión Base**: `v1.5.0` — SSO Ready • **Versión AppStore**: [`appstore-v1.0.0`](https://github.com/MartinCrespoCalderon/BaseWeb_SSO/releases/tag/appstore-v1.0.0)

[Características](#-características-principales) • [Instalación](#-instalación-rápida) • [AppStore](#-clonar-appstore-v130) • [Uso](#-uso) • [Documentación](#-documentación)

</div>

---

## � Versiones del Proyecto

Este repositorio contiene **dos versiones principales** en ramas separadas:

| Versión | Tag | Rama | Descripción |
|---------|-----|------|-------------|
| **Base SSO Ready** | `v1.5.0` | `main` | Portal base con autenticación SSO (recibe login desde AppStore) |
| **AppStore** | `appstore-v1.0.0` | `appstore-tokens` | Marketplace de aplicaciones con SSO integrado |
| **Legacy** | `v1.3.0` | — | Versión anterior base (sin SSO) — **congelada** |

> **⚠️ Importante**: Las versiones `v1.0.0` a `v1.3.0` son la **base original sin SSO**. A partir de `v1.5.0` (SSO Ready), `main` incluye la funcionalidad SSO para que portales externos puedan autenticarse.

---

## 🔐 SSO READY PORTAL (Rama: `main` — v1.5.0)

> **Este template permite recibir SSO desde el AppStore.** Al hacer clic en un portal desde el AppStore, el usuario es autenticado automáticamente en este portal si su cuenta existe localmente.

### Flujo SSO

```
┌─────────────┐     1. Click "Abrir App"      ┌─────────────┐
│  AppStore    │ ─────────────────────────────> │  Este Portal │
│  (puerto     │     ?code=XXX                  │  (puerto     │
│   3000)      │                                │   3001)      │
│              │     2. Exchange code            │              │
│  /api/trpc/  │ <───── POST exchangeToken ──── │ /api/auth/   │
│  apps.       │                                │ sso/callback │
│  exchangeToken│    3. User data               │              │
│              │ ─────────────────────────────> │              │
└─────────────┘                                 │  4. Buscar   │
                                                │  usuario en  │
                                                │  DB LOCAL    │
                                                │              │
                                                │  ✅ Existe → │
                                                │  Sesión +    │
                                                │  Dashboard   │
                                                │              │
                                                │  ❌ No existe│
                                                │  → Rechazar  │
                                                │  con mensaje │
                                                └─────────────┘
```

### Instalación SSO Ready Portal

```bash
# 1. Clonar el repositorio
git clone https://github.com/MartinCrespoCalderon/BaseWeb_SSO.git
cd BaseWeb_SSO

# 2. Cambiar a la rama SSO_READY_PORTAL
git checkout SSO_READY_PORTAL

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
```

### Configurar el `.env`

Edita el `.env` con tus datos:

```env
# Tu base de datos PostgreSQL (NUEVA, separada del AppStore)
DATABASE_URL="postgresql://usuario:contraseña@host:5432/mi_portal_db"

# Secreto para sesiones (genera con: openssl rand -base64 32)
AUTH_SECRET="tu_secreto_aqui"

# ========= SSO (OBLIGATORIO) =========
# URL donde corre el AppStore
SSO_APPSTORE_URL="http://localhost:3000"

# Client ID y Secret - Los obtienes al crear tu portal en el AppStore
# (Admin > Portales > Nuevo Portal)
SSO_CLIENT_ID="tu_client_id"
SSO_CLIENT_SECRET="nsk_tu_client_secret"

# URL de ESTE portal (debe coincidir con Callback URL en AppStore)
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### Configurar la Base de Datos

```bash
# 5. Crear tablas + seed (admin/admin123)
npm run db:generate
npm run db:push
npm run db:seed
```

### Configurar en el AppStore

En el **AppStore** (Admin > Portales > Nuevo Portal):

| Campo | Valor |
|-------|-------|
| **Nombre** | Mi Portal |
| **Slug** | mi-portal |
| **URL** | `http://localhost:3001` |
| **Callback URL** | `http://localhost:3001/api/auth/sso/callback` |

Al crear el portal, **copia el Client ID y Client Secret** y pégalos en tu `.env`.

### Iniciar el Portal

```bash
# 6. Iniciar en puerto 3001 (AppStore usa 3000)
PORT=3001 npm run dev
```

### Regla de Seguridad

> **⚠️ Si el usuario NO existe en la base de datos LOCAL de este portal, el SSO será RECHAZADO con un mensaje claro.** El admin del portal debe crear los usuarios que tendrán acceso.

---

## 🐳 Deploy SSO Portal con Docker (Producción)

### Prerrequisitos

- Servidor con Docker y Docker Compose instalados
- Base de datos PostgreSQL (puede ser Azure, AWS RDS, o local)
- Nginx Proxy Manager (opcional, para SSL y dominio personalizado)

### 1. Clonar y preparar en el servidor

```bash
# En el servidor de producción
git clone https://github.com/MartinCrespoCalderon/BaseWeb_SSO.git
cd BaseWeb_SSO
git checkout main  # La rama main ahora incluye SSO Portal
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.production
nano .env.production  # o vim
```

**Editar `.env.production`:**

```env
# === Database (Requerido) ===
# Tu base de datos PostgreSQL (Azure, AWS, o local)
DATABASE_URL="postgresql://usuario:contraseña@host:5432/mi_portal_db"

# === Auth (Requerido) ===
# Generar con: openssl rand -base64 32
AUTH_SECRET="tu_secreto_aqui"
AUTH_TRUST_HOST=true

# === Security (Requerido) ===
ENCRYPTION_KEY="clave-hex-64-caracteres"
ENCRYPTION_PEPPER="tu-pepper-aqui"
HMAC_SECRET="tu-hmac-aqui"

# === URLs (Requerido) ===
# URL pública de ESTE portal (dominio o IP)
NEXT_PUBLIC_APP_URL="https://instanciasso.nadro.dev"
NEXT_PUBLIC_APP_NAME="NADRO Portal SSO"

# === SSO Configuration (Requerido para SSO) ===
# URL del AppStore que autentica
SSO_APPSTORE_URL="https://appstore.tudominio.com"
# Obtener del AppStore: Admin > Portales > Nuevo Portal
SSO_CLIENT_ID="tu_client_id"
SSO_CLIENT_SECRET="nsk_tu_client_secret"

# === n8n Integration (Opcional) ===
N8N_BASE_URL="https://workflow.tudominio.com/"
N8N_API_KEY="tu-api-key"
N8N_WEBHOOK_SECRET="tu-webhook-secret"
```

### 3. Construir y desplegar

```bash
# Construir imagen Docker
docker compose -f docker-compose.production.yml build

# Iniciar contenedor
docker compose -f docker-compose.production.yml up -d

# Verificar logs
docker logs instancia_sso --tail 50
```

### 4. Configurar Nginx Proxy Manager (SSL + Dominio)

En la interfaz de NPM (http://tuservidor:81):

1. **Proxy Hosts** → **Add Proxy Host**

| Campo | Valor |
|-------|-------|
| **Domain Names** | `instanciasso.nadro.dev` |
| **Scheme** | `http` |
| **Forward Hostname/IP** | `instancia_sso` |
| **Forward Port** | `3000` |

2. **SSL** → **Request a new SSL Certificate**
   - ✅ Force SSL
   - ✅ HTTP/2 Support
   - ✅ HSTS Enabled

3. **Save**

> **Importante**: Si Nginx Proxy Manager está en otro contenedor Docker, asegúrate de que ambos estén en la misma red (`nginx-proxy-manager`). El `docker-compose.production.yml` ya incluye esta configuración.

### 5. Verificar despliegue

```bash
# Verificar contenedor corriendo
docker ps | grep instancia_sso

# Verificar logs
docker logs instancia_sso --tail 20

# Test desde el servidor
curl -I http://localhost:8000/login
```

### 6. Actualizar AppStore con la nueva URL

En el AppStore (rama `appstore-tokens`):

1. **Admin > Portales** → Editar tu portal
2. Actualizar **URL**: `https://instanciasso.nadro.dev`
3. Actualizar **Callback URL**: `https://instanciasso.nadro.dev/api/auth/sso/callback`
4. Guardar cambios

---

## 🎯 CLONAR APPSTORE v1.3.0

> **⚠️ IMPORTANTE**: El **AppStore** con todas sus funcionalidades (categorías, emojis, responsables) está en la rama `appstore-tokens`, **NO en `main`**.

### Instalación Completa del AppStore

```bash
# 1. Clonar el repositorio
git clone https://github.com/MartinCrespoCalderon/BaseWeb_SSO.git
cd BaseWeb_SSO

# 2. Cambiar a la rama appstore-tokens
git checkout appstore-tokens

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL y NEXTAUTH_SECRET

# 5. Configurar base de datos
npm run db:generate
npm run db:push

# 6. Crear roles necesarios
npx tsx scripts/add-missing-roles.ts

# 7. Crear usuario admin
npx tsx scripts/reset-admin-password.ts

# 8. Iniciar servidor
npm run dev
```

### Credenciales de Acceso

```
Usuario: admin
Contraseña: admin
```

### Funcionalidades del AppStore v1.3.0

✅ **Sistema de Categorías**
- CRUD completo de categorías de apps
- Asignación de responsables por categoría
- Organización visual de aplicaciones

✅ **Selector de Emojis**
- 200+ emojis organizados por categorías
- Búsqueda en tiempo real
- Selector visual integrado

✅ **Gestión de Responsables**
- Asignación de usuarios responsables a apps y categorías
- Filtrado por roles: Developer, Admin, Gerencia, SubGerencia, Lider
- Visualización de responsables en tarjetas

✅ **Gestión de Usuarios**
- Creación y edición con modales inline
- Asignación de múltiples roles
- Control de estado (Activo/Inactivo/Suspendido)

✅ **Gestión de Roles**
- Todos los roles disponibles para asignación
- Sin restricciones por roles del usuario actual
- Admin puede ver y gestionar todos los portales

### Scripts Útiles

```bash
# Resetear contraseña de admin
npx tsx scripts/reset-admin-password.ts

# Verificar usuario admin
npx tsx scripts/check-admin-user.ts

# Crear roles faltantes
npx tsx scripts/add-missing-roles.ts

# Seed de categorías de prueba
npx tsx scripts/seed-categories.ts

# Seed de usuarios de prueba
npx tsx scripts/seed-test-users.ts
```

### Estructura de Rutas Admin

```
/appstore/my-apps          → Mis aplicaciones
/appstore                  → Marketplace (solo admin)
/appstore/admin/apps       → Gestión de portales
/appstore/admin/categories → Gestión de categorías
/appstore/admin/users      → Gestión de usuarios
/appstore/admin/roles      → Gestión de roles
/appstore/profile          → Mi perfil
```

---

## 🎯 Descripción

Portal empresarial moderno diseñado para **NADRO**, la distribuidora farmacéutica líder en México. Sistema completo de gestión con autenticación robusta, control de acceso basado en roles (RBAC), y una experiencia visual única con **10 escenas animadas** que se adaptan al clima y calendario mexicano.

### ✨ Características Principales

<table>
<tr>
<td width="50%">

#### 🔐 Autenticación y Seguridad
- **NextAuth.js v5** con Prisma Adapter
- Passwords hasheados con **Argon2**
- **2FA opcional** (OTPAuth + QR)
- Sesiones JWT firmadas
- Middleware de protección de rutas

</td>
<td width="50%">

#### 👥 Gestión de Usuarios
- Sistema **RBAC** (Roles + Permisos)
- 3 roles predefinidos (Admin, Operador, Externo)
- Permisos granulares (users, roles, settings, etc.)
- **Audit logging** de acciones administrativas
- Menú dinámico desde base de datos

</td>
</tr>
<tr>
<td width="50%">

#### 🎨 Experiencia Visual
- **10 escenas animadas** en login:
  - 🌙 Noche, ⛈️ Tormenta, ☀️ Día soleado, ❄️ Nieve
  - 🎄 Navidad, 🎃 Halloween, 💀 Día de Muertos
  - 🇲🇽 Fiestas Patrias, 💝 San Valentín, 👑 Reyes
- **Calendario automático** mexicano
- Optimización GPU (60 FPS en hardware modesto)
- `prefers-reduced-motion` support

</td>
<td width="50%">

#### ⚡ Rendimiento
- **Next.js 15** + Turbopack
- **tRPC** (type-safe API sin overhead)
- CSS-only animations (sin JS pesado)
- Bundle optimizado (<200KB First Load)
- Lighthouse Score: >90

</td>
</tr>
</table>

---

## 🚀 Instalación Rápida

### Prerrequisitos

```bash
Node.js >= 18.x
PostgreSQL >= 14.x
npm >= 9.x
```

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/tu-org/nadro-portal.git
cd nadro-portal
```

### 2️⃣ Instalar Dependencias

```bash
npm install
```

### 3️⃣ Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nadro_portal"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
```

### 4️⃣ Configurar Base de Datos

```bash
# Generar cliente Prisma + Push schema + Seed inicial
npm run db:setup
```

Esto creará:
- ✅ Tablas en PostgreSQL
- ✅ Usuario admin (username: `admin`, password: `admin123`)
- ✅ Roles y permisos predefinidos
- ✅ Menú administrativo

### 5️⃣ Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) 🎉

**Credenciales iniciales**:
- Usuario: `admin`
- Contraseña: `admin123`

> ⚠️ **IMPORTANTE**: Cambiar la contraseña del admin inmediatamente en producción.

---

## 🎮 Uso

### Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (Turbopack)
npm run db:studio        # Prisma Studio (GUI para DB)
npm run typecheck        # Verificar tipos TypeScript

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Push schema a DB (dev)
npm run db:migrate       # Crear migración (prod)
npm run db:seed          # Ejecutar seed
npm run db:setup         # Setup completo (generate + push + seed)

# Testing
npm run test             # Tests unitarios (Vitest)
npm run test:e2e         # Tests E2E (Playwright)
npm run test:e2e:ui      # Tests E2E con UI

# Producción
npm run build            # Build optimizado
npm start                # Servidor de producción
npm run lint             # Linter
```

### VS Code (Recomendado)

Abrir el workspace optimizado:

```bash
code MDM_Materiales.code-workspace
```

**Incluye**:
- ✅ 8 tasks pre-configuradas (Cmd+Shift+P → "Run Task")
- ✅ 2 debug configurations (F5)
- ✅ 11 extensiones recomendadas
- ✅ Format on save, ESLint auto-fix
- ✅ Tailwind IntelliSense

---

## 📋 Crear una Copia para Otro Proyecto

### Opción 1: Template Repository (Recomendado)

Si eres el **dueño del repositorio original**:

1. **Convertir a Template** (GitHub):
   - Settings → Template repository ✅
   - Esto permite crear copias limpias sin historial

2. **Crear nuevo proyecto**:
   ```bash
   # En GitHub: "Use this template" → "Create a new repository"
   # O por CLI:
   gh repo create mi-nuevo-proyecto --template tu-org/nadro-portal
   cd mi-nuevo-proyecto
   ```

3. **Personalizar**:
   ```bash
   # Cambiar nombre del proyecto
   # package.json → "name": "mi-nuevo-proyecto"

   # Cambiar branding
   # public/log.png → Tu logo
   # tailwind.config.ts → Tus colores

   # Nueva base de datos
   # .env → DATABASE_URL con nueva DB
   npm run db:setup
   ```

### Opción 2: Fork + Upstream (Para Contribuidores)

Si **NO eres el dueño** pero quieres contribuir:

```bash
# 1. Fork en GitHub (botón "Fork")

# 2. Clonar tu fork
git clone https://github.com/tu-usuario/nadro-portal.git
cd nadro-portal

# 3. Agregar upstream (repo original)
git remote add upstream https://github.com/tu-org/nadro-portal.git

# 4. Crear rama de trabajo
git checkout -b feature/mi-nueva-funcionalidad

# 5. Hacer cambios y commit
git add .
git commit -m "feat: mi nueva funcionalidad"

# 6. Push a TU fork
git push origin feature/mi-nueva-funcionalidad

# 7. Crear Pull Request en GitHub
# Tu fork → Repo original (main)
```

### Opción 3: Copia Independiente (Sin Conexión)

Para crear un proyecto **completamente nuevo** basado en este:

```bash
# 1. Clonar sin historial
git clone --depth 1 https://github.com/tu-org/nadro-portal.git mi-proyecto
cd mi-proyecto

# 2. Eliminar conexión con repo original
rm -rf .git
git init
git add .
git commit -m "Initial commit from NADRO template"

# 3. Crear nuevo repositorio remoto
git remote add origin https://github.com/tu-usuario/mi-proyecto.git
git push -u origin main

# 4. Personalizar proyecto
# - package.json (name, version, description)
# - README.md (tu proyecto)
# - public/log.png (tu logo)
# - tailwind.config.ts (tus colores)
# - .env (nueva DATABASE_URL)

# 5. Setup DB
npm run db:setup
```

---

## 🔒 Protección de la Rama `main`

### Para el Dueño del Repositorio

**Configurar Branch Protection Rules** en GitHub:

1. **Settings** → **Branches** → **Add rule**

2. **Branch name pattern**: `main`

3. **Activar**:
   - ✅ **Require a pull request before merging**
     - Require approvals: `1` (o más)
     - Dismiss stale PR approvals when new commits are pushed
   - ✅ **Require status checks to pass before merging**
     - Add: `build`, `typecheck`, `lint`
   - ✅ **Require conversation resolution before merging**
   - ✅ **Require signed commits** (opcional, mayor seguridad)
   - ✅ **Include administrators** (nadie puede saltarse las reglas)
   - ✅ **Restrict who can push to matching branches**
     - Add: Solo tu usuario o equipo de admins

4. **Save changes**

### Workflow para Contribuidores

```bash
# ❌ NUNCA hacer esto:
git checkout main
git commit -m "cambios directos"  # ¡BLOQUEADO!
git push origin main              # ¡ERROR!

# ✅ SIEMPRE hacer esto:
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
# Crear Pull Request en GitHub
```

### Configuración Local (Opcional)

Prevenir commits accidentales a `main`:

```bash
# .git/hooks/pre-commit
#!/bin/sh
branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')
if [ "$branch" = "main" ]; then
  echo "❌ No puedes hacer commit directo a main"
  echo "✅ Crea una rama: git checkout -b feature/nombre"
  exit 1
fi
```

```bash
chmod +x .git/hooks/pre-commit
```

---

## 📚 Documentación

### Archivos de Documentación

| Archivo | Descripción |
|---------|-------------|
| [`MEMORIA.md`](./MEMORIA.md) | 📖 Documentación técnica completa (arquitectura, guías de modificación, instrucciones para IA) |
| [`MDM_Materiales.code-workspace`](./MDM_Materiales.code-workspace) | ⚙️ Configuración optimizada de VS Code (tasks, debug, extensions) |
| [`prisma/schema.prisma`](./prisma/schema.prisma) | 🗄️ Esquema de base de datos |
| [`src/lib/auth.ts`](./src/lib/auth.ts) | 🔐 Configuración de NextAuth.js |

### Guías Rápidas

<details>
<summary><b>🎨 Agregar una nueva escena animada</b></summary>

Ver sección completa en [`MEMORIA.md`](./MEMORIA.md#cómo-agregar-una-nueva-escena)

**Resumen**:
1. CSS variables + visibility (`logistics-scene.css`)
2. Efectos CSS + keyframes
3. TypeScript types (`LogisticsScene.tsx`)
4. DOM elements
5. Admin settings UI
6. Seed data
7. tRPC router

</details>

<details>
<summary><b>👤 Agregar un nuevo campo a User</b></summary>

```prisma
// 1. prisma/schema.prisma
model User {
  // ... campos existentes
  nuevoCampo String?
}
```

```bash
# 2. Migración
npm run db:push
```

```typescript
// 3. tRPC router (src/server/routers/users.ts)
create: adminProcedure
  .input(z.object({
    nuevoCampo: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // ...
  }),
```

```tsx
// 4. UI (src/app/(portal)/admin/users/page.tsx)
<input name="nuevoCampo" ... />
```

</details>

<details>
<summary><b>🔑 Agregar un nuevo permiso</b></summary>

```typescript
// 1. prisma/seed.ts
const permissions = [
  // ... existentes
  { key: "mi_modulo.view", name: "Ver Mi Módulo", desc: "..." },
  { key: "mi_modulo.edit", name: "Editar Mi Módulo", desc: "..." },
];
```

```bash
# 2. Re-seed
npm run db:seed
```

```typescript
// 3. Usar en tRPC
export const miRouter = router({
  getItems: protectedProcedure
    .use(requirePermission("mi_modulo.view"))
    .query(async ({ ctx }) => {
      // ...
    }),
});
```

</details>

### Stack Tecnológico Detallado

```
Frontend:
├── Next.js 15.1.0 (App Router + RSC)
├── React 19.0.0
├── TypeScript 5.x
├── Tailwind CSS 3.x
└── Anime.js (animaciones login)

Backend:
├── tRPC 11.0.0-rc (type-safe API)
├── NextAuth.js v5 (autenticación)
├── Prisma 6.2.0 (ORM)
└── PostgreSQL (base de datos)

Seguridad:
├── Argon2 (password hashing)
├── OTPAuth (2FA)
└── JWT (sesiones)

Testing:
├── Vitest (unit tests)
└── Playwright (E2E tests)

DevTools:
├── ESLint + Prettier
├── TypeScript strict mode
└── Turbopack (build)
```

---

## 🤝 Contribuir

### Workflow de Contribución

1. **Fork** el repositorio
2. **Clonar** tu fork: `git clone https://github.com/tu-usuario/nadro-portal.git`
3. **Crear rama**: `git checkout -b feature/nombre-descriptivo`
4. **Hacer cambios** siguiendo las convenciones del proyecto
5. **Commit**: `git commit -m "feat(scope): descripción"`
6. **Push**: `git push origin feature/nombre-descriptivo`
7. **Pull Request** a `main` del repo original

### Convenciones de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): agregar nueva funcionalidad
fix(scope): corregir bug
docs(scope): actualizar documentación
perf(scope): mejorar rendimiento
refactor(scope): refactorizar código
test(scope): agregar tests
chore(scope): tareas de mantenimiento
```

**Ejemplos**:
```bash
git commit -m "feat(auth): add 2FA support with OTPAuth"
git commit -m "fix(ui): toggle alignment in admin settings"
git commit -m "perf(login): GPU optimization for animated scene"
git commit -m "docs: update README with contribution guidelines"
```

### Code Review Checklist

Antes de crear un PR, verificar:

- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run build` compila correctamente
- [ ] Tests agregados/actualizados si aplica
- [ ] Documentación actualizada si aplica
- [ ] Commit messages siguen convenciones
- [ ] Sin console.logs ni debuggers
- [ ] Sin credenciales hardcodeadas

---

## 🐛 Troubleshooting

### Error: "Prisma Client not generated"

```bash
npm run db:generate
```

### Error: "Module not found: @/..."

Verificar `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Animaciones lentas en login

1. Verificar que `backdrop-blur-md` esté activo (no `-xl`)
2. Verificar que animaciones usen `transform` (no `left`/`top`)
3. Activar `prefers-reduced-motion` en SO para testing

### tRPC "Unauthorized"

1. Verificar sesión activa (login)
2. Verificar permiso asignado al rol
3. Revisar `src/server/trpc.ts` → `createContext`

### Puerto 3000 ocupado

```bash
# Cambiar puerto
PORT=3001 npm run dev

# O matar proceso
lsof -ti:3000 | xargs kill -9
```

---

## 📊 Métricas de Rendimiento

### Lighthouse Scores (Target)

| Métrica | Score |
|---------|-------|
| Performance | >90 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | >90 |

### Bundle Size

| Métrica | Tamaño |
|---------|--------|
| First Load JS | <200KB |
| Total Page Weight | <500KB |

### Optimizaciones Aplicadas

- ✅ Next.js 15 + Turbopack (build ultra-rápido)
- ✅ CSS-only animations (sin JS en animaciones)
- ✅ tRPC (sin overhead de REST)
- ✅ Prisma (queries optimizadas)
- ✅ GPU compositing (`transform` + `will-change`)
- ✅ `prefers-reduced-motion` support
- ✅ Image optimization (Next.js Image)
- ✅ Code splitting automático

---

## 🔐 Seguridad

### Autenticación

- ✅ Passwords hasheados con **Argon2** (más seguro que bcrypt)
- ✅ JWT firmado con `NEXTAUTH_SECRET`
- ✅ 2FA opcional con **OTPAuth**
- ✅ Session timeout configurable

### Autorización

- ✅ Middleware protege rutas `(portal)`
- ✅ tRPC procedures verifican permisos
- ✅ Audit log registra acciones admin
- ✅ RBAC (Role-Based Access Control)

### Best Practices

- ✅ No exponer stack traces en producción
- ✅ Validar todos los inputs (Zod)
- ✅ HTTPS obligatorio en producción
- ✅ Secrets en variables de entorno
- ⏳ Rate limiting (TODO)
- ⏳ CSRF protection (TODO)

---

## 📝 Changelog

### v0.1.0 (Actual)

**Características**:
- ✅ Sistema de autenticación con NextAuth.js v5
- ✅ RBAC (Roles + Permisos granulares)
- ✅ 10 escenas animadas en login
- ✅ Calendario automático mexicano
- ✅ Admin panel (Users, Roles, Settings)
- ✅ Optimización GPU (transform, will-change, contain)
- ✅ `prefers-reduced-motion` support
- ✅ Menú dinámico desde DB
- ✅ Audit logging
- ✅ Documentación completa (MEMORIA.md)
- ✅ VS Code workspace optimizado

**Roadmap**:
- [ ] Rate limiting
- [ ] Email notifications
- [ ] Dashboard con métricas
- [ ] Módulo de inventario
- [ ] Módulo de pedidos
- [ ] Reportes exportables (PDF/Excel)
- [ ] Modo oscuro
- [ ] PWA support

---

## 📄 Licencia

**Privado** — Uso interno NADRO

Este proyecto es propiedad de NADRO y está destinado exclusivamente para uso interno. Todos los derechos reservados.

---

## 👥 Equipo

**Desarrollado por**: Sistema NADRO
**Mantenedor**: [Tu Nombre]
**Última actualización**: Marzo 2026

---

## 🙏 Agradecimientos

- [Next.js Team](https://nextjs.org/) por el mejor framework React
- [Prisma Team](https://www.prisma.io/) por el ORM más developer-friendly
- [tRPC Team](https://trpc.io/) por hacer las APIs type-safe
- [Tailwind CSS](https://tailwindcss.com/) por el mejor sistema de utilidades
- Comunidad open-source por las herramientas increíbles

---

<div align="center">

**[⬆ Volver arriba](#-nadro-enterprise-portal)**

Hecho con ❤️ para NADRO

</div>
