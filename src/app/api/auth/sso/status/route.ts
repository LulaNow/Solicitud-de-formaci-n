import { NextResponse } from "next/server";
import { isSSOEnabled } from "@/lib/sso/config";

/**
 * GET /api/auth/sso/status
 *
 * Endpoint público que retorna si SSO está habilitado.
 * Usado por la página de login para mostrar/ocultar el botón "Login con SSO".
 * NO expone secrets — solo enabled, appstoreUrl, clientId, callbackPath.
 */
export async function GET() {
  try {
    const ssoStatus = await isSSOEnabled();
    return NextResponse.json(ssoStatus);
  } catch {
    return NextResponse.json({ enabled: false, appstoreUrl: "", clientId: "", callbackPath: "" });
  }
}
