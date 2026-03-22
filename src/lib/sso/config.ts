/**
 * SSO Configuration Helper
 *
 * Lee la configuración SSO desde la base de datos (tabla AppSetting, keys con prefijo "sso.")
 * y desencripta los valores sensibles (client_secret).
 *
 * Esto reemplaza las variables de entorno SSO_APPSTORE_URL, SSO_CLIENT_ID, SSO_CLIENT_SECRET
 */
import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";

export type SSOConfig = {
  enabled: boolean;
  appstoreUrl: string;
  clientId: string;
  clientSecret: string; // desencriptado
  callbackPath: string;
  autoCreateUsers: boolean;
  defaultRoleOnCreate: string;
};

/**
 * Obtiene la configuración SSO desde la base de datos.
 * Los valores sensibles (client_secret) se almacenan encriptados con AES-256-GCM.
 */
export async function getSSOConfig(): Promise<SSOConfig | null> {
  try {
    const settings = await prisma.appSetting.findMany({
      where: { key: { startsWith: "sso." } },
    });

    if (settings.length === 0) return null;

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    const enabled = map["sso.enabled"] === "true";
    const appstoreUrl = map["sso.appstore_url"] || "";
    const clientId = map["sso.client_id"] || "";
    const clientSecretEncrypted = map["sso.client_secret"] || "";
    const callbackPath = map["sso.callback_path"] || "/api/auth/sso/callback";
    const autoCreateUsers = map["sso.auto_create_users"] === "true";
    const defaultRoleOnCreate = map["sso.default_role_on_create"] || "";

    // Si no hay credenciales configuradas, retornar null
    if (!appstoreUrl || !clientId || !clientSecretEncrypted) return null;

    // Desencriptar el client_secret
    let clientSecret = "";
    try {
      clientSecret = decrypt(clientSecretEncrypted);
    } catch {
      console.error("[SSO Config] Error al desencriptar client_secret");
      return null;
    }

    return {
      enabled,
      appstoreUrl,
      clientId,
      clientSecret,
      callbackPath,
      autoCreateUsers,
      defaultRoleOnCreate,
    };
  } catch (error) {
    console.error("[SSO Config] Error al leer configuración:", error);
    return null;
  }
}

/**
 * Verifica rápidamente si SSO está habilitado (sin desencriptar secrets).
 * Útil para el login page.
 */
export async function isSSOEnabled(): Promise<{
  enabled: boolean;
  appstoreUrl: string;
  clientId: string;
  callbackPath: string;
}> {
  try {
    const settings = await prisma.appSetting.findMany({
      where: {
        key: { in: ["sso.enabled", "sso.appstore_url", "sso.client_id", "sso.callback_path"] },
      },
    });

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return {
      enabled: map["sso.enabled"] === "true" && !!map["sso.appstore_url"] && !!map["sso.client_id"],
      appstoreUrl: map["sso.appstore_url"] || "",
      clientId: map["sso.client_id"] || "",
      callbackPath: map["sso.callback_path"] || "/api/auth/sso/callback",
    };
  } catch {
    return { enabled: false, appstoreUrl: "", clientId: "", callbackPath: "" };
  }
}
