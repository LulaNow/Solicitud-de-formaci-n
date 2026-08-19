import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, comentarios, estado_tarea, autorizador, json_parametros } = body;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'webhookUrl es requerido' },
        { status: 400 }
      );
    }

    console.log('[Webhook Proxy] Llamando a:', webhookUrl);
    console.log('[Webhook Proxy] Datos:', { comentarios, estado_tarea, autorizador, json_parametros });

    const payload: Record<string, any> = {
      comentarios: comentarios || "",
      estado_tarea: estado_tarea,
      autorizador: autorizador,
    };

    // Incluir json_parametros si existe
    if (json_parametros) {
      payload.json_parametros = json_parametros;
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[Webhook Proxy] Status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('[Webhook Proxy] Error:', errorText);
      return NextResponse.json(
        { error: 'Error al llamar al webhook', details: errorText },
        { status: webhookResponse.status }
      );
    }

    // Intentar parsear la respuesta, pero manejar respuestas vacías
    const responseText = await webhookResponse.text();
    console.log('[Webhook Proxy] Respuesta raw:', responseText);

    let responseData = {};
    if (responseText && responseText.trim()) {
      try {
        responseData = JSON.parse(responseText);
        console.log('[Webhook Proxy] Respuesta parseada:', responseData);
      } catch (parseError) {
        console.warn('[Webhook Proxy] No se pudo parsear JSON, usando respuesta vacía');
      }
    } else {
      console.log('[Webhook Proxy] Respuesta vacía del webhook (esto es normal)');
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Webhook ejecutado correctamente',
    });
  } catch (error) {
    console.error('[Webhook Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
