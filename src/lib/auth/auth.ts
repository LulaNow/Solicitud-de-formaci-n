import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  roles: string[];
  permissions: string[];
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

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
