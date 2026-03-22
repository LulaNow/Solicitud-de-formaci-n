import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { encode } from "next-auth/jwt";
import { getSSOConfig } from "@/lib/sso/config";

const AUTH_SECRET = process.env.AUTH_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

/**
 * SSO Callback Handler
 *
 * Flow:
 * 1. AppStore redirects user here with ?code=XXX
 * 2. We read SSO config from DATABASE (not env vars)
 * 3. We exchange the code with AppStore's exchangeToken endpoint
 * 4. We get back user data (email, username, name, roles)
 * 5. We look up the user in OUR LOCAL database
 * 6. If user exists locally → create session → redirect to dashboard
 * 7. If auto-create is enabled and user doesn't exist → create user → session → dashboard
 * 8. If user does NOT exist and auto-create is off → redirect to /login with error
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  // Validate code parameter
  if (!code) {
    console.error("[SSO] No authorization code received");
    return NextResponse.redirect(
      new URL("/login?error=sso_no_code&message=No se recibió código de autorización del AppStore", APP_URL)
    );
  }

  // Read SSO configuration from DATABASE
  const ssoConfig = await getSSOConfig();

  if (!ssoConfig || !ssoConfig.enabled) {
    console.error("[SSO] SSO is not configured or not enabled in database");
    return NextResponse.redirect(
      new URL("/login?error=sso_config&message=El portal no tiene configuradas las credenciales SSO. Configure desde Admin → Configuración → SSO", APP_URL)
    );
  }

  const { appstoreUrl, clientId, clientSecret, autoCreateUsers, defaultRoleOnCreate } = ssoConfig;

  try {
    // ==========================================
    // STEP 1: Exchange code with AppStore
    // ==========================================
    console.log("[SSO] Exchanging authorization code with AppStore...");

    const exchangeUrl = `${appstoreUrl}/api/trpc/apps.exchangeToken`;
    const exchangeResponse = await fetch(exchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          code,
          clientId: clientId,
          clientSecret: clientSecret,
        },
      }),
    });

    if (!exchangeResponse.ok) {
      const errorText = await exchangeResponse.text();
      console.error("[SSO] AppStore code exchange failed:", exchangeResponse.status, errorText);
      return NextResponse.redirect(
        new URL("/login?error=sso_exchange_failed&message=Error al validar el código con el AppStore. El código puede haber expirado.", APP_URL)
      );
    }

    const exchangeData = await exchangeResponse.json();

    // tRPC wraps response in { result: { data: { json: ... } } }
    const ssoResult = exchangeData?.result?.data?.json || exchangeData?.result?.data || exchangeData;

    if (!ssoResult?.user) {
      console.error("[SSO] No user data in AppStore response:", JSON.stringify(exchangeData));
      return NextResponse.redirect(
        new URL("/login?error=sso_no_user&message=No se recibieron datos del usuario desde el AppStore", APP_URL)
      );
    }

    const ssoUser = ssoResult.user;
    const ssoToken = ssoResult.token;

    console.log(`[SSO] AppStore user authenticated: ${ssoUser.email} (${ssoUser.username})`);

    // ==========================================
    // STEP 2: Look up user in LOCAL database
    // ==========================================
    console.log(`[SSO] Looking up user in local database: email=${ssoUser.email}, username=${ssoUser.username}`);

    const localUser = await prisma.user.findFirst({
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
    // STEP 3: Handle user not existing locally
    // ==========================================
    let finalUser = localUser;

    if (!localUser) {
      // Check if auto-create is enabled
      if (autoCreateUsers) {
        console.log(`[SSO] 🔄 Auto-creating user: ${ssoUser.email} (${ssoUser.username})`);

        // Generate a random password hash (user will only login via SSO)
        const { hashPassword } = await import("@/lib/security/hash");
        const randomPassword = crypto.randomUUID() + crypto.randomUUID();
        const passwordHash = await hashPassword(randomPassword);

        // Create the user
        const newUser = await prisma.user.create({
          data: {
            email: ssoUser.email,
            username: ssoUser.username,
            name: ssoUser.name || ssoUser.username,
            passwordHash,
            status: "ACTIVE",
            lastLoginAt: new Date(),
            ...(defaultRoleOnCreate
              ? {
                  userRoles: {
                    create: {
                      roleId: defaultRoleOnCreate,
                    },
                  },
                }
              : {}),
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

        // Audit log for auto-creation
        await prisma.auditLog.create({
          data: {
            userId: newUser.id,
            action: "SSO_AUTO_CREATE",
            entity: "User",
            entityId: newUser.id,
            changes: {
              email: ssoUser.email,
              username: ssoUser.username,
              name: ssoUser.name,
              autoCreated: true,
            },
          },
        }).catch(() => {});

        console.log(`[SSO] ✅ User auto-created: ${newUser.email} (ID: ${newUser.id})`);
        finalUser = newUser;
      } else {
        console.warn(`[SSO] ❌ User NOT FOUND in local database: ${ssoUser.email} (${ssoUser.username})`);

        // Log the rejected SSO attempt
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
              `El usuario "${ssoUser.email}" no existe en este portal. Contacte al administrador para que lo registre.`
            )}`,
            APP_URL
          )
        );
      }
    }

    console.log(`[SSO] ✅ User ready: ${finalUser!.email} (ID: ${finalUser!.id})`);

    // ==========================================
    // STEP 4: Create NextAuth session
    // ==========================================
    const roles = finalUser!.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        finalUser!.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.key)
        )
      ),
    ];

    // Update last login
    await prisma.user.update({
      where: { id: finalUser!.id },
      data: { lastLoginAt: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: finalUser!.id,
        action: "SSO_LOGIN",
        entity: "User",
        entityId: finalUser!.id,
      },
    }).catch(() => {});

    // Set the NextAuth session cookie name
    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    // Create JWT token for NextAuth session
    const token = await encode({
      token: {
        id: finalUser!.id,
        email: finalUser!.email,
        name: finalUser!.name,
        username: finalUser!.username,
        roles,
        permissions,
        sub: finalUser!.id,
        ssoToken, // Store SSO token for potential logout
        ssoLogin: true,
      },
      secret: AUTH_SECRET,
      salt: cookieName,
      maxAge: 8 * 60 * 60, // 8 hours
    });

    // Set the session cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL("/dashboard", APP_URL));

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    console.log(`[SSO] ✅ Session created for ${finalUser!.email} - redirecting to dashboard`);

    return response;
  } catch (error) {
    console.error("[SSO] Unexpected error:", error);
    return NextResponse.redirect(
      new URL("/login?error=sso_error&message=Error inesperado durante el inicio de sesión SSO", APP_URL)
    );
  }
}
