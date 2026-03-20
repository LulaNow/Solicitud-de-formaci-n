import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type SessionUser, getSessionUser } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export type Context = {
  user: SessionUser | null;
  prisma: typeof prisma;
};

export async function createContext(): Promise<Context> {
  const user = await getSessionUser();
  return { user, prisma };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No autorizado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No autorizado" });
  }
  if (!ctx.user.roles.includes("Administrador")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Se requiere rol de Administrador",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export function requirePermission(permission: string) {
  return t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "No autorizado" });
    }
    if (
      !ctx.user.roles.includes("Administrador") &&
      !ctx.user.permissions.includes(permission)
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Permiso requerido: ${permission}`,
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}
