import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const solicitudId = formData.get("solicitudId") as string;

    if (!file || !solicitudId) {
      return NextResponse.json(
        { error: "Archivo y solicitudId son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Leer el archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Calcular hash SHA-256
    const hash = createHash("sha256").update(buffer).digest("hex");

    // Verificar si ya existe un archivo con el mismo hash para esta solicitud
    const existing = await prisma.archivoSolicitud.findFirst({
      where: { solicitudId, hash },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este archivo ya fue adjuntado a la solicitud" },
        { status: 409 }
      );
    }

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), "uploads", "solicitudes", solicitudId);
    await mkdir(uploadDir, { recursive: true });

    // Guardar archivo en disco
    const filePath = join(uploadDir, `${hash}_${file.name}`);
    await writeFile(filePath, buffer);

    // Guardar registro en la base de datos
    const archivo = await prisma.archivoSolicitud.create({
      data: {
        solicitudId,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: buffer.length,
        hash,
        filePath: filePath,
      },
    });

    console.log("[API Archivos] Archivo guardado:", archivo.id, file.name);

    return NextResponse.json({
      success: true,
      archivo: {
        id: archivo.id,
        fileName: archivo.fileName,
        contentType: archivo.contentType,
        sizeBytes: archivo.sizeBytes,
        hash: archivo.hash,
        createdAt: archivo.createdAt,
      },
    });
  } catch (error) {
    console.error("[API Archivos] Error al subir archivo:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
