import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

/**
 * SSO Logout Handler
 * 
 * FUNCIÓN:
 * 1. Verifica si el usuario tiene sesión activa
 * 2. Limpia la cookie de sesión de NextAuth
 * 3. Limpia cualquier cookie relacionada con SSO
 * 4. Redirige al login
 * 
 * NOTA: Este logout solo limpia la sesión LOCAL.
 * Si el sistema SSO externo tiene su propio logout global,
 * podrías redirigir al usuario allí después de limpiar la sesión local.
 */
export async function GET(request: NextRequest) {
  console.log("[SSO Logout] Iniciando proceso de logout...");

  try {
    // Obtener sesión actual
    const session = await auth();
    
    if (session?.user) {
      console.log(`[SSO Logout] Cerrando sesión de: ${session.user.email}`);
    }

    // Crear respuesta de redirección
    const response = NextResponse.redirect(new URL("/login?message=Sesión cerrada exitosamente", APP_URL));

    // Limpiar cookie de sesión de NextAuth
    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    response.cookies.delete(cookieName);

    // Limpiar cookie de state SSO (por si quedó alguna)
    response.cookies.delete("sso_state");

    // Si quieres limpiar otras cookies relacionadas, agrégalas aquí
    // response.cookies.delete("otra_cookie");

    console.log("[SSO Logout] ✅ Sesión cerrada exitosamente");

    return response;

  } catch (error) {
    console.error("[SSO Logout] ❌ Error al cerrar sesión:", error);
    
    // Aún así intentar limpiar cookies y redirigir
    const response = NextResponse.redirect(new URL("/login", APP_URL));
    
    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
    
    response.cookies.delete(cookieName);
    response.cookies.delete("sso_state");
    
    return response;
  }
}

/**
 * POST method para logout desde cliente
 * Útil si quieres hacer logout desde un botón con fetch()
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
