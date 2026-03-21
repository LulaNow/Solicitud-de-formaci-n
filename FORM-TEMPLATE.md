# 📋 Form Template - Patrón Completo de Formularios

Este documento describe el **patrón completo** para crear formularios dinámicos con validaciones, integración n8n y workflows de aprobación.

## 🎯 Ejemplo Base: Reporte de Incidentes

URL: **http://localhost:3000/f/reporte-incidentes**

### Características del Formulario
- ✅ 17 campos con todos los tipos disponibles
- ✅ Grid layout responsive (1/2, 1/3, ancho completo)
- ✅ Validaciones frontend (pattern, min/max, required)
- ✅ Validaciones backend (Zod schemas)
- ✅ Integración n8n para workflow de aprobaciones
- ✅ Formulario público (accesible sin login)

---

## 📊 Tipos de Campos Disponibles

### 1. TEXT - Texto Simple
```typescript
{
  label: "Nombre Completo",
  fieldKey: "reporter_name",
  type: "TEXT",
  placeholder: "Ej: Juan Pérez García",
  helpText: "Nombre completo de quien reporta",
  required: true,
  gridColumn: 6, // 1/2 ancho
  validation: {
    minLength: 3,
    maxLength: 100,
    pattern: "^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$",
    errorMessage: "Solo letras y espacios, mínimo 3 caracteres",
  },
}
```

**Validaciones comunes:**
- `minLength`, `maxLength`: Longitud del texto
- `pattern`: Regex para formato específico
- `errorMessage`: Mensaje personalizado

---

### 2. EMAIL - Correo Electrónico
```typescript
{
  label: "Correo Electrónico",
  fieldKey: "reporter_email",
  type: "EMAIL",
  required: true,
  gridColumn: 6,
  validation: {
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    errorMessage: "Correo electrónico inválido",
  },
}
```

**Validación automática:** HTML5 `type="email"` + regex personalizado

---

### 3. PHONE - Teléfono
```typescript
{
  label: "Teléfono de Contacto",
  fieldKey: "phone",
  type: "PHONE",
  placeholder: "+52 55 1234 5678",
  gridColumn: 6,
  validation: {
    pattern: "^\\+?[0-9]{10,15}$",
    errorMessage: "Formato: +52 55 1234 5678 (10-15 dígitos)",
  },
}
```

**Formatos aceptados:** Internacional (+52), nacional (55), 10-15 dígitos

---

### 4. SELECT - Lista Desplegable
```typescript
{
  label: "Departamento",
  fieldKey: "department",
  type: "SELECT",
  required: true,
  gridColumn: 6,
  options: [
    "Tecnología",
    "Operaciones",
    "Recursos Humanos",
    "Finanzas",
    "Ventas",
  ],
}
```

**Uso:** Selección única de una lista predefinida

---

### 5. RADIO - Botones de Radio
```typescript
{
  label: "Tipo de Incidente",
  fieldKey: "incident_type",
  type: "RADIO",
  required: true,
  gridColumn: 6,
  options: [
    "🔧 Técnico - Hardware",
    "💻 Técnico - Software",
    "🌐 Técnico - Red/Conectividad",
    "🔒 Seguridad - Acceso no autorizado",
  ],
}
```

**Uso:** Selección única con opciones visibles (ideal para 3-7 opciones)

---

### 6. MULTI_SELECT - Selección Múltiple
```typescript
{
  label: "Impacto en las Operaciones",
  fieldKey: "impact",
  type: "MULTI_SELECT",
  required: true,
  gridColumn: 12,
  options: [
    "Usuarios no pueden trabajar",
    "Pérdida de productividad",
    "Clientes afectados",
    "Pérdida de datos",
  ],
}
```

**Uso:** Permite seleccionar múltiples opciones (checkboxes)

---

### 7. TEXTAREA - Texto Largo
```typescript
{
  label: "Descripción Detallada",
  fieldKey: "description",
  type: "TEXTAREA",
  placeholder: "Describe el incidente...",
  required: true,
  gridColumn: 12,
  validation: {
    minLength: 20,
    maxLength: 2000,
    errorMessage: "Mínimo 20 caracteres, máximo 2000",
  },
}
```

**Uso:** Descripciones largas, comentarios, notas

---

### 8. DATE - Fecha
```typescript
{
  label: "Fecha del Incidente",
  fieldKey: "incident_date",
  type: "DATE",
  required: true,
  gridColumn: 6,
  validation: {
    maxDate: "today",
    errorMessage: "La fecha no puede ser futura",
  },
}
```

**Validaciones:** `minDate`, `maxDate` (valores: "today", "YYYY-MM-DD")

---

### 9. DATETIME - Fecha y Hora
```typescript
{
  label: "Hora Aproximada",
  fieldKey: "incident_time",
  type: "DATETIME",
  gridColumn: 6,
}
```

**Uso:** Timestamp completo con fecha y hora

---

### 10. FILE - Archivo Adjunto
```typescript
{
  label: "Evidencia",
  fieldKey: "evidence",
  type: "FILE",
  helpText: "Capturas de pantalla, logs (máx. 10MB)",
  gridColumn: 12,
  validation: {
    maxSize: 10485760, // 10MB en bytes
    allowedTypes: ["image/png", "image/jpeg", "application/pdf"],
    errorMessage: "Solo imágenes o PDF (máx. 10MB)",
  },
}
```

**Validaciones:**
- `maxSize`: Tamaño máximo en bytes
- `allowedTypes`: MIME types permitidos

---

### 11. URL - Enlace Web
```typescript
{
  label: "URL o Sistema Relacionado",
  fieldKey: "related_url",
  type: "URL",
  placeholder: "https://sistema.empresa.com",
  gridColumn: 12,
  validation: {
    pattern: "^https?://.*",
    errorMessage: "Debe ser una URL válida (http:// o https://)",
  },
}
```

**Validación automática:** HTML5 `type="url"` + regex

---

### 12. CHECKBOX - Casilla de Verificación
```typescript
{
  label: "Acepto que la información es verídica",
  fieldKey: "terms_accepted",
  type: "CHECKBOX",
  required: true,
  gridColumn: 12,
}
```

**Uso:** Términos y condiciones, confirmaciones

---

## 🎨 Grid Layout

### Anchos Disponibles
```typescript
gridColumn: 12  // Ancho completo (100%)
gridColumn: 6   // 1/2 (50%)
gridColumn: 4   // 1/3 (33.33%)
gridColumn: 3   // 1/4 (25%)
```

### Ejemplo de Layout
```
Row 1: [Nombre (6)] [Email (6)]
Row 2: [Departamento (6)] [Teléfono (6)]
Row 3: [Descripción (12)]
Row 4: [Fecha (6)] [Hora (6)]
```

---

## ✅ Validaciones

### Frontend (Cliente)
```typescript
// HTML5 validation
<input type="email" required minLength={3} maxLength={100} />

// Custom pattern
<input pattern="^[a-zA-Z ]+$" />

// React validation
const validate = (value: string) => {
  if (!value && field.required) return "Campo requerido";
  if (field.validation?.minLength && value.length < field.validation.minLength) {
    return `Mínimo ${field.validation.minLength} caracteres`;
  }
  if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
    return field.validation.errorMessage || "Formato inválido";
  }
  return null;
};
```

### Backend (Zod Schema)
```typescript
// src/server/routers/forms.ts
const fieldSchema = z.object({
  label: z.string().min(1),
  fieldKey: z.string().min(1),
  type: fieldTypeEnum,
  required: z.boolean().default(false),
  validation: z.any().optional(),
  gridColumn: z.number().min(1).max(12).default(12),
});

// Validación en submit
submit: publicProcedure
  .input(z.object({
    formSlug: z.string(),
    data: z.record(z.any()),
  }))
  .mutation(async ({ ctx, input }) => {
    const form = await ctx.prisma.formDefinition.findUnique({
      where: { slug: input.formSlug },
      include: { fields: true },
    });

    // Validar campos requeridos
    for (const field of form.fields) {
      if (field.required && !input.data[field.fieldKey]) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Campo requerido: ${field.label}`,
        });
      }

      // Validar formato de email
      if (field.type === "EMAIL" && input.data[field.fieldKey]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.data[field.fieldKey])) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Email inválido: ${field.label}`,
          });
        }
      }

      // Validar pattern personalizado
      if (field.validation?.pattern && input.data[field.fieldKey]) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(input.data[field.fieldKey])) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: field.validation.errorMessage || `Formato inválido: ${field.label}`,
          });
        }
      }
    }

    // Guardar en BD
    const registry = await ctx.prisma.formRegistry.create({
      data: {
        formId: form.id,
        data: input.data,
        submittedById: ctx.user?.id,
      },
    });

    // Enviar a n8n si está configurado
    if (form.n8nWebhookUrl) {
      await fetch(form.n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registryId: registry.id,
          formName: form.name,
          data: input.data,
          submittedAt: new Date(),
          submittedBy: ctx.user?.email || "anónimo",
        }),
      });
    }

    return registry;
  });
```

---

## 🔗 Integración n8n

### 1. Configurar Webhook en n8n

**URL del webhook:**
```
https://n8n.tu-dominio.com/webhook/incident-workflow
```

**Payload recibido:**
```json
{
  "registryId": "cm...",
  "formName": "Reporte de Incidentes",
  "data": {
    "reporter_name": "Juan Pérez",
    "reporter_email": "juan@empresa.com",
    "department": "Tecnología",
    "incident_type": "💻 Técnico - Software",
    "priority": "🔴 Crítica - Sistema caído",
    "description": "El sistema de facturación no responde...",
    "impact": ["Usuarios no pueden trabajar", "Clientes afectados"]
  },
  "submittedAt": "2026-03-21T17:00:00Z",
  "submittedBy": "juan@empresa.com"
}
```

### 2. Workflow de Aprobación (n8n)

```
┌─────────────┐
│  Webhook    │ ← Recibe formulario
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Validar    │ ← Validaciones adicionales
│  Datos      │   (reglas de negocio)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Asignar    │ ← Asignación automática
│  Responsable│   según tipo/prioridad
└──────┬──────┘
       │
       ├─────────────────────────┐
       ▼                         ▼
┌─────────────┐          ┌─────────────┐
│  Email a    │          │  Crear      │
│  Responsable│          │  Ticket     │
└─────────────┘          └──────┬──────┘
                                │
                                ▼
                         ┌─────────────┐
                         │  Notificar  │
                         │  Slack/Teams│
                         └──────┬──────┘
                                │
                                ▼
                         ┌─────────────┐
                         │  Esperar    │
                         │  Aprobación │
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             ┌─────────────┐        ┌─────────────┐
             │  Aprobado   │        │  Rechazado  │
             └──────┬──────┘        └──────┬──────┘
                    │                       │
                    ▼                       ▼
             ┌─────────────┐        ┌─────────────┐
             │  Ejecutar   │        │  Notificar  │
             │  Acciones   │        │  Rechazo    │
             └─────────────┘        └─────────────┘
```

### 3. Ejemplo de Nodo n8n (JSON)

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "incident-workflow",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json[\"data\"][\"priority\"]}}",
              "operation": "contains",
              "value2": "Crítica"
            }
          ]
        }
      },
      "name": "Es Crítico?",
      "type": "n8n-nodes-base.if",
      "position": [450, 300]
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "name": "assignedTo",
              "value": "soporte-critico@empresa.com",
              "type": "string"
            },
            {
              "name": "sla",
              "value": "1 hora",
              "type": "string"
            }
          ]
        }
      },
      "name": "Asignar Crítico",
      "type": "n8n-nodes-base.set",
      "position": [650, 200]
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "name": "assignedTo",
              "value": "soporte-general@empresa.com",
              "type": "string"
            },
            {
              "name": "sla",
              "value": "24 horas",
              "type": "string"
            }
          ]
        }
      },
      "name": "Asignar Normal",
      "type": "n8n-nodes-base.set",
      "position": [650, 400]
    },
    {
      "parameters": {
        "fromEmail": "noreply@empresa.com",
        "toEmail": "={{$json[\"assignedTo\"]}}",
        "subject": "🚨 Nuevo Incidente: {{$json[\"data\"][\"incident_type\"]}}",
        "emailType": "html",
        "message": "<h2>Nuevo Incidente Reportado</h2><p><strong>Reportado por:</strong> {{$json[\"data\"][\"reporter_name\"]}}</p><p><strong>Prioridad:</strong> {{$json[\"data\"][\"priority\"]}}</p><p><strong>Descripción:</strong> {{$json[\"data\"][\"description\"]}}</p><p><strong>SLA:</strong> {{$json[\"sla\"]}}</p>"
      },
      "name": "Enviar Email",
      "type": "n8n-nodes-base.emailSend",
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Es Crítico?", "type": "main", "index": 0 }]]
    },
    "Es Crítico?": {
      "main": [
        [{ "node": "Asignar Crítico", "type": "main", "index": 0 }],
        [{ "node": "Asignar Normal", "type": "main", "index": 0 }]
      ]
    },
    "Asignar Crítico": {
      "main": [[{ "node": "Enviar Email", "type": "main", "index": 0 }]]
    },
    "Asignar Normal": {
      "main": [[{ "node": "Enviar Email", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 🚀 Cómo Crear un Formulario Nuevo

### Opción 1: Via Script (Recomendado para Templates)

```typescript
// prisma/seed-mi-formulario.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedMiFormulario() {
  const adminUser = await prisma.user.findFirst({
    where: { email: { contains: "admin" } },
  });

  const form = await prisma.formDefinition.create({
    data: {
      name: "Mi Formulario",
      slug: "mi-formulario",
      description: "Descripción del formulario",
      isPublic: true,
      status: "PUBLISHED",
      createdById: adminUser.id,
      n8nWebhookUrl: "https://n8n.tu-dominio.com/webhook/mi-workflow",
      fields: {
        create: [
          {
            label: "Campo 1",
            fieldKey: "campo_1",
            type: "TEXT",
            required: true,
            order: 0,
            gridColumn: 12,
          },
          // ... más campos
        ],
      },
    },
  });

  console.log(`✅ Formulario creado: /f/${form.slug}`);
}

seedMiFormulario();
```

**Ejecutar:**
```bash
npx tsx prisma/seed-mi-formulario.ts
```

### Opción 2: Via Admin UI

1. Login como admin
2. Ir a `/forms`
3. Click "Nuevo Formulario"
4. Llenar información básica
5. Agregar campos con validaciones
6. Configurar n8n webhook
7. Marcar "Público" si es necesario
8. Click "Publicar"

---

## 📝 Checklist de Formulario Completo

- [ ] **Información básica**
  - [ ] Nombre descriptivo
  - [ ] Slug único (URL-friendly)
  - [ ] Descripción clara
  - [ ] Estado: PUBLISHED

- [ ] **Campos**
  - [ ] Todos los campos requeridos marcados
  - [ ] Grid layout configurado (1/2, 1/3, completo)
  - [ ] Placeholders y helpText informativos
  - [ ] Validaciones frontend (pattern, min/max)
  - [ ] Validaciones backend (Zod)

- [ ] **Acceso**
  - [ ] Público o restringido por roles
  - [ ] Roles seleccionados (si aplica)

- [ ] **Integración n8n**
  - [ ] Webhook URL configurado
  - [ ] Workflow ID documentado
  - [ ] Workflow creado en n8n
  - [ ] Prueba de envío exitosa

- [ ] **Testing**
  - [ ] Formulario accesible en `/f/{slug}`
  - [ ] Validaciones funcionan
  - [ ] Envío exitoso
  - [ ] n8n recibe datos
  - [ ] Workflow ejecuta correctamente

---

## 🎯 Casos de Uso Comunes

### 1. Formulario de Contacto
- Nombre, Email, Teléfono
- Asunto (SELECT)
- Mensaje (TEXTAREA)
- → n8n: Email a ventas/soporte

### 2. Solicitud de Vacaciones
- Empleado, Departamento
- Fecha inicio/fin (DATE)
- Motivo (TEXTAREA)
- → n8n: Aprobación de supervisor

### 3. Reporte de Gastos
- Empleado, Proyecto
- Monto (NUMBER)
- Categoría (SELECT)
- Recibos (FILE)
- → n8n: Aprobación de finanzas

### 4. Registro de Eventos
- Nombre, Email
- Evento (RADIO)
- Preferencias alimentarias (MULTI_SELECT)
- → n8n: Confirmación + calendario

---

**Última actualización**: 2026-03-21  
**Versión**: 1.0.0  
**Formulario de ejemplo**: `/f/reporte-incidentes`
