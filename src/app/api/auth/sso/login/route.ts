import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

// ==========================================
// CONFIGURACIÓN SSO OAUTH 2.0
// ==========================================
const SSO_AUTHORIZE_URL = process.env.SSO_AUTHORIZE_URL || "https://appstore.nadro.dev/api/oauth/authorize";
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
const CALLBACK_URL = `${APP_URL}/api/auth/sso/callback`;

/**
 * SSO OAuth 2.0 Login Initiator
 *
 * FUNCIÓN:
 * 1. Genera un state aleatorio para protección CSRF
 * 2. Guarda el state en una cookie httpOnly
 * 3. Redirige al usuario al sistema SSO externo para autenticación
 *
 * FLUJO:
 * Usuario → Click "Login con SSO" → Esta ruta → SSO Externo → Callback
 */
export async function GET(request: NextRequest) {
  console.log("[SSO OAuth] Iniciando flujo de autenticación SSO...");

  // ==========================================
  // VALIDACIÓN: Verificar configuración
  // ==========================================
  if (!SSO_CLIENT_ID) {
    console.error("[SSO OAuth] ❌ SSO_CLIENT_ID no configurado");
    return NextResponse.redirect(
      new URL("/login?error=sso_config&message=El sistema no tiene configurado el Client ID de SSO", APP_URL)
    );
  }

  try {
    // ==========================================
    // PASO 1: Generar state aleatorio (CSRF Protection)
    // ==========================================
    // El state es un token único que se valida en el callback
    // para prevenir ataques CSRF (Cross-Site Request Forgery)
    const state = randomBytes(32).toString("hex");
    console.log("[SSO OAuth] 🔐 State generado para protección CSRF");

    // ==========================================
    // PASO 2: Construir URL de autorización
    // ==========================================
    const authUrl = new URL(SSO_AUTHORIZE_URL);
    authUrl.searchParams.set("client_id", SSO_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", CALLBACK_URL);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);

    // Opcional: agregar scope si el SSO lo requiere
    // authUrl.searchParams.set("scope", "openid profile email");

    console.log("[SSO OAuth] 🔗 URL de autorización construida");
    console.log("[SSO OAuth] 📍 Redirect URI:", CALLBACK_URL);

    // ==========================================
    // PASO 3: Crear respuesta con cookie de state
    // ==========================================
    const response = NextResponse.redirect(authUrl.toString());

    // Guardar state en cookie httpOnly (segura, no accesible desde JavaScript)
    response.cookies.set("sso_state", state, {
      httpOnly: true, // No accesible desde JavaScript
      secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
      sameSite: "lax", // Protección adicional contra CSRF
      path: "/",
      maxAge: 60 * 10, // 10 minutos (tiempo suficiente para completar el flujo)
    });

    console.log("[SSO OAuth] 🍪 Cookie de state guardada:", state.substring(0, 10) + "...");
    console.log("[SSO OAuth] ✅ Redirigiendo al sistema SSO externo...");

    return response;

  } catch (error) {
    console.error("[SSO OAuth] ❌ Error al iniciar SSO:", error);
    return NextResponse.redirect(
      new URL("/login?error=sso_init_error&message=Error al iniciar el proceso de SSO", APP_URL)
    );
  }
}
