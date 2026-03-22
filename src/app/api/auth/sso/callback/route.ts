import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { encode } from "next-auth/jwt";

const SSO_APPSTORE_URL = process.env.SSO_APPSTORE_URL || "http://localhost:3000";
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID || "";
const SSO_CLIENT_SECRET = process.env.SSO_CLIENT_SECRET || "";
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

/**
 * SSO Callback Handler
 * 
 * Flow:
 * 1. AppStore redirects user here with ?code=XXX
 * 2. We exchange the code with AppStore's exchangeToken endpoint
 * 3. We get back user data (email, username, name, roles)
 * 4. We look up the user in OUR LOCAL database
 * 5. If user exists locally → create session → redirect to dashboard
 * 6. If user does NOT exist → redirect to /login with error
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

  // Validate SSO configuration
  if (!SSO_CLIENT_ID || !SSO_CLIENT_SECRET) {
    console.error("[SSO] SSO_CLIENT_ID or SSO_CLIENT_SECRET not configured");
    return NextResponse.redirect(
      new URL("/login?error=sso_config&message=El portal no tiene configuradas las credenciales SSO", APP_URL)
    );
  }

  try {
    // ==========================================
    // STEP 1: Exchange code with AppStore
    // ==========================================
    console.log("[SSO] Exchanging authorization code with AppStore...");

    const exchangeUrl = `${SSO_APPSTORE_URL}/api/trpc/apps.exchangeToken`;
    const exchangeResponse = await fetch(exchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          code,
          clientId: SSO_CLIENT_ID,
          clientSecret: SSO_CLIENT_SECRET,
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
    // STEP 3: REJECT if user does NOT exist locally
    // ==========================================
    if (!localUser) {
      console.warn(`[SSO] ❌ User NOT FOUND in local database: ${ssoUser.email} (${ssoUser.username})`);

      // Log the rejected SSO attempt
      await prisma.auditLog.create({
        data: {
          userId: null as any, // No local user ID
          action: "SSO_LOGIN_REJECTED",
          entity: "User",
          entityId: "unknown",
          details: JSON.stringify({
            ssoEmail: ssoUser.email,
            ssoUsername: ssoUser.username,
            ssoName: ssoUser.name,
            reason: "User does not exist in local database",
          }),
        },
      }).catch(() => {
        // Ignore audit log errors - don't block the response
      });

      return NextResponse.redirect(
        new URL(
          `/login?error=sso_user_not_found&message=${encodeURIComponent(
            `El usuario "${ssoUser.email}" no existe en este portal. Contacte al administrador para que lo registre.`
          )}`,
          APP_URL
        )
      );
    }

    console.log(`[SSO] ✅ User found in local database: ${localUser.email} (ID: ${localUser.id})`);

    // ==========================================
    // STEP 4: Create NextAuth session
    // ==========================================
    const roles = localUser.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        localUser.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.key)
        )
      ),
    ];

    // Update last login
    await prisma.user.update({
      where: { id: localUser.id },
      data: { lastLoginAt: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: localUser.id,
        action: "SSO_LOGIN",
        entity: "User",
        entityId: localUser.id,
        details: JSON.stringify({
          ssoToken,
          ssoProvider: "AppStore",
          ssoEmail: ssoUser.email,
        }),
      },
    }).catch(() => {});

    // Create JWT token for NextAuth session
    const token = await encode({
      token: {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        username: localUser.username,
        roles,
        permissions,
        sub: localUser.id,
        ssoToken, // Store SSO token for potential logout
        ssoLogin: true,
      },
      secret: AUTH_SECRET,
      maxAge: 8 * 60 * 60, // 8 hours
    });

    // Set the session cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL("/dashboard", APP_URL));

    // Set the NextAuth session cookie
    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    console.log(`[SSO] ✅ Session created for ${localUser.email} - redirecting to dashboard`);

    return response;
  } catch (error) {
    console.error("[SSO] Unexpected error:", error);
    return NextResponse.redirect(
      new URL("/login?error=sso_error&message=Error inesperado durante el inicio de sesión SSO", APP_URL)
    );
  }
}
