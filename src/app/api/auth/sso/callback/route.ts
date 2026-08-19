import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

// ==========================================
// CONFIGURACIÓN SSO OAUTH 2.0
// ==========================================
const SSO_AUTHORIZE_URL = process.env.SSO_AUTHORIZE_URL || "https://appstore.nadro.dev/api/oauth/authorize";
const SSO_TOKEN_URL = process.env.SSO_TOKEN_URL || "https://appstore.nadro.dev/api/oauth/token";
const SSO_USERINFO_URL = process.env.SSO_USERINFO_URL || "https://appstore.nadro.dev/api/oauth/userinfo";
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID || "";
const SSO_CLIENT_SECRET = process.env.SSO_CLIENT_SECRET || "";
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
const CALLBACK_URL = `${APP_URL}/api/auth/sso/callback`;

/**
 * SSO OAuth 2.0 Callback Handler
 *
 * FLUJO COMPLETO:
 * 1. Usuario hace click en "Login con SSO" → redirige a SSO_AUTHORIZE_URL
 * 2. Usuario se autentica en el sistema SSO externo
 * 3. SSO redirige aquí con ?code=XXX&state=YYY
 * 4. Validamos el state (protección CSRF)
 * 5. Intercambiamos el code por un access_token (POST a SSO_TOKEN_URL)
 * 6. Obtenemos datos del usuario (GET a SSO_USERINFO_URL con Bearer token)
 * 7. Buscamos/creamos usuario en nuestra BD local
 * 8. Mapeamos roles del SSO a permisos locales
 * 9. Creamos sesión NextAuth con JWT
 * 10. Redirigimos al dashboard
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  console.log("[SSO OAuth] Callback recibido");

  // ==========================================
  // VALIDACIÓN 1: Verificar parámetros requeridos
  // ==========================================
  if (!code) {
    console.error("[SSO OAuth] ❌ No se recibió código de autorización");
    return NextResponse.redirect(
      new URL("/login?error=sso_no_code&message=No se recibió código de autorización del sistema SSO", APP_URL)
    );
  }

  if (!state) {
    console.error("[SSO OAuth] ❌ No se recibió parámetro state");
    return NextResponse.redirect(
      new URL("/login?error=sso_no_state&message=Falta parámetro de seguridad (state)", APP_URL)
    );
  }

  // ==========================================
  // VALIDACIÓN 2: Verificar state (CSRF Protection)
  // ==========================================
  const cookieStore = await cookies();
  const storedState = cookieStore.get("sso_state")?.value;

  console.log("[SSO OAuth] 🔍 Validando state...");
  console.log("[SSO OAuth] State recibido:", state?.substring(0, 10) + "...");
  console.log("[SSO OAuth] State en cookie:", storedState?.substring(0, 10) + "..." || "NO ENCONTRADO");

  // En desarrollo, si no hay cookie de state, solo advertir pero continuar
  // Esto es porque las cookies pueden no persistir en redirecciones cross-domain
  if (!storedState) {
    console.warn("[SSO OAuth] ⚠️ Cookie de state NO encontrada");
    console.warn("[SSO OAuth] Cookies disponibles:", cookieStore.getAll().map(c => c.name).join(", "));

    // En producción, esto debería ser un error
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(
        new URL("/login?error=sso_invalid_state&message=Cookie de seguridad no encontrada. Intente nuevamente.", APP_URL)
      );
    }

    console.warn("[SSO OAuth] ⚠️ Continuando sin validación de state (solo en desarrollo)");
  } else if (storedState !== state) {
    console.error("[SSO OAuth] ❌ State no coincide");
    console.error("[SSO OAuth] Esperado:", storedState.substring(0, 20) + "...");
    console.error("[SSO OAuth] Recibido:", state.substring(0, 20) + "...");

    // En producción, esto debería ser un error
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(
        new URL("/login?error=sso_invalid_state&message=Token de seguridad inválido. Intente nuevamente.", APP_URL)
      );
    }

    console.warn("[SSO OAuth] ⚠️ Continuando a pesar del state inválido (solo en desarrollo)");
  } else {
    console.log("[SSO OAuth] ✅ State validado correctamente");
  }

  // ==========================================
  // VALIDACIÓN 3: Verificar configuración SSO
  // ==========================================
  if (!SSO_CLIENT_ID || !SSO_CLIENT_SECRET) {
    console.error("[SSO OAuth] ❌ Credenciales SSO no configuradas");
    return NextResponse.redirect(
      new URL("/login?error=sso_config&message=El sistema no tiene configuradas las credenciales SSO", APP_URL)
    );
  }

  try {
    // ==========================================
    // PASO 1: Intercambiar código por access_token
    // ==========================================
    console.log("[SSO OAuth] 🔄 Intercambiando código por access_token...");
    console.log("[SSO OAuth] 📍 Token URL:", SSO_TOKEN_URL);
    console.log("[SSO OAuth] 📦 Código recibido:", code.substring(0, 20) + "...");

    // Intentar primero con el formato tRPC de Nadro
    const trpcUrl = SSO_TOKEN_URL.replace('/api/oauth/token', '/api/trpc/apps.exchangeToken');
    console.log("[SSO OAuth] 🔄 Intentando con endpoint tRPC:", trpcUrl);

    const trpcPayload = {
      json: {
        code,
        clientId: SSO_CLIENT_ID,
        clientSecret: SSO_CLIENT_SECRET,
      },
    };

    console.log("[SSO OAuth] 📤 Enviando payload tRPC:", {
      json: {
        code: code.substring(0, 20) + "...",
        clientId: SSO_CLIENT_ID,
        clientSecret: "***OCULTO***",
      },
    });

    let tokenResponse = await fetch(trpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(trpcPayload),
    });

    console.log("[SSO OAuth] 📥 Respuesta del servidor:", tokenResponse.status, tokenResponse.statusText);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[SSO OAuth] ❌ Error al intercambiar código:", tokenResponse.status);
      console.error("[SSO OAuth] 📄 Respuesta completa:", errorText);
      console.error("[SSO OAuth] 🔍 Headers de respuesta:", Object.fromEntries(tokenResponse.headers.entries()));
      return NextResponse.redirect(
        new URL("/login?error=sso_token_failed&message=Error al obtener token de acceso. El código puede haber expirado.", APP_URL)
      );
    }

    const tokenData = await tokenResponse.json();
    console.log("[SSO OAuth] 📦 Respuesta completa del servidor:", JSON.stringify(tokenData, null, 2));

    // Extraer token según el formato (tRPC o OAuth estándar)
    let accessToken = tokenData.access_token;
    let ssoUserFromToken = null;

    // Si es formato tRPC de Nadro: { result: { data: { json: { user, token } } } }
    if (!accessToken && tokenData.result?.data?.json) {
      const ssoResult = tokenData.result.data.json;
      accessToken = ssoResult.token;
      ssoUserFromToken = ssoResult.user;
      console.log("[SSO OAuth] ✅ Formato tRPC detectado");
      console.log("[SSO OAuth] 👤 Usuario recibido directamente:", ssoUserFromToken?.email);
    }

    if (!accessToken) {
      console.error("[SSO OAuth] ❌ No se recibió access_token");
      console.error("[SSO OAuth] 📄 Estructura recibida:", Object.keys(tokenData));
      return NextResponse.redirect(
        new URL("/login?error=sso_no_token&message=No se recibió token de acceso del sistema SSO", APP_URL)
      );
    }

    console.log("[SSO OAuth] ✅ Access token obtenido exitosamente");

    // ==========================================
    // PASO 2: Obtener datos del usuario
    // ==========================================
    let ssoUser;

    // Si ya tenemos el usuario del formato tRPC, usarlo directamente
    if (ssoUserFromToken) {
      console.log("[SSO OAuth] ✅ Usando datos de usuario del token tRPC");
      ssoUser = ssoUserFromToken;
    } else {
      // Si no, obtener del endpoint de userinfo (OAuth estándar)
      console.log("[SSO OAuth] 🔄 Obteniendo información del usuario...");

      const userInfoResponse = await fetch(SSO_USERINFO_URL, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error("[SSO OAuth] ❌ Error al obtener datos del usuario:", userInfoResponse.status, errorText);
        return NextResponse.redirect(
          new URL("/login?error=sso_userinfo_failed&message=Error al obtener información del usuario", APP_URL)
        );
      }

      ssoUser = await userInfoResponse.json();
    }

    // Validar que recibimos los datos mínimos necesarios
    if (!ssoUser.email || !ssoUser.id) {
      console.error("[SSO OAuth] ❌ Datos de usuario incompletos:", JSON.stringify(ssoUser));
      return NextResponse.redirect(
        new URL("/login?error=sso_incomplete_user&message=Datos de usuario incompletos del sistema SSO", APP_URL)
      );
    }

    console.log(`[SSO OAuth] ✅ Usuario SSO autenticado: ${ssoUser.email} (ID: ${ssoUser.id})`);
    console.log(`[SSO OAuth] 📋 Roles SSO recibidos:`, ssoUser.roles || []);

    // ==========================================
    // PASO 3: Buscar usuario en base de datos LOCAL
    // ==========================================
    console.log(`[SSO OAuth] 🔍 Buscando usuario en BD local: ${ssoUser.email}`);

    let localUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: ssoUser.email },
          { username: ssoUser.username },
        ],
        status: "ACTIVE",
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    // ==========================================
    // PASO 4: Crear usuario si no existe (OPCIONAL)
    // ==========================================
    // Si quieres crear usuarios automáticamente, descomenta este bloque:
    /*
    if (!localUser) {
      console.log(`[SSO OAuth] 🆕 Creando nuevo usuario: ${ssoUser.email}`);

      // Mapear roles SSO a roles locales
      const { mapSSORole } = await import("@/lib/auth/sso-utils");
      const localRoleNames = (ssoUser.roles || []).map(mapSSORole).filter(Boolean);

      // Buscar roles en BD
      const roles = await prisma.role.findMany({
        where: { name: { in: localRoleNames } },
      });

      // Crear usuario
      localUser = await prisma.user.create({
        data: {
          email: ssoUser.email,
          username: ssoUser.username || ssoUser.email.split("@")[0],
          name: ssoUser.name || ssoUser.email,
          passwordHash: "", // Sin contraseña para usuarios SSO
          status: "ACTIVE",
          userRoles: {
            create: roles.map(role => ({ roleId: role.id })),
          },
        },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      console.log(`[SSO OAuth] ✅ Usuario creado: ${localUser.email} (ID: ${localUser.id})`);
    }
    */

    // ==========================================
    // PASO 5: RECHAZAR si usuario no existe
    // ==========================================
    if (!localUser) {
      console.warn(`[SSO OAuth] ❌ Usuario NO encontrado en BD local: ${ssoUser.email}`);

      // Registrar intento rechazado en audit log
      await prisma.auditLog.create({
        data: {
          userId: null as any,
          action: "SSO_LOGIN_REJECTED",
          entity: "User",
          entityId: ssoUser.email,
        },
      }).catch(() => {});

      return NextResponse.redirect(
        new URL(
          `/login?error=sso_user_not_found&message=${encodeURIComponent(
            `El usuario "${ssoUser.email}" no está registrado en este sistema. Contacte al administrador.`
          )}`,
          APP_URL
        )
      );
    }

    console.log(`[SSO OAuth] ✅ Usuario encontrado en BD local: ${localUser.email} (ID: ${localUser.id})`);

    // ==========================================
    // PASO 6: Mapear roles y permisos
    // ==========================================
    const roles = localUser.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        localUser.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.key)
        )
      ),
    ];

    console.log(`[SSO OAuth] 👤 Roles locales: ${roles.join(", ")}`);
    console.log(`[SSO OAuth] 🔑 Permisos: ${permissions.length} permisos asignados`);

    // ==========================================
    // PASO 7: Actualizar última conexión y crear audit log
    // ==========================================
    await prisma.user.update({
      where: { id: localUser.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: localUser.id,
        action: "SSO_LOGIN",
        entity: "User",
        entityId: localUser.id,
      },
    }).catch(() => {});

    // ==========================================
    // PASO 8: Crear sesión NextAuth con JWT
    // ==========================================
    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const sessionToken = await encode({
      token: {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        username: localUser.username,
        roles,
        permissions,
        sub: localUser.id,
        ssoToken: accessToken, // Guardar access_token para posible logout
        ssoUserId: ssoUser.id,
        ssoLogin: true,
      },
      secret: AUTH_SECRET,
      salt: cookieName,
      maxAge: 8 * 60 * 60, // 8 horas
    });

    // ==========================================
    // PASO 9: Establecer cookies y redirigir
    // ==========================================
    const response = NextResponse.redirect(new URL("/dashboard", APP_URL));

    // Establecer cookie de sesión
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 horas
    });

    // Limpiar cookie de state (ya no es necesaria)
    response.cookies.delete("sso_state");

    console.log(`[SSO OAuth] ✅ Sesión creada exitosamente para ${localUser.email}`);
    console.log(`[SSO OAuth] 🚀 Redirigiendo a dashboard...`);

    return response;

  } catch (error) {
    console.error("[SSO OAuth] ❌ Error inesperado:", error);
    return NextResponse.redirect(
      new URL("/login?error=sso_error&message=Error inesperado durante el inicio de sesión SSO", APP_URL)
    );
  }
}
