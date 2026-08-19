# 🚀 Configuración Rápida de SSO OAuth 2.0

Guía de configuración en 5 minutos para implementar SSO en tu aplicación.

---

## ✅ Paso 1: Configurar Variables de Entorno

Edita tu archivo `.env` y agrega las siguientes variables:

```bash
# ==========================================
# SSO OAuth 2.0 - CONFIGURACIÓN OBLIGATORIA
# ==========================================

# Endpoints del sistema SSO
SSO_AUTHORIZE_URL="https://appstore.nadro.dev/api/oauth/authorize"
SSO_TOKEN_URL="https://appstore.nadro.dev/api/oauth/token"
SSO_USERINFO_URL="https://appstore.nadro.dev/api/oauth/userinfo"

# TUS CREDENCIALES (proporcionadas por el administrador del SSO)
SSO_CLIENT_ID="cdb065ea-0b25-458e-9e45-1cd476f93b66"
SSO_CLIENT_SECRET="nsk_Yad9e_6SdUEafmWAdDnvpBOH440p8rPDMljS96TbJxw"

# URL de tu aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Secreto para JWT (genera uno con: openssl rand -base64 32)
AUTH_SECRET="tu_secreto_aqui"
```

---

## ✅ Paso 2: Registrar Callback URL

Asegúrate de que tu **Callback URL** esté registrado en el sistema SSO:

```
http://localhost:3001/api/auth/sso/callback
```

Para producción:
```
https://tu-dominio.com/api/auth/sso/callback
```

---

## ✅ Paso 3: Probar el Login

1. Inicia tu aplicación:
   ```bash
   npm run dev
   ```

2. Abre tu navegador en `http://localhost:3001/login`

3. Haz click en el botón **"Login con SSO"**

4. Serás redirigido al sistema SSO para autenticarte

5. Después de autenticarte, serás redirigido de vuelta a tu aplicación

---

## 📋 Flujo Completo

```
Usuario → Click "Login con SSO" 
       → Redirige a sistema SSO externo
       → Usuario ingresa credenciales en SSO
       → SSO valida y redirige con código
       → Tu app intercambia código por token
       → Tu app obtiene datos del usuario
       → Tu app busca usuario en BD local
       → Tu app crea sesión
       → Usuario accede al dashboard
```

---

## 🔧 Archivos Implementados

### 1. **Ruta de Inicio de SSO**
`src/app/api/auth/sso/login/route.ts`
- Genera state CSRF
- Redirige al sistema SSO

### 2. **Callback Handler**
`src/app/api/auth/sso/callback/route.ts`
- Valida state
- Intercambia código por token
- Obtiene datos del usuario
- Crea sesión

### 3. **Utilidades de Mapeo**
`src/lib/auth/sso-utils.ts`
- Mapea roles SSO a roles locales
- Funciones de validación

### 4. **Logout**
`src/app/api/auth/sso/logout/route.ts`
- Limpia sesión
- Redirige al login

### 5. **Botón de Login**
`src/app/(auth)/login/page.tsx`
- Botón "Login con SSO"
- Manejo de errores

---

## 🎯 Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/sso/login` | GET | Inicia el flujo SSO |
| `/api/auth/sso/callback` | GET | Recibe el código y completa el login |
| `/api/auth/sso/logout` | GET/POST | Cierra la sesión |

---

## 🛡️ Seguridad Implementada

✅ **Protección CSRF** con state aleatorio  
✅ **Cookies httpOnly** (no accesibles desde JavaScript)  
✅ **Validación de state** en el callback  
✅ **Tokens JWT** firmados con secreto  
✅ **HTTPS** en producción (configurar en servidor)  
✅ **Audit logs** de intentos de login  

---

## 🔍 Verificar que Funciona

### 1. Logs en Consola

Deberías ver estos logs al hacer login:

```
[SSO OAuth] Iniciando flujo de autenticación SSO...
[SSO OAuth] 🔐 State generado para protección CSRF
[SSO OAuth] ✅ Redirigiendo al sistema SSO externo...
[SSO OAuth] Callback recibido
[SSO OAuth] 🔄 Intercambiando código por access_token...
[SSO OAuth] ✅ Access token obtenido exitosamente
[SSO OAuth] 🔄 Obteniendo información del usuario...
[SSO OAuth] ✅ Usuario SSO autenticado: usuario@example.com
[SSO OAuth] 🔍 Buscando usuario en BD local: usuario@example.com
[SSO OAuth] ✅ Usuario encontrado en BD local
[SSO OAuth] ✅ Sesión creada exitosamente
[SSO OAuth] 🚀 Redirigiendo a dashboard...
```

### 2. Cookies en el Navegador

Después del login exitoso, deberías tener estas cookies:

- `authjs.session-token` (desarrollo)
- `__Secure-authjs.session-token` (producción)

### 3. Sesión Activa

Puedes verificar la sesión en cualquier componente:

```typescript
import { getSessionUser } from "@/lib/auth/auth";

export default async function MiComponente() {
  const user = await getSessionUser();
  
  if (user) {
    console.log("Usuario autenticado:", user.email);
    console.log("Roles:", user.roles);
    console.log("Permisos:", user.permissions);
  }
  
  return <div>Hola {user?.name}</div>;
}
```

---

## ⚠️ Errores Comunes

### Error: "Usuario no encontrado en BD local"

**Causa**: El usuario existe en el SSO pero no en tu base de datos.

**Solución**:
1. Registra al usuario manualmente en tu BD
2. O habilita la creación automática (ver documentación completa)

### Error: "State inválido o expirado"

**Causa**: La cookie de state no se guardó o expiró.

**Solución**:
1. Verifica que las cookies estén habilitadas
2. Intenta el login nuevamente
3. Limpia las cookies del navegador

### Error: "Credenciales SSO no configuradas"

**Causa**: Faltan las variables de entorno.

**Solución**:
1. Verifica que `.env` tenga `SSO_CLIENT_ID` y `SSO_CLIENT_SECRET`
2. Reinicia el servidor después de cambiar `.env`

---

## 🎨 Personalizar Mapeo de Roles

Edita `src/lib/auth/sso-utils.ts` para agregar tus propios roles:

```typescript
export function mapSSORole(ssoRole: string): string | null {
  const roleMapping: Record<string, string> = {
    // Roles del sistema SSO → Roles de tu sistema
    "Administrador": "Administrador",
    "Developer": "Desarrollador",
    "Usuario Externo": "Usuario",
    
    // Agrega tus roles aquí
    "Mi Rol SSO": "Mi Rol Local",
  };
  
  return roleMapping[ssoRole] || null;
}
```

---

## 🚀 Desplegar a Producción

### 1. Actualizar Variables de Entorno

```bash
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
SSO_CLIENT_ID="tu_client_id_produccion"
SSO_CLIENT_SECRET="tu_client_secret_produccion"
AUTH_SECRET="secreto_seguro_produccion"
```

### 2. Registrar Callback URL de Producción

Registra en el sistema SSO:
```
https://tu-dominio.com/api/auth/sso/callback
```

### 3. Habilitar HTTPS

Asegúrate de que tu servidor use HTTPS. Las cookies seguras solo funcionan con HTTPS.

### 4. Probar en Producción

1. Accede a `https://tu-dominio.com/login`
2. Haz click en "Login con SSO"
3. Verifica que el flujo completo funcione

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `docs/SSO_OAUTH_GUIDE.md` - Guía completa con diagramas y troubleshooting
- `.env.example` - Todas las variables de entorno disponibles

---

## ✅ Checklist Final

- [ ] Variables de entorno configuradas
- [ ] Callback URL registrado en el SSO
- [ ] Login SSO funciona correctamente
- [ ] Roles se mapean correctamente
- [ ] Logout funciona
- [ ] Rutas protegidas funcionan
- [ ] Logs se muestran en consola
- [ ] Probado en desarrollo
- [ ] Configurado para producción
- [ ] Probado en producción

---

## 🆘 ¿Necesitas Ayuda?

1. Revisa los logs en la consola del servidor
2. Consulta `docs/SSO_OAUTH_GUIDE.md` para troubleshooting
3. Verifica que todas las variables de entorno estén correctas
4. Contacta al administrador del sistema SSO si hay problemas con los endpoints

---

**¡Listo! Tu aplicación ahora tiene SSO OAuth 2.0 completamente funcional.** 🎉
