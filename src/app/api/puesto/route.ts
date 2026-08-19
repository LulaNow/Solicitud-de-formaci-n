import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.nadro.mx/pro/human/";
const API_KEY = "1dcbd29175c84594b164cbd552c52cd1";

const EMPRESA_CIA_MAP: Record<string, string> = {
  "Nadro": "643",
  "Ubictum": "884",
  "PRESTOMYC": "819",
};

function buildSoapRequest(cia: string, clavePuesto: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ven="http://venturessoft.ws.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <ven:consultaPuesto>
         <cia>${cia}</cia>
         <clavePuesto>${clavePuesto}</clavePuesto>
      </ven:consultaPuesto>
   </soapenv:Body>
</soapenv:Envelope>`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresa = searchParams.get("empresa");
    const clavePuesto = searchParams.get("clavePuesto");

    if (!empresa || !clavePuesto) {
      return NextResponse.json(
        { success: false, error: "Empresa y clave de puesto son requeridos" },
        { status: 400 }
      );
    }

    const cia = EMPRESA_CIA_MAP[empresa];
    if (!cia) {
      return NextResponse.json(
        { success: false, error: `Empresa "${empresa}" no válida` },
        { status: 400 }
      );
    }

    const soapRequest = buildSoapRequest(cia, clavePuesto);

    console.log("[API Puesto] Consultando:", { empresa, clavePuesto, cia });

    const response = await fetch(
      `${API_URL}?soapAction=consultaPuesto&api-key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "consultaPuesto",
        },
        body: soapRequest,
      }
    );

    if (!response.ok) {
      console.error("[API Puesto] Error HTTP:", response.status);
      return NextResponse.json(
        { success: false, error: `Error al consultar API: ${response.status}` },
        { status: response.status }
      );
    }

    const xmlText = await response.text();
    
    // Parsear XML para obtener la descripción del puesto
    const descripcionMatch = xmlText.match(/<descripcion>(.*?)<\/descripcion>/);

    if (!descripcionMatch) {
      return NextResponse.json(
        { success: false, error: "Puesto no encontrado" },
        { status: 404 }
      );
    }

    const descripcionPuesto = descripcionMatch[1];

    console.log("[API Puesto] Puesto encontrado:", descripcionPuesto);

    return NextResponse.json({
      success: true,
      descripcionPuesto,
    });

  } catch (error) {
    console.error("[API Puesto] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
