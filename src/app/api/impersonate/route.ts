import { cookies } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const IMPERSONATE_ROLES = ["Administrador", "Owner", "Propietario"];
const COOKIE_NAME = "impersonate-as";

function canImpersonate(roles: string[]): boolean {
  return roles.some((role) => IMPERSONATE_ROLES.includes(role));
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const roles = ((session.user as Record<string, unknown>).roles as string[]) || [];
    if (!canImpersonate(roles)) {
      return Response.json({ error: "No tienes permiso para impersonar" }, { status: 403 });
    }

    const body = await request.json();
    const identifier = String(body?.identifier || "").trim().toLowerCase();

    if (!identifier) {
      return Response.json({ error: "Debes proporcionar un usuario o correo" }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        status: "ACTIVE",
        OR: [
          { username: { equals: identifier, mode: "insensitive" } },
          { email: { equals: identifier, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (!targetUser) {
      return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return Response.json({ error: "No puedes impersonarte a ti mismo" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, targetUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return Response.json({ success: true, userId: targetUser.id });
  } catch (error) {
    console.error("[Impersonate] Error:", error);
    return Response.json({ error: "Error al iniciar impersonación" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Impersonate] Error al detener:", error);
    return Response.json({ error: "Error al detener impersonación" }, { status: 500 });
  }
}
