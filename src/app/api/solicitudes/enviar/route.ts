import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { n8nService, type SolicitudFormacionData } from "@/lib/services/n8n-service";

export async function POST(request: NextRequest) {
  try {
    console.log("[API Solicitudes] === INICIO DE SOLICITUD ===");

    // Verificar autenticación
    console.log("[API Solicitudes] Verificando autenticación...");
    const session = await auth();

    if (!session || !session.user) {
      console.log("[API Solicitudes] No autenticado");
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    console.log("[API Solicitudes] Usuario autenticado:", session.user.email);

    // Obtener datos del formulario
    console.log("[API Solicitudes] Parseando body...");
    const body = await request.json();
    console.log("[API Solicitudes] Body recibido:", Object.keys(body));

    const datosFormulario: SolicitudFormacionData = body.datos_formulario;
    console.log("[API Solicitudes] Datos formulario:", datosFormulario ? "OK" : "FALTA");

    if (!datosFormulario) {
      return NextResponse.json(
        { success: false, error: "Datos del formulario requeridos" },
        { status: 400 }
      );
    }

    console.log("[API Solicitudes] Enviando solicitud de formación...");
    console.log("[API Solicitudes] Usuario:", session.user.email);

    // Verificar que n8n esté configurado
    if (!n8nService.isConfigured()) {
      console.error("[API Solicitudes] n8n no está configurado");
      return NextResponse.json(
        {
          success: false,
          error: "Servicio de workflow no configurado. Contacte al administrador."
        },
        { status: 500 }
      );
    }

    // Obtener ID del usuario
    const userId = session.user.id || (session.user as any).id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ID de usuario no disponible" },
        { status: 400 }
      );
    }

    // Enviar a n8n
    const resultado = await n8nService.enviarSolicitudFormacion(
      userId as string,
      datosFormulario
    );

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: resultado.error || "Error al procesar solicitud"
        },
        { status: 500 }
      );
    }

    console.log("[API Solicitudes] Solicitud enviada exitosamente");
    console.log("[API Solicitudes] Ticket:", resultado.numero_ticket);

    return NextResponse.json({
      success: true,
      solicitud_id: resultado.solicitud_id,
      numero_ticket: resultado.numero_ticket,
      message: resultado.message,
    });

  } catch (error) {
    console.error("[API Solicitudes] ❌ ERROR CAPTURADO:");
    console.error("[API Solicitudes] Tipo:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[API Solicitudes] Mensaje:", error instanceof Error ? error.message : String(error));
    console.error("[API Solicitudes] Stack:", error instanceof Error ? error.stack : "N/A");

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor"
      },
      { status: 500 }
    );
  }
}
