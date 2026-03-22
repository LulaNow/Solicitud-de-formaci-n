import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../trpc";
import { hashPassword } from "@/lib/security/hash";
import { TRPCError } from "@trpc/server";

export const usersRouter = router({
  list: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.user.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: input.search
          ? {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
                { username: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: { include: { role: true } },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return { items, nextCursor };
    }),

  getById: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: { include: { role: true } },
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
    return user;
  }),

  create: adminProcedure
    .input(
      z.object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        password: z.string().min(4),
        name: z.string().min(1),
        roleIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { OR: [{ email: input.email }, { username: input.username }] },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email o username ya existe" });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await ctx.prisma.user.create({
        data: {
          username: input.username,
          email: input.email,
          passwordHash,
          name: input.name,
          userRoles: {
            create: input.roleIds.map((roleId) => ({ roleId })),
          },
        },
      });

      // Create audit log (skip if user doesn't exist in local DB - e.g., SSO user)
      try {
        await ctx.prisma.auditLog.create({
          data: {
            userId: ctx.user.id,
            action: "CREATE",
            entity: "User",
            entityId: user.id,
          },
        });
      } catch (error) {
        // Ignore audit log errors - don't block user creation
        console.warn("[users.create] Failed to create audit log:", error);
      }

      return { id: user.id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email().optional(),
        name: z.string().min(1).optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
        password: z.string().min(4).optional(),
        roleIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, roleIds, password, ...data } = input;

      const updateData: Record<string, unknown> = { ...data };
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }

      await ctx.prisma.user.update({ where: { id }, data: updateData });

      if (roleIds) {
        await ctx.prisma.userRole.deleteMany({ where: { userId: id } });
        await ctx.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }

      try {
        await ctx.prisma.auditLog.create({
          data: {
            userId: ctx.user.id,
            action: "UPDATE",
            entity: "User",
            entityId: id,
          },
        });
      } catch (error) {
        console.warn("[users.update] Failed to create audit log:", error);
      }

      return { success: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    if (input === ctx.user.id) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes eliminarte a ti mismo" });
    }
    await ctx.prisma.user.delete({ where: { id: input } });
    try {
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "DELETE", entity: "User", entityId: input },
      });
    } catch (error) {
      console.warn("[users.delete] Failed to create audit log:", error);
    }
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
        lastLoginAt: true,
        userRoles: { include: { role: true } },
      },
    });
  }),
});
