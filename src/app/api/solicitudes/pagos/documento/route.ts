import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";

// Verifica que el usuario autenticado sea el creador de la solicitud o administrador
async function verificarAcceso(pagoId: string, userId: string, roles: string[]) {
  const pago = await prisma.pagoSolicitud.findUnique({
    where: { id: pagoId },
    include: { solicitud: { select: { usuarioId: true } } },
  });

  if (!pago) {
    return { error: "Pago no encontrado", status: 404, pago: null };
  }

  const esCreador = pago.solicitud.usuarioId === userId;
  const esAdmin = roles.includes("Administrador");
  if (!esCreador && !esAdmin) {
    return { error: "Sin permiso sobre este pago", status: 403, pago: null };
  }

  return { error: null, status: 200, pago };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const pagoId = formData.get("pagoId") as string;

    if (!file || !pagoId) {
      return NextResponse.json(
        { error: "Archivo y pagoId son requeridos" },
        { status: 400 }
      );
    }

    const userId = (session.user as { id?: string }).id as string;
    const roles = ((session.user as { roles?: string[] }).roles || []) as string[];
    const acceso = await verificarAcceso(pagoId, userId, roles);
    if (acceso.error) {
      return NextResponse.json({ error: acceso.error }, { status: acceso.status });
    }
    const pago = acceso.pago!;

    // Leer archivo y calcular hash
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hash = createHash("sha256").update(buffer).digest("hex");

    // Guardar en disco: uploads/pagos/{solicitudId}/
    const uploadDir = join(process.cwd(), "uploads", "pagos", pago.solicitudId);
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, `${hash}_${file.name}`);
    await writeFile(filePath, buffer);

    // Eliminar documento anterior del disco si existía
    if (pago.filePath && pago.filePath !== filePath) {
      try {
        await unlink(pago.filePath);
      } catch {
        // El archivo anterior ya no existe
      }
    }

    await prisma.pagoSolicitud.update({
      where: { id: pagoId },
      data: {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: buffer.length,
        hash,
        filePath,
      },
    });

    return NextResponse.json({
      success: true,
      fileName: file.name,
      sizeBytes: buffer.length,
    });
  } catch (error) {
    console.error("[API Pagos] Error al subir documento:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const pagoId = request.nextUrl.searchParams.get("pagoId");
    const download = request.nextUrl.searchParams.get("download") === "true";

    if (!pagoId) {
      return NextResponse.json({ error: "pagoId requerido" }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id as string;
    const roles = ((session.user as { roles?: string[] }).roles || []) as string[];
    const acceso = await verificarAcceso(pagoId, userId, roles);
    if (acceso.error) {
      return NextResponse.json({ error: acceso.error }, { status: acceso.status });
    }
    const pago = acceso.pago!;

    if (!pago.filePath || !pago.fileName) {
      return NextResponse.json(
        { error: "Este pago no tiene documento adjunto" },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(pago.filePath);

    const headers: Record<string, string> = {
      "Content-Type": pago.contentType || "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${pago.fileName}"`,
    };
    if (pago.sizeBytes) {
      headers["Content-Length"] = pago.sizeBytes.toString();
    }

    return new NextResponse(new Uint8Array(fileBuffer), { headers });
  } catch (error) {
    console.error("[API Pagos] Error al descargar documento:", error);
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

    const { pagoId } = await request.json();
    if (!pagoId) {
      return NextResponse.json({ error: "pagoId requerido" }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id as string;
    const roles = ((session.user as { roles?: string[] }).roles || []) as string[];
    const acceso = await verificarAcceso(pagoId, userId, roles);
    if (acceso.error) {
      return NextResponse.json({ error: acceso.error }, { status: acceso.status });
    }
    const pago = acceso.pago!;

    if (pago.filePath) {
      try {
        await unlink(pago.filePath);
      } catch {
        // El archivo ya no existe en disco
      }
    }

    await prisma.pagoSolicitud.update({
      where: { id: pagoId },
      data: {
        fileName: null,
        contentType: null,
        sizeBytes: null,
        hash: null,
        filePath: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Pagos] Error al eliminar documento:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
