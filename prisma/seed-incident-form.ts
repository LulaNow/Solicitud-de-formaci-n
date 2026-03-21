import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedIncidentForm() {
  console.log("🎯 Creando formulario de ejemplo: Reporte de Incidentes...");

  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: { contains: "admin" } },
  });

  if (!adminUser) {
    console.error("❌ No se encontró usuario admin");
    return;
  }

  // Create incident form
  const form = await prisma.formDefinition.create({
    data: {
      name: "Reporte de Incidentes",
      slug: "reporte-incidentes",
      description: "Reporta incidentes técnicos, de seguridad o operacionales para su atención inmediata. Este formulario incluye validaciones frontend y backend, integración con n8n para workflow de aprobaciones y asignación automática.",
      isPublic: true,
      status: "PUBLISHED",
      createdById: adminUser.id,
      n8nWebhookUrl: "https://n8n.tu-dominio.com/webhook/incident-workflow",
      n8nWorkflowId: "incident-approval-workflow-001",
      fields: {
        create: [
          // Row 1: Información del Reportante (2 campos de 1/2)
          {
            label: "Nombre Completo",
            fieldKey: "reporter_name",
            type: "TEXT",
            placeholder: "Ej: Juan Pérez García",
            helpText: "Nombre completo de quien reporta el incidente",
            required: true,
            order: 0,
            gridColumn: 6,
            validation: {
              minLength: 3,
              maxLength: 100,
              pattern: "^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$",
              errorMessage: "Solo letras y espacios, mínimo 3 caracteres",
            },
          },
          {
            label: "Correo Electrónico",
            fieldKey: "reporter_email",
            type: "EMAIL",
            placeholder: "ejemplo@empresa.com",
            helpText: "Correo para notificaciones sobre el incidente",
            required: true,
            order: 1,
            gridColumn: 6,
            validation: {
              pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
              errorMessage: "Correo electrónico inválido",
            },
          },

          // Row 2: Departamento y Teléfono (2 campos de 1/2)
          {
            label: "Departamento",
            fieldKey: "department",
            type: "SELECT",
            placeholder: "Selecciona tu departamento",
            helpText: "Departamento al que perteneces",
            required: true,
            order: 2,
            gridColumn: 6,
            options: [
              "Tecnología",
              "Operaciones",
              "Recursos Humanos",
              "Finanzas",
              "Ventas",
              "Marketing",
              "Soporte",
              "Administración",
            ],
          },
          {
            label: "Teléfono de Contacto",
            fieldKey: "phone",
            type: "PHONE",
            placeholder: "+52 55 1234 5678",
            helpText: "Teléfono para contacto urgente",
            required: false,
            order: 3,
            gridColumn: 6,
            validation: {
              pattern: "^\\+?[0-9]{10,15}$",
              errorMessage: "Formato: +52 55 1234 5678 (10-15 dígitos)",
            },
          },

          // Row 3: Tipo y Prioridad (2 campos de 1/2)
          {
            label: "Tipo de Incidente",
            fieldKey: "incident_type",
            type: "RADIO",
            helpText: "Selecciona el tipo de incidente que estás reportando",
            required: true,
            order: 4,
            gridColumn: 6,
            options: [
              "🔧 Técnico - Hardware",
              "💻 Técnico - Software",
              "🌐 Técnico - Red/Conectividad",
              "🔒 Seguridad - Acceso no autorizado",
              "🔐 Seguridad - Pérdida de datos",
              "⚠️ Operacional - Proceso interrumpido",
              "🏢 Infraestructura - Instalaciones",
              "📞 Servicio - Atención al cliente",
            ],
          },
          {
            label: "Prioridad",
            fieldKey: "priority",
            type: "SELECT",
            helpText: "Nivel de urgencia del incidente",
            required: true,
            order: 5,
            gridColumn: 6,
            options: ["🔴 Crítica - Sistema caído", "🟠 Alta - Afecta operación", "🟡 Media - Funcionalidad limitada", "🟢 Baja - Mejora o consulta"],
            defaultValue: "🟡 Media - Funcionalidad limitada",
          },

          // Row 4: Ubicación (1 campo completo)
          {
            label: "Ubicación del Incidente",
            fieldKey: "location",
            type: "TEXT",
            placeholder: "Ej: Edificio A, Piso 3, Sala de Juntas 2",
            helpText: "Ubicación física o sistema donde ocurrió el incidente",
            required: true,
            order: 6,
            gridColumn: 12,
            validation: {
              minLength: 5,
              maxLength: 200,
            },
          },

          // Row 5: Fecha y Hora (2 campos de 1/2)
          {
            label: "Fecha del Incidente",
            fieldKey: "incident_date",
            type: "DATE",
            helpText: "¿Cuándo ocurrió el incidente?",
            required: true,
            order: 7,
            gridColumn: 6,
            validation: {
              maxDate: "today",
              errorMessage: "La fecha no puede ser futura",
            },
          },
          {
            label: "Hora Aproximada",
            fieldKey: "incident_time",
            type: "DATETIME",
            helpText: "Hora aproximada del incidente",
            required: false,
            order: 8,
            gridColumn: 6,
          },

          // Row 6: Descripción (1 campo completo)
          {
            label: "Descripción Detallada del Incidente",
            fieldKey: "description",
            type: "TEXTAREA",
            placeholder: "Describe el incidente con el mayor detalle posible:\n- ¿Qué sucedió?\n- ¿Qué estabas haciendo cuando ocurrió?\n- ¿Hay mensajes de error?\n- ¿Se puede reproducir?",
            helpText: "Proporciona todos los detalles relevantes para facilitar la resolución",
            required: true,
            order: 9,
            gridColumn: 12,
            validation: {
              minLength: 20,
              maxLength: 2000,
              errorMessage: "Mínimo 20 caracteres, máximo 2000",
            },
          },

          // Row 7: Impacto (1 campo completo)
          {
            label: "Impacto en las Operaciones",
            fieldKey: "impact",
            type: "MULTI_SELECT",
            helpText: "Selecciona todas las áreas afectadas (puedes elegir varias)",
            required: true,
            order: 10,
            gridColumn: 12,
            options: [
              "Usuarios no pueden trabajar",
              "Pérdida de productividad",
              "Clientes afectados",
              "Pérdida de datos",
              "Riesgo de seguridad",
              "Incumplimiento de SLA",
              "Impacto financiero",
              "Reputación de la empresa",
            ],
          },

          // Row 8: Evidencia (1 campo completo)
          {
            label: "Evidencia (Capturas de pantalla, logs, etc.)",
            fieldKey: "evidence",
            type: "FILE",
            helpText: "Adjunta capturas de pantalla, archivos de log o cualquier evidencia relevante (máx. 10MB)",
            required: false,
            order: 11,
            gridColumn: 12,
            validation: {
              maxSize: 10485760, // 10MB
              allowedTypes: ["image/png", "image/jpeg", "image/gif", "application/pdf", "text/plain"],
              errorMessage: "Solo imágenes, PDF o archivos de texto (máx. 10MB)",
            },
          },

          // Row 9: Acciones tomadas (1 campo completo)
          {
            label: "Acciones Tomadas (si aplica)",
            fieldKey: "actions_taken",
            type: "TEXTAREA",
            placeholder: "¿Intentaste alguna solución? ¿Qué pasos seguiste?",
            helpText: "Describe cualquier acción que hayas tomado para intentar resolver el incidente",
            required: false,
            order: 12,
            gridColumn: 12,
            validation: {
              maxLength: 1000,
            },
          },

          // Row 10: Testigos y Notificaciones (2 campos de 1/2)
          {
            label: "Testigos o Personas Afectadas",
            fieldKey: "witnesses",
            type: "TEXT",
            placeholder: "Nombres o correos separados por comas",
            helpText: "Otras personas que presenciaron o fueron afectadas por el incidente",
            required: false,
            order: 13,
            gridColumn: 6,
          },
          {
            label: "Notificar a",
            fieldKey: "notify_to",
            type: "EMAIL",
            placeholder: "supervisor@empresa.com",
            helpText: "Correo de supervisor o responsable a notificar",
            required: false,
            order: 14,
            gridColumn: 6,
          },

          // Row 11: URL relacionada (1 campo completo)
          {
            label: "URL o Sistema Relacionado",
            fieldKey: "related_url",
            type: "URL",
            placeholder: "https://sistema.empresa.com/modulo",
            helpText: "URL del sistema o aplicación donde ocurrió el incidente",
            required: false,
            order: 15,
            gridColumn: 12,
            validation: {
              pattern: "^https?://.*",
              errorMessage: "Debe ser una URL válida (http:// o https://)",
            },
          },

          // Row 12: Términos y condiciones (1 campo completo)
          {
            label: "Acepto que la información proporcionada es verídica",
            fieldKey: "terms_accepted",
            type: "CHECKBOX",
            helpText: "Al marcar esta casilla, confirmas que la información es correcta y completa",
            required: true,
            order: 16,
            gridColumn: 12,
          },
        ],
      },
    },
    include: {
      fields: true,
    },
  });

  console.log(`✅ Formulario creado: ${form.name} (${form.slug})`);
  console.log(`📝 Campos: ${form.fields.length}`);
  console.log(`🔗 URL pública: /f/${form.slug}`);
  console.log(`🔗 n8n Webhook: ${form.n8nWebhookUrl}`);
}

seedIncidentForm()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
