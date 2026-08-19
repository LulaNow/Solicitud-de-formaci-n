# Integración con n8n

## 📋 Descripción

Este documento describe la integración del sistema de solicitudes de formación con n8n para automatización de workflows.

## 🔧 Configuración

### Variables de Entorno

Agrega las siguientes variables en tu archivo `.env`:

```env
# n8n Integration - Configuración de Webhooks
N8N_WEBHOOK_URL="https://lula.app.n8n.cloud/webhook-test/iniciar-solicitud"
N8N_WEBHOOK_TOKEN="110288210288"
```

### Configuración para Producción

Cuando migres a producción, actualiza las variables:

```env
N8N_WEBHOOK_URL="https://tu-n8n-produccion.com/webhook/iniciar-solicitud"
N8N_WEBHOOK_TOKEN="tu_token_produccion_seguro"
```

## 📊 Estructura de Datos

### Request a n8n

**Endpoint:** `POST /api/solicitudes/enviar`

**Headers:**
```
Content-Type: application/json
Beca-Windsurf-Token: 110288210288
```

**Body:**
```json
{
  "usuario_id": "user_id_from_session",
  "tipo_proceso": "Solicitud de formación",
  "datos_entrada": {
    "fecha": "2026-06-17",
    "cdr": "Sí",
    "evento": "Curso",
    "modalidad": "Presencial",
    "tipo": "Técnica",
    "autorizador": "PHILIPPE ABEL THOMAS MENDEZ",
    "empresa": "Nadro",
    "no_empleado": "138073",
    "nombre": "IRMA SANCHEZ VAZQUEZ",
    "puesto": "ANALISTA SR FISCAL",
    "fecha_ingreso": "03/01/2012",
    "antiguedad": "14 años, 4 meses, 19 días",
    "ceco": "100FI00650 - GERENCIA FISCAL",
    "funciones": "Análisis fiscal y tributario",
    "nombre_curso": "Curso de Actualización Fiscal 2026",
    "institucion": "IMCP",
    "fecha_inicio": "2026-07-01",
    "fecha_fin": "2026-07-15",
    "duracion": "40 horas",
    "tipo_programa": "Curso",
    "beneficio": "Actualización profesional",
    "tipo_moneda": "MXN",
    "costo": "15,000.00",
    "tipo_iva": "16%",
    "iva": "2,400.00",
    "retencion_iva": "1,600.00",
    "retencion_isr": "1,500.00",
    "total": "14,300.00"
  }
}
```

### Response de n8n

**Éxito:**
```json
{
  "success": true,
  "solicitud_id": "uuid-de-la-solicitud",
  "numero_ticket": "REQ-1001",
  "message": "Solicitud recibida y procesada"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

## 🗄️ Tablas de Base de Datos

### solicitudes
Almacena las solicitudes principales.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único de la solicitud |
| numero_ticket | VARCHAR(20) | Número de ticket (REQ-1001) |
| usuario_id | UUID | ID del usuario que creó la solicitud |
| tipo_proceso | VARCHAR(50) | Tipo: solicitud_formacion |
| estado | VARCHAR(20) | Estado: abierto, espera, cerrado, cancelado |
| datos_entrada | JSONB | Datos completos del formulario |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de última actualización |

### tareas_flujo
Gestiona las tareas individuales del workflow.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único de la tarea |
| solicitud_id | UUID | FK a solicitudes |
| nombre_tarea | VARCHAR(100) | Nombre de la tarea |
| asignado_a_rol | VARCHAR(50) | Rol asignado (admin, validador) |
| estado_tarea | VARCHAR(20) | pendiente, completada, rechazada |
| resultado_json | JSONB | Respuesta del usuario |
| webhook_resume_url | TEXT | URL para reanudar en n8n |
| vencimiento_sla | TIMESTAMP | Fecha límite SLA |
| created_at | TIMESTAMP | Fecha de creación |

### historial_pasos
Auditoría de todos los pasos ejecutados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | ID autoincremental |
| solicitud_id | UUID | FK a solicitudes |
| paso_nombre | TEXT | Nombre del paso |
| detalles | TEXT | Detalles del paso |
| fecha | TIMESTAMP | Fecha del evento |

## 🔄 Flujo de Trabajo

1. **Usuario llena formulario** → Completa todos los campos obligatorios
2. **Click en "Enviar"** → Se ejecuta `handleSubmit`
3. **Validación** → Verifica campos obligatorios
4. **Preparación de datos** → Mapea formData a estructura n8n
5. **Envío a API** → `POST /api/solicitudes/enviar`
6. **Autenticación** → Verifica sesión del usuario
7. **Envío a n8n** → `POST` al webhook con token
8. **Respuesta** → n8n procesa y devuelve ticket
9. **Confirmación** → Muestra número de ticket al usuario
10. **Redirección** → Redirige al dashboard

## 📝 Archivos Principales

### Backend
- `src/lib/services/n8n-service.ts` - Servicio de integración con n8n
- `src/app/api/solicitudes/enviar/route.ts` - Endpoint API
- `prisma/schema.prisma` - Modelos de base de datos

### Frontend
- `src/app/(portal)/requests/training/new/page.tsx` - Formulario de solicitud

### Scripts
- `scripts/create-n8n-tables.js` - Creación de tablas
- `scripts/create-n8n-tables.sql` - SQL de tablas

## 🧪 Testing

### Probar la integración

1. Asegúrate de que las variables de entorno estén configuradas
2. Inicia el servidor: `npm run dev`
3. Accede al formulario: http://localhost:3001/requests/training/new
4. Llena todos los campos obligatorios
5. Click en "Enviar"
6. Verifica en los logs del servidor:
   ```
   [N8N Service] Enviando solicitud de formación a n8n...
   [N8N Service] Respuesta de n8n: {...}
   [Formulario] Solicitud enviada exitosamente
   [Formulario] Ticket: REQ-1001
   ```

### Verificar en n8n

1. Accede a tu instancia de n8n
2. Verifica que el webhook recibió la solicitud
3. Revisa el workflow que se ejecutó
4. Confirma que se creó el ticket

## 🔒 Seguridad

- ✅ Token de autenticación en header `Beca-Windsurf-Token`
- ✅ Verificación de sesión de usuario
- ✅ Variables de entorno para configuración sensible
- ✅ No se expone el token en el frontend
- ✅ Validación de datos antes de enviar

## 🚀 Migración a Producción

1. Actualizar `.env` con URLs y tokens de producción
2. Verificar que n8n esté configurado en producción
3. Probar con datos de prueba
4. Monitorear logs durante las primeras solicitudes
5. Configurar alertas para errores

## 📞 Soporte

Si tienes problemas con la integración:

1. Verifica que las variables de entorno estén configuradas
2. Revisa los logs del servidor
3. Verifica que n8n esté accesible
4. Confirma que el token sea correcto
5. Revisa la documentación de n8n

## 📚 Referencias

- [Documentación de n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
