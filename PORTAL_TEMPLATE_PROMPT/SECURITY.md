# 🔒 SECURITY - Portal Template Security Guidelines

> **CRITICAL**: Este documento define las medidas de seguridad obligatorias para el Portal Template.
> Las IAs DEBEN seguir estas directrices al generar o modificar código del portal.

---

## 🎯 PENTESTING RESULTS - Vulnerabilidades Encontradas y Mitigadas

### ✅ SEGURIDAD IMPLEMENTADA CORRECTAMENTE

#### 1. **Autenticación y Autorización**
- ✅ `publicProcedure` para endpoints públicos (portal, formularios públicos)
- ✅ `protectedProcedure` para endpoints autenticados (mis solicitudes)
- ✅ `adminProcedure` para operaciones administrativas
- ✅ Control de acceso por roles en formularios privados

#### 2. **Validación de Entrada (Input Validation)**
- ✅ Zod schemas en todos los endpoints tRPC
- ✅ Validación de tipos: `z.string()`, `z.email()`, `z.number()`
- ✅ Límites en queries: `z.number().min(1).max(100)`
- ✅ Sanitización de búsquedas con `mode: "insensitive"`

#### 3. **SQL Injection Protection**
- ✅ Prisma ORM previene SQL injection automáticamente
- ✅ Queries parametrizadas en todas las operaciones
- ✅ No se usa SQL raw en ningún endpoint

#### 4. **XSS (Cross-Site Scripting) Protection**
- ✅ React escapa automáticamente el contenido
- ✅ No se usa `dangerouslySetInnerHTML` en el portal
- ✅ Validación de campos de formulario en frontend y backend

---

## ⚠️ VULNERABILIDADES IDENTIFICADAS Y FIXES NECESARIOS

### 🔴 CRÍTICO - Requiere Fix Inmediato

#### 1. **n8n Webhook URL Exposure**
**Problema**: El webhook URL de n8n se expone en el frontend
```typescript
// ❌ VULNERABLE - src/server/routers/forms.ts:106
n8nWebhookUrl: form.n8nWebhookUrl,  // Expuesto al cliente
```

**Impacto**: 
- Atacantes pueden enviar datos falsos al webhook
- Posible DDoS al webhook de n8n
- Bypass de validaciones del formulario

**Fix Requerido**:
```typescript
// ✅ SEGURO - NO exponer webhook URL
return {
  id: form.id,
  name: form.name,
  slug: form.slug,
  description: form.description,
  version: form.version,
  isPublic: form.isPublic,
  // n8nWebhookUrl: form.n8nWebhookUrl,  // ❌ REMOVIDO
  fields: form.fields.map((f) => ({...}))
};
```

**Solución**: Mover el webhook call al backend en el submit del formulario.

---

#### 2. **Rate Limiting Ausente**
**Problema**: No hay rate limiting en endpoints públicos

**Impacto**:
- DDoS attacks en `/portal`, `/f/{slug}`
- Spam de formularios
- Abuso de búsqueda

**Fix Requerido**:
```typescript
// Implementar rate limiting con redis o memoria
import rateLimit from 'express-rate-limit';

const portalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas solicitudes, intenta más tarde'
});
```

---

#### 3. **CSRF Protection**
**Problema**: No hay tokens CSRF en formularios públicos

**Impacto**:
- Posible CSRF en submit de formularios
- Acciones no autorizadas

**Fix Requerido**:
```typescript
// Implementar CSRF tokens en Next.js
import { getCsrfToken } from "next-auth/react";

// En el formulario
const csrfToken = await getCsrfToken();
```

---

### 🟡 MEDIO - Mejoras Recomendadas

#### 4. **Input Sanitization en formData**
**Problema**: `formData` acepta `z.record(z.any())`
```typescript
// ⚠️ DÉBIL - src/server/routers/servicePortal.ts:154
formData: z.record(z.any()),  // Acepta cualquier cosa
```

**Fix Recomendado**:
```typescript
// ✅ MEJOR - Validar contra el schema del formulario
formData: z.record(z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string())
])).refine((data) => {
  // Validar contra campos del formulario
  return validateAgainstFormSchema(data, formId);
})
```

---

#### 5. **Email Validation en Requests**
**Problema**: Email opcional sin validación estricta
```typescript
requesterEmail: z.string().email().optional(),
```

**Fix Recomendado**:
```typescript
requesterEmail: z.string()
  .email({ message: "Email inválido" })
  .max(255)
  .optional()
  .refine((email) => {
    if (!email) return true;
    // Validar dominios permitidos si es necesario
    return !email.includes('+'); // Prevenir email aliasing abuse
  })
```

---

#### 6. **File Upload Security (Futuro)**
**Problema**: Si se implementa upload de archivos, falta validación

**Fix Requerido**:
```typescript
// Validación de archivos
const fileSchema = z.object({
  name: z.string().max(255),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
  type: z.enum([
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword'
  ]),
  content: z.string() // base64
}).refine((file) => {
  // Validar magic bytes, no solo extensión
  return validateFileSignature(file.content, file.type);
});
```

---

### 🟢 BAJO - Hardening Adicional

#### 7. **Logging y Auditoría**
**Recomendación**: Agregar logging de acciones sensibles
```typescript
// Log de accesos a formularios privados
await ctx.prisma.auditLog.create({
  data: {
    userId: ctx.user.id,
    action: 'FORM_ACCESS',
    resource: `form:${form.id}`,
    ip: ctx.req.headers['x-forwarded-for'],
    userAgent: ctx.req.headers['user-agent']
  }
});
```

---

#### 8. **Content Security Policy (CSP)**
**Recomendación**: Agregar headers CSP en Next.js
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

---

## 🛡️ SECURITY CHECKLIST - Para IAs

Antes de generar código del portal, verificar:

### Backend (tRPC Routers)
- [ ] ¿Usa `publicProcedure`, `protectedProcedure` o `adminProcedure` correctamente?
- [ ] ¿Todos los inputs tienen Zod validation?
- [ ] ¿Los límites de queries están definidos? (max 100)
- [ ] ¿Se valida la propiedad de recursos antes de modificar?
- [ ] ¿Los webhooks NO se exponen al frontend?
- [ ] ¿Los errores NO revelan información sensible?

### Frontend (React Components)
- [ ] ¿Se usa `dangerouslySetInnerHTML`? (❌ Evitar)
- [ ] ¿Los inputs tienen validación HTML5?
- [ ] ¿Los formularios tienen validación antes de submit?
- [ ] ¿Se sanitizan los datos del usuario antes de mostrar?
- [ ] ¿Los tokens de autenticación están en httpOnly cookies?

### Formularios Públicos
- [ ] ¿El formulario verifica `isPublic` y `status: PUBLISHED`?
- [ ] ¿Los formularios privados verifican roles del usuario?
- [ ] ¿El submit del formulario valida en backend?
- [ ] ¿Los webhooks se llaman desde el backend, no el frontend?

### n8n Integration
- [ ] ¿El webhook URL está en variables de entorno?
- [ ] ¿El webhook tiene autenticación (API key, HMAC)?
- [ ] ¿Se valida la firma del webhook en n8n?
- [ ] ¿Los datos sensibles están encriptados antes de enviar?

---

## 🔐 SECRETS MANAGEMENT

### Variables de Entorno Requeridas
```bash
# .env (NUNCA commitear)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..." # 32+ caracteres random
NEXTAUTH_URL="https://tu-dominio.com"

# n8n Webhooks
N8N_WEBHOOK_BASE_URL="https://n8n.tu-dominio.com"
N8N_WEBHOOK_SECRET="..." # Para firmar requests
```

### Secrets en Prisma
```typescript
// Encriptar datos sensibles en DB
import { encrypt, decrypt } from '@/lib/security/encryption';

// Al guardar
const encryptedData = encrypt(sensitiveData, process.env.ENCRYPTION_KEY);

// Al leer
const decryptedData = decrypt(encryptedData, process.env.ENCRYPTION_KEY);
```

---

## 🚨 INCIDENT RESPONSE

### Si se detecta un ataque:

1. **Deshabilitar el portal inmediatamente**
```sql
UPDATE app_settings 
SET value = 'false' 
WHERE key = 'service_portal_enabled';
```

2. **Revisar logs de acceso**
```typescript
// Buscar patrones sospechosos
await prisma.auditLog.findMany({
  where: {
    createdAt: { gte: new Date(Date.now() - 24*60*60*1000) },
    action: { in: ['FORM_SUBMIT', 'FORM_ACCESS'] }
  },
  orderBy: { createdAt: 'desc' }
});
```

3. **Rotar secrets**
- Cambiar `NEXTAUTH_SECRET`
- Cambiar `N8N_WEBHOOK_SECRET`
- Invalidar sesiones activas

4. **Notificar a usuarios afectados**

---

## 📋 COMPLIANCE

### GDPR / Privacidad
- ✅ Consentimiento explícito para datos personales
- ✅ Derecho al olvido (delete user data)
- ✅ Portabilidad de datos (export user data)
- ✅ Encriptación de datos sensibles en tránsito (HTTPS)
- ⚠️ Encriptación de datos en reposo (implementar)

### Retención de Datos
```typescript
// Política de retención
const RETENTION_POLICY = {
  formSubmissions: 365, // días
  auditLogs: 90,
  userSessions: 30
};

// Cleanup automático
async function cleanupOldData() {
  const cutoffDate = new Date(Date.now() - RETENTION_POLICY.formSubmissions * 24*60*60*1000);
  
  await prisma.formSubmission.deleteMany({
    where: {
      submittedAt: { lt: cutoffDate },
      status: 'COMPLETED'
    }
  });
}
```

---

## 🔧 FIXES PRIORITARIOS

### 1. Remover n8n Webhook URL del Frontend
**Prioridad**: 🔴 CRÍTICA  
**Archivo**: `src/server/routers/forms.ts:106`  
**Acción**: Comentar línea que expone `n8nWebhookUrl`

### 2. Implementar Rate Limiting
**Prioridad**: 🔴 CRÍTICA  
**Archivos**: Middleware de Next.js  
**Acción**: Agregar rate limiting a rutas públicas

### 3. Validar formData contra Schema
**Prioridad**: 🟡 MEDIA  
**Archivo**: `src/server/routers/servicePortal.ts:154`  
**Acción**: Validar datos contra campos del formulario

### 4. Agregar CSRF Protection
**Prioridad**: 🟡 MEDIA  
**Archivos**: Formularios públicos  
**Acción**: Implementar tokens CSRF

---

## 📚 RECURSOS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [tRPC Security](https://trpc.io/docs/server/authorization)
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection)

---

**Última actualización**: 2026-03-21  
**Versión**: 1.0.0  
**Responsable**: Security Team
