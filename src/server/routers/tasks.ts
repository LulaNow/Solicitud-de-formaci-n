import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const tasksRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        assignedToId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.status) where.status = input.status;
      if (input.assignedToId) where.assignedToId = input.assignedToId;

      const items = await ctx.prisma.task.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: { id: true, name: true, username: true } },
          createdBy: { select: { id: true, name: true, username: true } },
          updatedBy: { select: { id: true, name: true, username: true } },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return { items, nextCursor };
    }),

  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const task = await ctx.prisma.task.findUnique({
      where: { id: input },
      include: {
        assignedTo: { select: { id: true, name: true, username: true } },
        createdBy: { select: { id: true, name: true, username: true } },
        updatedBy: { select: { id: true, name: true, username: true } },
      },
    });
    if (!task) throw new TRPCError({ code: "NOT_FOUND" });
    return task;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        assignedToId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.create({
        data: {
          name: input.name,
          description: input.description,
          assignedToId: input.assignedToId || null,
          createdById: ctx.user.id,
        },
      });
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "CREATE", entity: "Task", entityId: task.id },
      });
      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        assignedToId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const task = await ctx.prisma.task.findUnique({ where: { id } });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.task.update({
        where: { id },
        data: { ...data, updatedById: ctx.user.id },
      });
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "UPDATE", entity: "Task", entityId: id },
      });
      return { success: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.prisma.task.delete({ where: { id: input } });
    await ctx.prisma.auditLog.create({
      data: { userId: ctx.user.id, action: "DELETE", entity: "Task", entityId: input },
    });
    return { success: true };
  }),

  internalUsers: protectedProcedure.query(async ({ ctx }) => {
    const internalRole = await ctx.prisma.role.findFirst({
      where: { name: { in: ["Interno", "Internal", "Administrador"] } },
    });
    if (!internalRole) return [];

    const userRoles = await ctx.prisma.userRole.findMany({
      where: { roleId: internalRole.id },
      include: { user: { select: { id: true, name: true, username: true, status: true } } },
    });

    return userRoles
      .filter((ur) => ur.user.status === "ACTIVE")
      .map((ur) => ur.user);
  }),
});
