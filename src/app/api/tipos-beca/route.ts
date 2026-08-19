import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const puesto = searchParams.get("puesto");

    if (!puesto) {
      return NextResponse.json(
        { success: false, error: "Puesto es requerido" },
        { status: 400 }
      );
    }

    console.log("[API Tipos Beca] Consultando tipos de beca para puesto:", puesto);

    // Buscar el puesto EXACTO en la tabla puestos_tipo_beca
    const registro = await prisma.puestoTipoBeca.findFirst({
      where: {
        puesto: puesto.toUpperCase().trim(),
      },
    });

    // Definir las opciones según el valor de tipo_beca
    const opcionesPorCategoria: { [key: string]: string[] } = {
      "PUESTOS OPERATIVOS": [
        "Curso",
        "Diplomado",
        "Bachillerato",
        "Licenciatura"
      ],
      "HASTA EL NIVEL GERENCIAL": [
        "Curso",
        "Diplomado",
        "Bachillerato",
        "Licenciatura",
        "Titulación"
      ],
      "GERENCIA O CARGOS SUPERIORES": [
        "Curso",
        "Certificación",
        "Maestría",
        "Seminario",
        "Titulación de maestría",
        "Licenciatura",
        "Diplomado",
        "Bachillerato",
        "Titulación de licenciatura",
        "Otros"
      ]
    };

    let tiposBeca: string[];
    let categoriaPuesto: string;

    if (!registro) {
      // Si no se encuentra el puesto, usar opciones por defecto (GERENCIA O CARGOS SUPERIORES)
      console.log("[API Tipos Beca] Puesto no encontrado en tabla, usando opciones por defecto");
      tiposBeca = opcionesPorCategoria["GERENCIA O CARGOS SUPERIORES"];
      categoriaPuesto = "No encontrado - usando opciones completas";
    } else {
      // Usar el valor de tipo_beca para determinar las opciones
      categoriaPuesto = registro.tipoBeca;
      tiposBeca = opcionesPorCategoria[registro.tipoBeca] || opcionesPorCategoria["GERENCIA O CARGOS SUPERIORES"];

      console.log("[API Tipos Beca] Puesto encontrado:", registro.puesto);
      console.log("[API Tipos Beca] Categoría (tipo_beca):", registro.tipoBeca);
    }

    console.log("[API Tipos Beca] Opciones disponibles:", tiposBeca);

    return NextResponse.json({
      success: true,
      tiposBeca,
      categoriaPuesto,
    });

  } catch (error) {
    console.error("[API Tipos Beca] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
