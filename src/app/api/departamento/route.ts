import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const API_URL = "https://api.nadro.mx/prod/Estructura/";
const API_KEY = "1dcbd29175c84594b164cbd552c52cd1";

const EMPRESA_CIA_MAP: Record<string, string> = {
  "Nadro": "643",
  "Ubictum": "884",
  "PRESTOMYC": "819",
};

function buildSoapRequest(cia: string, area: string, centro: string, linea: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ven="http://venturessoft.ws.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <ven:consultaDepartamento>
         <cia>${cia}</cia>
         <area>${area}</area>
         <centro>${centro}</centro>
         <linea>${linea}</linea>
      </ven:consultaDepartamento>
   </soapenv:Body>
</soapenv:Envelope>`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresa = searchParams.get("empresa");
    const area = searchParams.get("area");
    const centro = searchParams.get("centro");
    const linea = searchParams.get("linea");

    if (!empresa || !area || !centro || !linea) {
      return NextResponse.json(
        { success: false, error: "Empresa, área, centro y línea son requeridos" },
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

    const soapRequest = buildSoapRequest(cia, area, centro, linea);

    console.log("[API Departamento] Consultando:", { empresa, area, centro, linea, cia });

    const response = await fetch(
      `${API_URL}?soapAction=consultaDepartamento&api-key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "consultaDepartamento",
        },
        body: soapRequest,
      }
    );

    if (!response.ok) {
      console.error("[API Departamento] Error HTTP:", response.status);
      return NextResponse.json(
        { success: false, error: `Error al consultar API: ${response.status}` },
        { status: response.status }
      );
    }

    const xmlText = await response.text();

    // Parsear XML para obtener agrupacion1
    const agrupacion1Match = xmlText.match(/<agrupacion1>(.*?)<\/agrupacion1>/);

    if (!agrupacion1Match) {
      return NextResponse.json(
        { success: false, error: "Departamento no encontrado" },
        { status: 404 }
      );
    }

    const agrupacion1 = agrupacion1Match[1];

    console.log("[API Departamento] Agrupación1 encontrada:", agrupacion1);

    // Buscar en la base de datos en la tabla ceco
    const ceco = await prisma.ceco.findUnique({
      where: {
        Valor: agrupacion1,
      },
    });

    if (!ceco) {
      return NextResponse.json(
        { success: false, error: "CECO no encontrado en base de datos" },
        { status: 404 }
      );
    }

    console.log("[API Departamento] CECO encontrado:", ceco.Descripcion);

    return NextResponse.json({
      success: true,
      agrupacion1,
      cecoDescripcion: ceco.Descripcion || "",
    });

  } catch (error) {
    console.error("[API Departamento] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
