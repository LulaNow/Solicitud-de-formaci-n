import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../trpc";
import { encrypt, decrypt } from "@/lib/security/encryption";

export const ssoRouter = router({
  /**
   * Público — usado por el login page para saber si SSO está habilitado
   * NO expone secrets, solo enabled + appstoreUrl + clientId + callbackPath
   */
  getPublicConfig: publicProcedure.query(async ({ ctx }) => {
    try {
      const settings = await ctx.prisma.appSetting.findMany({
        where: {
          key: {
            in: [
              "sso.enabled",
              "sso.appstore_url",
              "sso.client_id",
              "sso.callback_path",
            ],
          },
        },
      });

      const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

      const enabled =
        map["sso.enabled"] === "true" &&
        !!map["sso.appstore_url"] &&
        !!map["sso.client_id"];

      return {
        enabled,
        appstoreUrl: map["sso.appstore_url"] || "",
        clientId: map["sso.client_id"] || "",
        callbackPath: map["sso.callback_path"] || "/api/auth/sso/callback",
      };
    } catch {
      return {
        enabled: false,
        appstoreUrl: "",
        clientId: "",
        callbackPath: "/api/auth/sso/callback",
      };
    }
  }),

  /**
   * Admin — obtener toda la configuración SSO (sin desencriptar el secret)
   */
  getConfig: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.appSetting.findMany({
      where: { key: { startsWith: "sso." } },
    });

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return {
      enabled: map["sso.enabled"] === "true",
      appstoreUrl: map["sso.appstore_url"] || "",
      clientId: map["sso.client_id"] || "",
      // Solo indicamos si tiene secret configurado, NUNCA exponemos el valor
      hasClientSecret: !!map["sso.client_secret"],
      callbackPath: map["sso.callback_path"] || "/api/auth/sso/callback",
      autoCreateUsers: map["sso.auto_create_users"] === "true",
      defaultRoleOnCreate: map["sso.default_role_on_create"] || "",
    };
  }),

  /**
   * Admin — guardar configuración SSO
   * El client_secret se encripta antes de almacenarse
   */
  saveConfig: adminProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        appstoreUrl: z.string().url("URL inválida").or(z.literal("")),
        clientId: z.string(),
        clientSecret: z.string().optional(), // Opcional — si vacío no se modifica
        callbackPath: z.string().default("/api/auth/sso/callback"),
        autoCreateUsers: z.boolean().default(false),
        defaultRoleOnCreate: z.string().default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Preparar las configuraciones a guardar
      const settingsToSave: { key: string; value: string; type: string }[] = [
        { key: "sso.enabled", value: String(input.enabled), type: "boolean" },
        { key: "sso.appstore_url", value: input.appstoreUrl, type: "string" },
        { key: "sso.client_id", value: input.clientId, type: "string" },
        { key: "sso.callback_path", value: input.callbackPath, type: "string" },
        {
          key: "sso.auto_create_users",
          value: String(input.autoCreateUsers),
          type: "boolean",
        },
        {
          key: "sso.default_role_on_create",
          value: input.defaultRoleOnCreate,
          type: "string",
        },
      ];

      // Solo actualizar el secret si se proporcionó uno nuevo
      if (input.clientSecret && input.clientSecret.trim() !== "") {
        const encryptedSecret = encrypt(input.clientSecret.trim());
        settingsToSave.push({
          key: "sso.client_secret",
          value: encryptedSecret,
          type: "encrypted",
        });
      }

      // Guardar cada configuración con upsert
      for (const s of settingsToSave) {
        await ctx.prisma.appSetting.upsert({
          where: { key: s.key },
          create: { key: s.key, value: s.value, type: s.type },
          update: { value: s.value, type: s.type },
        });
      }

      // Audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "UPDATE",
          entity: "SSOConfig",
          entityId: "sso",
          changes: {
            enabled: input.enabled,
            appstoreUrl: input.appstoreUrl,
            clientId: input.clientId,
            callbackPath: input.callbackPath,
            autoCreateUsers: input.autoCreateUsers,
            // No loguear el secret
            clientSecretChanged: !!input.clientSecret,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Admin — probar la conexión con el AppStore
   * Recibe los datos del formulario directamente (no necesita guardar primero)
   */
  testConnection: adminProcedure
    .input(
      z.object({
        appstoreUrl: z.string(),
        clientId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { appstoreUrl, clientId } = input;

      if (!appstoreUrl || !clientId) {
        return {
          success: false,
          message: "Configuración SSO incompleta. Ingresa URL del AppStore y Client ID.",
        };
      }

      try {
        // Intentar hacer un request al endpoint de authorize (sin redirección)
        const testUrl = `${appstoreUrl}/api/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=test&state=test`;
        const response = await fetch(testUrl, {
          method: "GET",
          redirect: "manual", // No seguir redirects
        });

        // Si recibimos 302 o 400 (redirect o error de parámetro), la URL es accesible
        if (response.status === 302 || response.status === 400 || response.status === 200) {
          return {
            success: true,
            message: `✅ Conexión exitosa con el AppStore (${appstoreUrl}). Status: ${response.status}`,
          };
        }

        return {
          success: false,
          message: `⚠️ El AppStore respondió con status ${response.status}. Verifica la URL.`,
        };
      } catch (error) {
        return {
          success: false,
          message: `❌ No se pudo conectar con ${appstoreUrl}. Verifica que la URL sea correcta y accesible.`,
        };
      }
    }),

  /**
   * Admin — obtener los roles disponibles para mapeo
   */
  getAvailableRoles: adminProcedure.query(async ({ ctx }) => {
    const roles = await ctx.prisma.role.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return roles;
  }),
});
