# 🔐 Guía Completa de SSO OAuth 2.0

Esta guía explica cómo funciona el sistema de autenticación SSO OAuth 2.0 implementado en esta aplicación Next.js.

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Flujo de Autenticación](#flujo-de-autenticación)
3. [Endpoints Implementados](#endpoints-implementados)
4. [Mapeo de Roles](#mapeo-de-roles)
5. [Protección de Rutas](#protección-de-rutas)
6. [Manejo de Errores](#manejo-de-errores)
7. [Logout](#logout)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Copia `.env.example` a `.env` y configura las siguientes variables:

```bash
# Endpoints del sistema SSO externo
SSO_AUTHORIZE_URL="https://appstore.nadro.dev/api/oauth/authorize"
SSO_TOKEN_URL="https://appstore.nadro.dev/api/oauth/token"
SSO_USERINFO_URL="https://appstore.nadro.dev/api/oauth/userinfo"

# Credenciales de tu aplicación
SSO_CLIENT_ID="cdb065ea-0b25-458e-9e45-1cd476f93b66"
SSO_CLIENT_SECRET="nsk_Yad9e_6SdUEafmWAdDnvpBOH440p8rPDMljS96TbJxw"

# URL de tu aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Secreto para firmar JWT (genera uno con: openssl rand -base64 32)
AUTH_SECRET="tu_secreto_aqui"
```

### 2. Callback URL

Asegúrate de que tu **Callback URL** esté registrado en el sistema SSO:

- **Desarrollo**: `http://localhost:3001/api/auth/sso/callback`
- **Producción**: `https://tu-dominio.com/api/auth/sso/callback`

---

## 🔄 Flujo de Autenticación

### Diagrama de Flujo

```
┌─────────┐         ┌──────────┐         ┌────────────┐         ┌──────────┐
│ Usuario │         │ Tu App   │         │ Sistema    │         │ Base de  │
│         │         │ Next.js  │         │ SSO        │         │ Datos    │
└────┬────┘         └────┬─────┘         └─────┬──────┘         └────┬─────┘
     │                   │                     │                      │
     │ 1. Click "Login   │                     │                      │
     │    con SSO"       │                     │                      │
     ├──────────────────>│                     │                      │
     │                   │                     │                      │
     │                   │ 2. Genera state     │                      │
     │                   │    (CSRF token)     │                      │
     │                   │                     │                      │
     │                   │ 3. Redirige a SSO   │                      │
     │                   │    con client_id,   │                      │
     │                   │    redirect_uri,    │                      │
     │                   │    state            │                      │
     │                   ├────────────────────>│                      │
     │                   │                     │                      │
     │                   │                     │ 4. Usuario se        │
     │                   │                     │    autentica         │
     │<──────────────────┼─────────────────────┤                      │
     │                   │                     │                      │
     │                   │ 5. Redirige con     │                      │
     │                   │    code y state     │                      │
     │<──────────────────┼─────────────────────┤                      │
     │                   │                     │                      │
     │ 6. Callback con   │                     │                      │
     │    code y state   │                     │                      │
     ├──────────────────>│                     │                      │
     │                   │                     │                      │
     │                   │ 7. Valida state     │                      │
     │                   │                     │                      │
     │                   │ 8. Intercambia code │                      │
     │                   │    por access_token │                      │
     │                   ├────────────────────>│                      │
     │                   │                     │                      │
     │                   │ 9. Recibe           │                      │
     │                   │    access_token     │                      │
     │                   │<────────────────────┤                      │
     │                   │                     │                      │
     │                   │ 10. Obtiene datos   │                      │
     │                   │     del usuario     │                      │
     │                   ├────────────────────>│                      │
     │                   │                     │                      │
     │                   │ 11. Recibe user     │                      │
     │                   │     info (email,    │                      │
     │                   │     roles, etc)     │                      │
     │                   │<────────────────────┤                      │
     │                   │                     │                      │
     │                   │ 12. Busca usuario   │                      │
     │                   │     en BD local     │                      │
     │                   ├─────────────────────┼─────────────────────>│
     │                   │                     │                      │
     │                   │ 13. Usuario         │                      │
     │                   │     encontrado      │                      │
     │                   │<─────────────────────┼──────────────────────┤
     │                   │                     │                      │
     │                   │ 14. Crea sesión JWT │                      │
     │                   │     con roles y     │                      │
     │                   │     permisos        │                      │
     │                   │                     │                      │
     │ 15. Redirige a    │                     │                      │
     │     dashboard     │                     │                      │
     │<──────────────────┤                     │                      │
     │                   │                     │                      │
```

### Pasos Detallados

1. **Usuario hace click en "Login con SSO"**
   - Se ejecuta `handleSSOLogin()` en el cliente
   - Redirige a `/api/auth/sso/login`

2. **Generación de State (CSRF Protection)**
   - Se genera un token aleatorio de 32 bytes
   - Se guarda en una cookie httpOnly con duración de 10 minutos
   - Se construye la URL de autorización con los parámetros necesarios

3. **Redirección al Sistema SSO**
   - URL: `https://appstore.nadro.dev/api/oauth/authorize`
   - Parámetros:
     - `client_id`: Tu Client ID
     - `redirect_uri`: Tu Callback URL
     - `response_type`: "code"
     - `state`: Token CSRF generado

4. **Usuario se Autentica en el SSO**
   - El usuario ingresa sus credenciales en el sistema SSO externo
   - El SSO valida las credenciales

5. **Redirección al Callback**
   - El SSO redirige a: `http://localhost:3001/api/auth/sso/callback?code=XXX&state=YYY`

6. **Validación de State**
   - Se compara el state recibido con el guardado en la cookie
   - Si no coinciden, se rechaza la petición (protección CSRF)

7. **Intercambio de Código por Token**
   - POST a `https://appstore.nadro.dev/api/oauth/token`
   - Body:
     ```json
     {
       "code": "XXX",
       "client_id": "cdb065ea-0b25-458e-9e45-1cd476f93b66",
       "client_secret": "nsk_Yad9e_6SdUEafmWAdDnvpBOH440p8rPDMljS96TbJxw",
       "redirect_uri": "http://localhost:3001/api/auth/sso/callback",
       "grant_type": "authorization_code"
     }
     ```
   - Respuesta:
     ```json
     {
       "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "token_type": "Bearer",
       "expires_in": 3600
     }
     ```

8. **Obtención de Datos del Usuario**
   - GET a `https://appstore.nadro.dev/api/oauth/userinfo`
   - Header: `Authorization: Bearer ACCESS_TOKEN`
   - Respuesta:
     ```json
     {
       "id": "user-123",
       "email": "usuario@example.com",
       "username": "usuario",
       "name": "Usuario Ejemplo",
       "roles": ["Administrador", "Developer"]
     }
     ```

9. **Búsqueda en Base de Datos Local**
   - Se busca el usuario por email o username
   - Si no existe, se rechaza el acceso
   - Si existe, se obtienen sus roles y permisos locales

10. **Creación de Sesión**
    - Se crea un JWT con NextAuth
    - Se incluyen: id, email, username, roles, permissions, ssoToken
    - Se establece una cookie httpOnly con el token
    - Duración: 8 horas

11. **Redirección al Dashboard**
    - El usuario es redirigido a `/dashboard`
    - La sesión está activa y puede acceder a rutas protegidas

---

## 🛣️ Endpoints Implementados

### 1. `/api/auth/sso/login` (GET)

**Propósito**: Iniciar el flujo de autenticación SSO

**Proceso**:
- Genera state CSRF
- Guarda state en cookie
- Redirige al sistema SSO

**Ejemplo de uso**:
```typescript
// Desde el cliente
function handleSSOLogin() {
  window.location.href = "/api/auth/sso/login";
}
```

---

### 2. `/api/auth/sso/callback` (GET)

**Propósito**: Recibir el código de autorización y completar el login

**Parámetros esperados**:
- `code`: Código de autorización del SSO
- `state`: Token CSRF para validación

**Proceso**:
1. Valida state
2. Intercambia code por access_token
3. Obtiene datos del usuario
4. Busca usuario en BD local
5. Crea sesión
6. Redirige al dashboard

**Errores posibles**:
- `sso_no_code`: No se recibió código
- `sso_no_state`: No se recibió state
- `sso_invalid_state`: State inválido o expirado
- `sso_token_failed`: Error al obtener token
- `sso_userinfo_failed`: Error al obtener datos del usuario
- `sso_user_not_found`: Usuario no existe en BD local

---

### 3. `/api/auth/sso/logout` (GET/POST)

**Propósito**: Cerrar sesión del usuario

**Proceso**:
- Limpia cookie de sesión
- Limpia cookie de state
- Redirige al login

**Ejemplo de uso**:
```typescript
// Desde el cliente
async function handleLogout() {
  await fetch("/api/auth/sso/logout", { method: "POST" });
  window.location.href = "/login";
}

// O simplemente:
window.location.href = "/api/auth/sso/logout";
```

---

## 👥 Mapeo de Roles

El archivo `src/lib/auth/sso-utils.ts` contiene las funciones de mapeo de roles.

### Mapeo Predefinido

```typescript
const roleMapping: Record<string, string> = {
  // Roles administrativos
  "Administrador": "Administrador",
  "Admin": "Administrador",
  "Administrator": "Administrador",
  
  // Roles de desarrollo
  "Developer": "Desarrollador",
  "Desarrollador": "Desarrollador",
  
  // Roles de usuario
  "Usuario": "Usuario",
  "User": "Usuario",
  "Usuario Externo": "Usuario",
  
  // ... más roles
};
```

### Personalizar Mapeo

Para agregar nuevos roles, edita `src/lib/auth/sso-utils.ts`:

```typescript
export function mapSSORole(ssoRole: string): string | null {
  const roleMapping: Record<string, string> = {
    // ... roles existentes ...
    
    // Agregar tu nuevo rol
    "Mi Rol SSO": "Mi Rol Local",
  };
  
  return roleMapping[ssoRole] || null;
}
```

### Crear Usuarios Automáticamente

Si quieres crear usuarios automáticamente cuando se autentican por primera vez, descomenta el bloque en `src/app/api/auth/sso/callback/route.ts`:

```typescript
// Líneas 186-228
if (!localUser) {
  console.log(`[SSO OAuth] 🆕 Creando nuevo usuario: ${ssoUser.email}`);
  
  const { mapSSORole } = await import("@/lib/auth/sso-utils");
  const localRoleNames = (ssoUser.roles || []).map(mapSSORole).filter(Boolean);
  
  const roles = await prisma.role.findMany({
    where: { name: { in: localRoleNames } },
  });
  
  localUser = await prisma.user.create({
    data: {
      email: ssoUser.email,
      username: ssoUser.username || ssoUser.email.split("@")[0],
      name: ssoUser.name || ssoUser.email,
      passwordHash: "",
      status: "ACTIVE",
      userRoles: {
        create: roles.map(role => ({ roleId: role.id })),
      },
    },
    // ... includes ...
  });
}
```

---

## 🛡️ Protección de Rutas

### Middleware Actual

El archivo `src/middleware.ts` ya protege las rutas:

```typescript
export const config = {
  matcher: [
    "/((?!api/auth|api/auth/sso|_next/static|_next/image|favicon.ico|log.png|f/).*)",
  ],
};
```

### Verificar Permisos en Componentes

```typescript
import { getSessionUser, hasPermission } from "@/lib/auth/auth";

export default async function AdminPage() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (!hasPermission(user, "admin.access")) {
    return <div>No tienes permisos para acceder a esta página</div>;
  }
  
  return <div>Panel de Administración</div>;
}
```

### Verificar Roles

```typescript
import { getSessionUser, hasRole } from "@/lib/auth/auth";

export default async function DeveloperPage() {
  const user = await getSessionUser();
  
  if (!hasRole(user, "Desarrollador")) {
    return <div>Solo para desarrolladores</div>;
  }
  
  return <div>Herramientas de Desarrollo</div>;
}
```

---

## ⚠️ Manejo de Errores

### Errores en el Login

Todos los errores redirigen a `/login?error=CODIGO&message=MENSAJE`

| Código | Descripción | Solución |
|--------|-------------|----------|
| `sso_no_code` | No se recibió código de autorización | Verificar configuración del SSO |
| `sso_no_state` | Falta parámetro state | Verificar que la cookie se esté guardando |
| `sso_invalid_state` | State inválido o expirado | Intentar nuevamente el login |
| `sso_config` | Credenciales SSO no configuradas | Configurar `SSO_CLIENT_ID` y `SSO_CLIENT_SECRET` |
| `sso_token_failed` | Error al obtener token | Verificar `SSO_TOKEN_URL` y credenciales |
| `sso_no_token` | No se recibió access_token | Verificar respuesta del endpoint de token |
| `sso_userinfo_failed` | Error al obtener datos del usuario | Verificar `SSO_USERINFO_URL` |
| `sso_incomplete_user` | Datos de usuario incompletos | Verificar que el SSO devuelva email e id |
| `sso_user_not_found` | Usuario no existe en BD local | Registrar al usuario en la BD o habilitar creación automática |
| `sso_init_error` | Error al iniciar SSO | Verificar configuración general |
| `sso_error` | Error inesperado | Revisar logs del servidor |

### Logs en Consola

Todos los pasos del flujo SSO se registran en la consola:

```
[SSO OAuth] Iniciando flujo de autenticación SSO...
[SSO OAuth] 🔐 State generado para protección CSRF
[SSO OAuth] 🔗 URL de autorización construida
[SSO OAuth] ✅ Redirigiendo al sistema SSO externo...
[SSO OAuth] Callback recibido
[SSO OAuth] 🔄 Intercambiando código por access_token...
[SSO OAuth] ✅ Access token obtenido exitosamente
[SSO OAuth] 🔄 Obteniendo información del usuario...
[SSO OAuth] ✅ Usuario SSO autenticado: usuario@example.com (ID: user-123)
[SSO OAuth] 📋 Roles SSO recibidos: ["Administrador", "Developer"]
[SSO OAuth] 🔍 Buscando usuario en BD local: usuario@example.com
[SSO OAuth] ✅ Usuario encontrado en BD local: usuario@example.com (ID: abc123)
[SSO OAuth] 👤 Roles locales: Administrador, Desarrollador
[SSO OAuth] 🔑 Permisos: 15 permisos asignados
[SSO OAuth] ✅ Sesión creada exitosamente para usuario@example.com
[SSO OAuth] 🚀 Redirigiendo a dashboard...
```

---

## 🚪 Logout

### Logout Simple (Solo Local)

```typescript
// Opción 1: Redirigir a la ruta de logout
window.location.href = "/api/auth/sso/logout";

// Opción 2: Usar fetch
await fetch("/api/auth/sso/logout", { method: "POST" });
window.location.href = "/login";
```

### Logout Global (SSO + Local)

Si el sistema SSO tiene un endpoint de logout global, puedes modificar `src/app/api/auth/sso/logout/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  // ... código existente ...
  
  // Limpiar sesión local
  response.cookies.delete(cookieName);
  response.cookies.delete("sso_state");
  
  // Redirigir al logout del SSO externo
  const ssoLogoutUrl = `${process.env.SSO_LOGOUT_URL}?redirect_uri=${APP_URL}/login`;
  return NextResponse.redirect(ssoLogoutUrl);
}
```

---

## 🔧 Troubleshooting

### Problema: "State inválido o expirado"

**Causa**: La cookie de state no se está guardando o expiró

**Solución**:
1. Verificar que las cookies estén habilitadas en el navegador
2. Verificar que `sameSite: "lax"` sea compatible con tu configuración
3. Aumentar el `maxAge` de la cookie de state si el proceso toma más de 10 minutos

### Problema: "Usuario no encontrado en BD local"

**Causa**: El usuario existe en el SSO pero no en tu base de datos

**Solución**:
1. Registrar manualmente al usuario en tu BD
2. Habilitar la creación automática de usuarios (ver sección de Mapeo de Roles)

### Problema: "Error al obtener token"

**Causa**: Credenciales incorrectas o endpoint inaccesible

**Solución**:
1. Verificar `SSO_CLIENT_ID` y `SSO_CLIENT_SECRET`
2. Verificar que `SSO_TOKEN_URL` sea accesible
3. Verificar que el `redirect_uri` esté registrado en el SSO

### Problema: "CORS errors"

**Causa**: El sistema SSO no permite peticiones desde tu dominio

**Solución**:
1. Contactar al administrador del SSO para agregar tu dominio a la whitelist
2. En desarrollo, verificar que uses `http://localhost:3001` exactamente como está registrado

### Problema: "Sesión no persiste"

**Causa**: Cookie no se está guardando correctamente

**Solución**:
1. Verificar que `AUTH_SECRET` esté configurado
2. Verificar que las cookies estén habilitadas
3. En producción, asegurarse de usar HTTPS

---

## 📝 Checklist de Implementación

- [ ] Configurar variables de entorno en `.env`
- [ ] Registrar Callback URL en el sistema SSO
- [ ] Probar flujo completo de login
- [ ] Verificar que los roles se mapeen correctamente
- [ ] Probar manejo de errores (usuario no encontrado, state inválido, etc.)
- [ ] Implementar logout
- [ ] Proteger rutas según roles y permisos
- [ ] Configurar HTTPS en producción
- [ ] Actualizar Callback URL en producción
- [ ] Probar en producción

---

## 🔒 Mejores Prácticas de Seguridad

1. **NUNCA** subas el `.env` a Git
2. **SIEMPRE** usa HTTPS en producción
3. **VALIDA** el state en cada callback
4. **LIMITA** el tiempo de vida de las cookies
5. **REGISTRA** todos los intentos de login en audit logs
6. **REVISA** los logs regularmente para detectar intentos sospechosos
7. **ROTA** el `CLIENT_SECRET` periódicamente
8. **USA** variables de entorno diferentes para desarrollo y producción

---

## 📚 Recursos Adicionales

- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 🆘 Soporte

Si tienes problemas con la implementación:

1. Revisa los logs en la consola del servidor
2. Verifica que todas las variables de entorno estén configuradas
3. Consulta la sección de Troubleshooting
4. Contacta al administrador del sistema SSO si el problema es con los endpoints externos
