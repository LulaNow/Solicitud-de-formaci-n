import { NextRequest, NextResponse } from "next/server";

const API_KEY = "9398532e535a4aa689ba86435244c48e";

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

    // Mapear empresa a CIA
    const ciaMap: { [key: string]: string } = {
      Nadro: "643",
      Ubictum: "884",
      PRESTOMYC: "819",
    };

    const cia = ciaMap[empresa];
    if (!cia) {
      return NextResponse.json(
        { success: false, error: "Empresa no válida" },
        { status: 400 }
      );
    }

    console.log("[API Autorizador] Consultando:", { empresa, numEmpleado, cia });

    // Llamar a la API externa
    const url = `https://api.nadro.mx/prod/hum-director/Values?idEmpl=${numEmpleado}&CIA=${cia}`;
    console.log("[API Autorizador] URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("[API Autorizador] Error en respuesta:", response.status);
      return NextResponse.json(
        { success: false, error: "Error al consultar autorizador" },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log("[API Autorizador] Respuesta de la API:", JSON.stringify(data, null, 2));

    if (!data || data.length === 0) {
      console.log("[API Autorizador] No se encontró autorizador");
      return NextResponse.json({
        success: false,
        error: "No se encontró autorizador para este empleado",
      });
    }

    // Extraer datos del primer resultado
    const autorizadorData = data[0];
    console.log("[API Autorizador] Datos del autorizador:", autorizadorData);
    const nombreCompleto = [
      autorizadorData.nombreD,
      autorizadorData.apellido_paterno,
      autorizadorData.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ");

    console.log("[API Autorizador] Autorizador encontrado:", nombreCompleto);

    return NextResponse.json({
      success: true,
      nombreCompleto,
      correoElectronico: autorizadorData.corre_electronico || "",
      idEmpleado: autorizadorData.id_empleado || "",
      nombrePuesto: autorizadorData.nombre_puesto || "",
      nombreDepartamento: autorizadorData.nombre_departamento || "",
    });

  } catch (error) {
    console.error("[API Autorizador] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
