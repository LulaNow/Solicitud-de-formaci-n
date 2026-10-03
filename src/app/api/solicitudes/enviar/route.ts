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
    const inicioSolicitud = new Date(Date.now() - 5000); // 5s de margen
    const resultado = await n8nService.enviarSolicitudFormacion(
      userId as string,
      session.user.email as string,
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

    // Buscar la solicitud creada por el workflow de n8n en la BD local
    // (n8n responde "recibido" antes de insertar el registro)
    let solicitudId = resultado.solicitud_id;
    if (!solicitudId) {
      const { prisma } = await import("@/lib/db/prisma");
      const noEmpleado = datosFormulario.no_empleado;

      for (let intento = 0; intento < 15 && !solicitudId; intento++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Criterio 1: numero_ticket si n8n lo devolvió
        let solicitudCreada = resultado.numero_ticket
          ? await prisma.solicitud.findFirst({
              where: { numeroTicket: resultado.numero_ticket },
              orderBy: { createdAt: "desc" },
              select: { id: true, numeroTicket: true },
            })
          : null;

        // Criterio 2: coincidir por usuario y ventana de tiempo
        if (!solicitudCreada) {
          solicitudCreada = await prisma.solicitud.findFirst({
            where: {
              usuarioId: userId as string,
              createdAt: { gte: inicioSolicitud },
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, numeroTicket: true },
          });
        }

        // Criterio 3: coincidir por contenido de datos_entrada (no_empleado)
        // en la ventana de tiempo — robusto aunque usuario_id difiera
        if (!solicitudCreada && noEmpleado) {
          solicitudCreada = await prisma.solicitud.findFirst({
            where: {
              createdAt: { gte: inicioSolicitud },
              datosEntrada: {
                path: ["no_empleado"],
                equals: noEmpleado,
              },
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, numeroTicket: true },
          });
        }

        if (solicitudCreada) {
          solicitudId = solicitudCreada.id;
          console.log("[API Solicitudes] Solicitud encontrada en BD:", solicitudId, solicitudCreada.numeroTicket);
        }
      }

      if (!solicitudId) {
        console.warn("[API Solicitudes] No se encontró la solicitud en BD después de 15s");
      }
    }

    return NextResponse.json({
      success: true,
      solicitud_id: solicitudId,
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
