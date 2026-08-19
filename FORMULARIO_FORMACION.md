# 📋 Formulario de Solicitud de Formación

## ✅ Implementación Completada

Se ha creado un formulario completo para crear solicitudes de formación con todas las especificaciones solicitadas.

---

## 📁 Archivos Creados

### 1. **Página del Formulario**
`src/app/(portal)/requests/training/new/page.tsx`

### 2. **Script SQL para Menú**
`scripts/add-training-menu.sql`

---

## 🚀 Cómo Activar el Menú

### Opción 1: Ejecutar Script SQL (Recomendado)

```bash
# Conectarse a la base de datos PostgreSQL
psql -U tu_usuario -d tu_base_de_datos

# Ejecutar el script
\i scripts/add-training-menu.sql
```

### Opción 2: Ejecutar desde pgAdmin o DBeaver

1. Abre tu cliente de PostgreSQL (pgAdmin, DBeaver, etc.)
2. Conecta a tu base de datos
3. Abre el archivo `scripts/add-training-menu.sql`
4. Ejecuta el script completo

### Opción 3: Agregar Manualmente desde la Interfaz

1. Ve a `/admin/menus` en tu aplicación
2. Busca el menú padre "Peticiones" o créalo si no existe
3. Agrega un nuevo submenú con:
   - **Label**: New Training Request
   - **Label ES**: Crear solicitud de formación
   - **Icon**: FileText
   - **Path**: /requests/training/new
   - **Parent**: Peticiones
   - **Order**: 1

---

## 📋 Características del Formulario

### ✨ Funcionalidades Implementadas

#### **1. Información de la Solicitud**
- ✅ Fecha actual predeterminada (solo lectura)
- ✅ CDR (campo de texto)
- ✅ Evento (select: Grupal/Individual) *
- ✅ Modalidad (select: Presencial/Virtual) *
- ✅ Tipo (select: Beca/Individual/Técnica) *
- ✅ Autorizador (campo de texto)
- ✅ Empresa (select: Nadro/Ubictum/PRESTOMYC) *

#### **2. Datos del Solicitante**
- ✅ No. Empleado (solo números) *
- ✅ Nombre (campo de texto)
- ✅ Puesto (campo de texto)
- ✅ Antigüedad en el puesto (campo de texto)
- ✅ CECO (campo de texto)
- ✅ Principales funciones (textarea) *

#### **3. En Caso de Solicitud Grupal**
- ✅ Visible solo cuando Evento = "Grupal"
- ✅ Total de participantes (campo de texto)
- ✅ Áreas (con ayuda: "Separa las áreas con una coma")

#### **4. Información del Curso**
- ✅ Nombre del curso o programa *
- ✅ Institución *
- ✅ Fecha inicio (calendario)
- ✅ Fecha fin (calendario)
- ✅ Duración (calculada automáticamente en días)
- ✅ Tipo de programa (select con 10 opciones) *
- ✅ Beneficio/Indicador de impacto (textarea)

#### **5. Información Financiera**
- ✅ Tipo de moneda (select: MXN/USD, predeterminado MXN)
- ✅ Costo (formato moneda mexicana) *
- ✅ Tipo de I.V.A (select: 0%/8%/16%) *
- ✅ I.V.A (calculado automáticamente, solo lectura)
- ✅ Retención I.V.A (formato moneda)
- ✅ Retención I.S.R (formato moneda)
- ✅ Total (calculado automáticamente: Costo + IVA + Ret.IVA + Ret.ISR) *

---

## 🎨 Diseño y UX

### **Layout**
- ✅ Campos organizados en **dos columnas** (responsive)
- ✅ Campos obligatorios marcados con **asterisco rojo** (*)
- ✅ Secciones agrupadas con títulos claros
- ✅ Diseño consistente con el resto de la aplicación

### **Validaciones**
- ✅ Campos obligatorios validados antes de enviar
- ✅ No. Empleado: solo acepta números
- ✅ Fechas: formato dd-mm-aaaa
- ✅ Montos: formato de moneda mexicana automático

### **Cálculos Automáticos**
- ✅ **Duración**: Calcula días entre fecha inicio y fin
- ✅ **I.V.A**: Calcula porcentaje del costo según tipo seleccionado
- ✅ **Total**: Suma Costo + IVA + Retenciones

---

## 🔧 Próximos Pasos

### **1. Crear Endpoint tRPC para Guardar**

Necesitas crear el endpoint en `src/server/routers/requests.ts`:

```typescript
createTraining: protectedProcedure
  .input(z.object({
    // Información de la solicitud
    fecha: z.string(),
    cdr: z.string().optional(),
    evento: z.string(),
    modalidad: z.string(),
    tipo: z.string(),
    autorizador: z.string().optional(),
    empresa: z.string(),
    
    // Datos del solicitante
    noEmpleado: z.string(),
    nombre: z.string().optional(),
    puesto: z.string().optional(),
    antiguedad: z.string().optional(),
    ceco: z.string().optional(),
    funcionesPrincipales: z.string(),
    
    // Solicitud grupal
    totalParticipantes: z.string().optional(),
    areas: z.string().optional(),
    
    // Información del curso
    nombreCurso: z.string(),
    institucion: z.string(),
    fechaInicio: z.string().optional(),
    fechaFin: z.string().optional(),
    duracion: z.string().optional(),
    tipoPrograma: z.string(),
    beneficio: z.string().optional(),
    
    // Información financiera
    tipoMoneda: z.string(),
    costo: z.string(),
    tipoIVA: z.string(),
    iva: z.string(),
    retencionIVA: z.string().optional(),
    retencionISR: z.string().optional(),
    total: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Crear solicitud en la base de datos
    const request = await ctx.prisma.request.create({
      data: {
        userId: ctx.session.user.id,
        type: "TRAINING",
        status: "PENDING",
        data: input, // Guardar todos los datos en el campo JSON
      },
    });

    return request;
  }),
```

### **2. Actualizar Modelo de Prisma (si es necesario)**

Si no tienes un campo `data` de tipo JSON en el modelo `Request`, agrégalo:

```prisma
model Request {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // "TRAINING", "OTHER", etc.
  status    String   // "PENDING", "IN_PROGRESS", "APPROVED", "REJECTED"
  data      Json     // Datos del formulario
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### **3. Descomentar la Llamada al API**

En el archivo `page.tsx`, descomenta la línea:

```typescript
// await trpc.requests.createTraining.mutate(formData);
```

Y comenta la simulación:

```typescript
// await new Promise(resolve => setTimeout(resolve, 1000));
```

### **4. Actualizar Contadores del Dashboard**

El endpoint `trpc.requests.stats.useQuery()` debe incluir las solicitudes de formación en los contadores:
- **Total Peticiones**: Incrementar cuando se crea
- **En Proceso**: Incrementar si el status inicial es "IN_PROGRESS"

---

## 📊 Estructura de Datos

Los datos se guardan en formato JSON con la siguiente estructura:

```json
{
  "fecha": "2026-05-12",
  "cdr": "CDR-001",
  "evento": "Individual",
  "modalidad": "Virtual",
  "tipo": "Curso",
  "autorizador": "Juan Pérez",
  "empresa": "Nadro",
  "noEmpleado": "12345",
  "nombre": "María González",
  "puesto": "Analista",
  "antiguedad": "2 años",
  "ceco": "CECO-123",
  "funcionesPrincipales": "Análisis de datos...",
  "nombreCurso": "Curso de Excel Avanzado",
  "institucion": "Universidad XYZ",
  "fechaInicio": "2026-06-01",
  "fechaFin": "2026-06-30",
  "duracion": "30 días",
  "tipoPrograma": "Curso",
  "beneficio": "Mejorar habilidades...",
  "tipoMoneda": "MXN",
  "costo": "$5,000.00",
  "tipoIVA": "16%",
  "iva": "$800.00",
  "retencionIVA": "$0.00",
  "retencionISR": "$0.00",
  "total": "$5,800.00"
}
```

---

## 🎯 Acceso al Formulario

Una vez ejecutado el script SQL, el menú aparecerá en el sidebar:

```
📁 Peticiones
  └─ 📄 Crear solicitud de formación
```

**URL directa**: `/requests/training/new`

---

## ✅ Checklist de Implementación

- [x] Formulario creado con todos los campos especificados
- [x] Campos obligatorios marcados con asterisco rojo
- [x] Layout en dos columnas
- [x] Validación de campos obligatorios
- [x] Cálculos automáticos (Duración, IVA, Total)
- [x] Formato de moneda mexicana
- [x] Sección grupal condicional
- [x] Calendario para fechas
- [x] Script SQL para agregar al menú
- [ ] Endpoint tRPC para guardar (pendiente)
- [ ] Actualizar contadores del dashboard (pendiente)
- [ ] Probar formulario completo (pendiente)

---

## 🆘 Soporte

Si necesitas ayuda con:
- Crear el endpoint tRPC
- Modificar el modelo de Prisma
- Personalizar validaciones
- Agregar más campos

¡Avísame y te ayudo! 🚀
