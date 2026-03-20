import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const menusRouter = router({
  getForUser: protectedProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.user.roles.includes("Administrador");

    const allItems = await ctx.prisma.menuItem.findMany({
      where: { isActive: true },
      include: { permission: true },
      orderBy: { order: "asc" },
    });

    const userPermissions = new Set(ctx.user.permissions);
    const filtered = allItems.filter(
      (item) =>
        isAdmin ||
        !item.permissionId ||
        userPermissions.has(item.permission?.key || ""),
    );

    const rootItems = filtered.filter((item) => !item.parentId);
    const childMap = new Map<string, typeof filtered>();
    for (const item of filtered) {
      if (item.parentId) {
        const children = childMap.get(item.parentId) || [];
        children.push(item);
        childMap.set(item.parentId, children);
      }
    }

    return rootItems.map((item) => ({
      id: item.id,
      label: item.label,
      labelEs: item.labelEs,
      icon: item.icon,
      path: item.path,
      children: (childMap.get(item.id) || []).map((child) => ({
        id: child.id,
        label: child.label,
        labelEs: child.labelEs,
        icon: child.icon,
        path: child.path,
      })),
    }));
  }),

  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.menuItem.findMany({
      include: { permission: true, children: { orderBy: { order: "asc" } } },
      where: { parentId: null },
      orderBy: { order: "asc" },
    });
  }),

  allFlat: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.menuItem.findMany({
      include: { permission: true },
      orderBy: { order: "asc" },
    });
  }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        labelEs: z.string().optional(),
        icon: z.string().optional(),
        path: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
        parentId: z.string().nullable().optional(),
        permissionId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.menuItem.update({ where: { id }, data });
    }),

  create: adminProcedure
    .input(
      z.object({
        label: z.string().min(1),
        labelEs: z.string().optional(),
        icon: z.string().optional(),
        path: z.string().optional(),
        parentId: z.string().nullable().optional(),
        permissionId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const maxOrder = await ctx.prisma.menuItem.aggregate({
        _max: { order: true },
        where: { parentId: input.parentId || null },
      });
      const order = (maxOrder._max.order ?? 0) + 1;

      const item = await ctx.prisma.menuItem.create({
        data: {
          label: input.label,
          labelEs: input.labelEs || input.label,
          icon: input.icon,
          path: input.path,
          parentId: input.parentId || null,
          permissionId: input.permissionId || null,
          order,
        },
      });

      if (input.path && !input.permissionId) {
        const moduleName =
          input.path.replace(/^\//, "").split("/")[0] || "general";
        const existingPerm = await ctx.prisma.permission.findFirst({
          where: { module: moduleName, action: "read" },
        });
        if (existingPerm) {
          await ctx.prisma.menuItem.update({
            where: { id: item.id },
            data: { permissionId: existingPerm.id },
          });
        }
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "CREATE",
          entity: "MenuItem",
          entityId: item.id,
        },
      });
      return item;
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const item = await ctx.prisma.menuItem.findUnique({
      where: { id: input },
      include: { children: true },
    });
    if (!item) throw new TRPCError({ code: "NOT_FOUND" });
    if (item.children.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "No se puede eliminar un menú con hijos. Elimine los hijos primero.",
      });
    }
    await ctx.prisma.menuItem.delete({ where: { id: input } });
    await ctx.prisma.auditLog.create({
      data: {
        userId: ctx.user.id,
        action: "DELETE",
        entity: "MenuItem",
        entityId: input,
      },
    });
    return { success: true };
  }),

  reorder: adminProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          order: z.number(),
          parentId: z.string().nullable(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(
        input.map((item) =>
          ctx.prisma.menuItem.update({
            where: { id: item.id },
            data: { order: item.order, parentId: item.parentId },
          }),
        ),
      );
      return { success: true };
    }),

  permissions: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });
  }),
});
