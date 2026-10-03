import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { readFile } from "fs/promises";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const solicitudId = searchParams.get("solicitudId");
    const archivoId = searchParams.get("archivoId");
    const download = searchParams.get("download") === "true";

    // Listar archivos de una solicitud
    if (solicitudId && !archivoId) {
      const archivos = await prisma.archivoSolicitud.findMany({
        where: { solicitudId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileName: true,
          contentType: true,
          sizeBytes: true,
          hash: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ success: true, archivos });
    }

    // Descargar un archivo específico
    if (archivoId) {
      const archivo = await prisma.archivoSolicitud.findUnique({
        where: { id: archivoId },
      });

      if (!archivo) {
        return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
      }

      const fileBuffer = await readFile(archivo.filePath);

      const headers: Record<string, string> = {
        "Content-Type": archivo.contentType,
        "Content-Length": archivo.sizeBytes.toString(),
      };

      if (download) {
        headers["Content-Disposition"] = `attachment; filename="${archivo.fileName}"`;
      } else {
        headers["Content-Disposition"] = `inline; filename="${archivo.fileName}"`;
      }

      return new NextResponse(fileBuffer, { headers });
    }

    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  } catch (error) {
    console.error("[API Archivos] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { archivoId } = await request.json();

    if (!archivoId) {
      return NextResponse.json({ error: "archivoId requerido" }, { status: 400 });
    }

    const archivo = await prisma.archivoSolicitud.findUnique({
      where: { id: archivoId },
    });

    if (!archivo) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    // Eliminar archivo del disco
    const { unlink } = await import("fs/promises");
    try {
      await unlink(archivo.filePath);
    } catch (e) {
      console.warn("[API Archivos] No se pudo eliminar el archivo del disco:", e);
    }

    // Eliminar registro de la base de datos
    await prisma.archivoSolicitud.delete({
      where: { id: archivoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Archivos] Error al eliminar:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
