import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { prisma } = await import("@/lib/db/prisma");
        const { verifyPassword } = await import("@/lib/security/hash");

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: parsed.data.username },
              { email: parsed.data.username },
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

        if (!user) return null;

        const isValid = await verifyPassword(
          parsed.data.password,
          user.passwordHash
        );
        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
          },
        });

        const roles = user.userRoles.map((ur) => ur.role.name);
        const permissions = [
          ...new Set(
            user.userRoles.flatMap((ur) =>
              ur.role.rolePermissions.map((rp) => rp.permission.key)
            )
          ),
        ];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          roles,
          permissions,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as Record<string, unknown>).username as string;
        token.roles = (user as Record<string, unknown>).roles as string[];
        token.permissions = (user as Record<string, unknown>).permissions as string[];
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as Record<string, unknown>).username = token.username;
        (session.user as Record<string, unknown>).roles = token.roles;
        (session.user as Record<string, unknown>).permissions = token.permissions;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnPortal = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/forms") ||
        nextUrl.pathname.startsWith("/requests");
      const isOnLogin = nextUrl.pathname === "/login";
      const isPublicForm = nextUrl.pathname.startsWith("/f/");

      if (isPublicForm) return true;
      if (isOnPortal && !isLoggedIn) return false;
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  secret: process.env.AUTH_SECRET,
};
