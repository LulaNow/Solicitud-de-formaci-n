import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.nadro.mx/prod/Empleados/";
const API_KEY = "1dcbd29175c84594b164cbd552c52cd1";

const EMPRESA_CIA_MAP: Record<string, string> = {
  "Nadro": "643",
  "Ubictum": "884",
  "PRESTOMYC": "819",
};

function buildSoapRequest(cia: string, numEmp: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ven="http://venturessoft.ws.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <ven:getEspecifico>
         <cia>${cia}</cia>
         <numEmp>${numEmp}</numEmp>
      </ven:getEspecifico>
   </soapenv:Body>
</soapenv:Envelope>`;
}

function calcularAntiguedad(fechaIngreso: string): string {
  console.log("[Antigüedad] Fecha ingreso recibida:", fechaIngreso);

  // Parsear la fecha - puede venir en formato YYYY-MM-DD o DD/MM/YYYY
  let inicio: Date;

  if (fechaIngreso.includes('-')) {
    // Formato YYYY-MM-DD (del API)
    const [anio, mes, dia] = fechaIngreso.split('-').map(Number);
    inicio = new Date(anio, mes - 1, dia);
  } else {
    // Formato DD/MM/YYYY
    const [dia, mes, anio] = fechaIngreso.split('/').map(Number);
    inicio = new Date(anio, mes - 1, dia);
  }

  const hoy = new Date();

  console.log("[Antigüedad] Fecha inicio parseada:", inicio.toLocaleDateString('es-MX'));
  console.log("[Antigüedad] Fecha hoy:", hoy.toLocaleDateString('es-MX'));

  let años = hoy.getFullYear() - inicio.getFullYear();
  let meses = hoy.getMonth() - inicio.getMonth();
  let dias = hoy.getDate() - inicio.getDate();

  // Ajustar días si son negativos
  if (dias < 0) {
    meses--;
    // Obtener el último día del mes anterior
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }

  // Ajustar meses si son negativos
  if (meses < 0) {
    años--;
    meses += 12;
  }

  // Construir el resultado - SIEMPRE mostrar años, meses y días
  const partes: string[] = [];

  // Siempre incluir años (incluso si es 0)
  if (años > 0) {
    partes.push(`${años} año${años !== 1 ? 's' : ''}`);
  }

  // Siempre incluir meses si hay años o si los meses son > 0
  if (años > 0 || meses > 0) {
    partes.push(`${meses} mes${meses !== 1 ? 'es' : ''}`);
  }

  // Siempre incluir días si hay años o meses, o si los días son > 0
  if (años > 0 || meses > 0 || dias > 0) {
    partes.push(`${dias} día${dias !== 1 ? 's' : ''}`);
  }

  // Si no hay ninguna parte, significa que es el mismo día
  if (partes.length === 0) {
    return 'Menos de 1 día';
  }

  const resultado = partes.join(', ');
  console.log("[Antigüedad] Resultado final:", resultado);
  console.log("[Antigüedad] Años:", años, "Meses:", meses, "Días:", dias);

  return resultado;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresa = searchParams.get("empresa");
    const numEmpleado = searchParams.get("numEmpleado");

    if (!empresa || !numEmpleado) {
      return NextResponse.json(
        { success: false, error: "Empresa y número de empleado son requeridos" },
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

    if (!/^\d+$/.test(numEmpleado)) {
      return NextResponse.json(
        { success: false, error: "El número de empleado debe contener solo números" },
        { status: 400 }
      );
    }

    const soapRequest = buildSoapRequest(cia, numEmpleado);

    console.log("[API Empleados] Consultando:", { empresa, numEmpleado, cia });

    const response = await fetch(
      `${API_URL}?soapAction=getEspecifico&api-key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "getEspecifico",
        },
        body: soapRequest,
      }
    );

    if (!response.ok) {
      console.error("[API Empleados] Error HTTP:", response.status);
      return NextResponse.json(
        { success: false, error: `Error al consultar API: ${response.status}` },
        { status: response.status }
      );
    }

    const xmlText = await response.text();

    // Parsear XML manualmente (simple)
    const nombreMatch = xmlText.match(/<nombre>(.*?)<\/nombre>/);
    const apellPatMatch = xmlText.match(/<apell_pat>(.*?)<\/apell_pat>/);
    const apellMatMatch = xmlText.match(/<apell_mat>(.*?)<\/apell_mat>/);
    const fechaIngresoMatch = xmlText.match(/<fecha_ingreso>(.*?)<\/fecha_ingreso>/);
    const estatusMatch = xmlText.match(/<estatus>(.*?)<\/estatus>/);
    const puestoMatch = xmlText.match(/<puesto>(.*?)<\/puesto>/);
    const areaMatch = xmlText.match(/<area>(.*?)<\/area>/);
    const centroMatch = xmlText.match(/<centro>(.*?)<\/centro>/);
    const lineaMatch = xmlText.match(/<linea>(.*?)<\/linea>/);

    if (!nombreMatch || estatusMatch?.[1] !== "A") {
      return NextResponse.json(
        { success: false, error: "Empleado no encontrado o inactivo" },
        { status: 404 }
      );
    }

    const nombreCompleto = [
      nombreMatch[1],
      apellPatMatch?.[1],
      apellMatMatch?.[1],
    ]
      .filter(Boolean)
      .join(" ");

    const fechaIngreso = fechaIngresoMatch?.[1] || "";
    console.log("[API Empleados] Fecha de ingreso extraída:", fechaIngreso);

    const antiguedad = fechaIngreso
      ? calcularAntiguedad(fechaIngreso)
      : "";

    console.log("[API Empleados] Antigüedad calculada:", antiguedad);

    const clavePuesto = puestoMatch?.[1] || "";
    const area = areaMatch?.[1] || "";
    const centro = centroMatch?.[1] || "";
    const linea = lineaMatch?.[1] || "";

    console.log("[API Empleados] Empleado encontrado:", nombreCompleto);

    return NextResponse.json({
      success: true,
      nombreCompleto,
      antiguedad,
      fechaIngreso,
      clavePuesto,
      area,
      centro,
      linea,
    });

  } catch (error) {
    console.error("[API Empleados] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
