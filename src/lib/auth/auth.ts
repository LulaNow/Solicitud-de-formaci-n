import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export type ImpersonatedBy = {
  id: string;
  email: string;
  name: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  roles: string[];
  permissions: string[];
  impersonatedBy?: ImpersonatedBy;
};

const IMPERSONATE_ROLES = ["Administrador", "Owner", "Propietario"];

function sessionUserFromToken(session: any): SessionUser {
  return {
    id: session.user.id as string,
    email: session.user.email as string,
    name: session.user.name as string,
    username: (session.user as Record<string, unknown>).username as string,
    roles: ((session.user as Record<string, unknown>).roles as string[]) || [],
    permissions:
      ((session.user as Record<string, unknown>).permissions as string[]) || [],
  };
}

export function canImpersonate(user: SessionUser | null): boolean {
  if (!user) return false;
  return user.roles.some((role) => IMPERSONATE_ROLES.includes(role));
}

async function loadUserWithRoles(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId, status: "ACTIVE" },
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
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  const realUser = sessionUserFromToken(session);

  const cookieStore = await cookies();
  const impersonateId = cookieStore.get("impersonate-as")?.value;

  if (impersonateId && canImpersonate(realUser)) {
    const targetUser = await loadUserWithRoles(impersonateId);
    if (targetUser) {
      return {
        ...targetUser,
        impersonatedBy: {
          id: realUser.id,
          email: realUser.email,
          name: realUser.name,
        },
      };
    }
  }

  return realUser;
}

export function hasPermission(
  user: SessionUser | null,
  permission: string
): boolean {
  if (!user) return false;
  if (user.roles.includes("Administrador")) return true;
  return user.permissions.includes(permission);
}

export function hasRole(user: SessionUser | null, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}
