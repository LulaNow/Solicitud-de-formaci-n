/**
 * Servicio para integración con n8n
 * Maneja el envío de solicitudes al workflow de n8n
 */

export interface SolicitudFormacionData {
  fecha: string;
  cdr: string;
  cdr_descripcion: string;
  evento: string;
  modalidad: string;
  tipo: string;
  autorizador: string;
  empresa: string;
  no_empleado: string;
  nombre: string;
  puesto: string;
  fecha_ingreso: string;
  antiguedad: string;
  ceco: string;
  funciones: string;
  nombre_curso: string;
  institucion: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion: string;
  tipo_programa: string;
  beneficio: string;
  tipo_moneda: string;
  costo: string;
  tipo_iva: string;
  iva: string;
  retencion_iva: string;
  retencion_isr: string;
  total: string;
}

export interface N8nSolicitudPayload {
  usuario_id: string;
  usuario_email: string;
  tipo_proceso: string;
  convocatoria: string;
  datos_entrada: SolicitudFormacionData;
}

export interface N8nResponse {
  success: boolean;
  solicitud_id?: string;
  numero_ticket?: string;
  message?: string;
  error?: string;
}

class N8nService {
  private webhookUrl: string;
  private webhookToken: string;

  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || '';
    this.webhookToken = process.env.N8N_WEBHOOK_TOKEN || '';

    if (!this.webhookUrl || !this.webhookToken) {
      console.warn('[N8N Service] Configuración incompleta. Verifica N8N_WEBHOOK_URL y N8N_WEBHOOK_TOKEN en .env');
    }
  }

  /**
   * Envía una solicitud de formación al workflow de n8n
   */
  async enviarSolicitudFormacion(
    usuarioId: string,
    usuarioEmail: string,
    datosFormulario: SolicitudFormacionData
  ): Promise<N8nResponse> {
    try {
      console.log('[N8N Service] Enviando solicitud de formación a n8n...');
      console.log('[N8N Service] URL del webhook:', this.webhookUrl);
      console.log('[N8N Service] Usuario ID:', usuarioId);

      // Obtener año actual para convocatoria
      const currentYear = new Date().getFullYear().toString();

      const payload: N8nSolicitudPayload = {
        usuario_id: usuarioId,
        usuario_email: usuarioEmail,
        tipo_proceso: 'Solicitud de formación',
        convocatoria: currentYear,
        datos_entrada: datosFormulario,
      };

      console.log('[N8N Service] Intentando conectar con:', this.webhookUrl);
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Beca-Windsurf-Token': this.webhookToken,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[N8N Service] Error en respuesta:', response.status, errorText);

        return {
          success: false,
          error: `Error al enviar solicitud a n8n: ${response.status} - ${errorText}`,
        };
      }

      // Intentar parsear la respuesta
      const responseText = await response.text();
      console.log('[N8N Service] Respuesta raw de n8n:', responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('[N8N Service] Error al parsear respuesta JSON:', parseError);
        console.error('[N8N Service] Respuesta recibida:', responseText);

        return {
          success: false,
          error: 'Respuesta inválida de n8n. Verifica la configuración del webhook.',
        };
      }

      console.log('[N8N Service] Respuesta parseada de n8n:', data);

      return {
        success: true,
        solicitud_id: data.solicitud_id,
        numero_ticket: data.numero_ticket,
        message: data.message || 'Solicitud enviada correctamente',
      };

    } catch (error) {
      console.error('[N8N Service] Error al enviar solicitud:', error);

      // Verificar si es un error de conexión
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isFetchError = errorMessage.includes('fetch failed') ||
                          errorMessage.includes('ECONNREFUSED') ||
                          errorMessage.includes('Failed to fetch');

      if (isFetchError) {
        return {
          success: false,
          error: `No se puede conectar con n8n en ${this.webhookUrl}. Verifica que n8n esté corriendo en localhost:5678`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!(this.webhookUrl && this.webhookToken);
  }

  /**
   * Obtiene la configuración actual (sin exponer el token)
   */
  getConfig() {
    return {
      webhookUrl: this.webhookUrl,
      isConfigured: this.isConfigured(),
    };
  }
}

// Exportar una instancia única del servicio
export const n8nService = new N8nService();
