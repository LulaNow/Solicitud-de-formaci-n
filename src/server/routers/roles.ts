import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const rolesRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
  }),

  getById: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const role = await ctx.prisma.role.findUnique({
      where: { id: input },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
    if (!role) throw new TRPCError({ code: "NOT_FOUND" });
    return role;
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        permissionIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.create({
        data: {
          name: input.name,
          description: input.description,
          rolePermissions: {
            create: input.permissionIds.map((permissionId) => ({ permissionId })),
          },
        },
      });
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "CREATE", entity: "Role", entityId: role.id },
      });
      return role;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        permissionIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, permissionIds, ...data } = input;
      const role = await ctx.prisma.role.findUnique({ where: { id } });
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });
      if (role.isSystem && data.name && data.name !== role.name) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No se puede renombrar un rol de sistema" });
      }

      await ctx.prisma.role.update({ where: { id }, data });

      if (permissionIds) {
        await ctx.prisma.rolePermission.deleteMany({ where: { roleId: id } });
        await ctx.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        });
      }

      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "UPDATE", entity: "Role", entityId: id },
      });
      return { success: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const role = await ctx.prisma.role.findUnique({ where: { id: input } });
    if (!role) throw new TRPCError({ code: "NOT_FOUND" });
    if (role.isSystem) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No se puede eliminar un rol de sistema" });
    }
    await ctx.prisma.role.delete({ where: { id: input } });
    await ctx.prisma.auditLog.create({
      data: { userId: ctx.user.id, action: "DELETE", entity: "Role", entityId: input },
    });
    return { success: true };
  }),
});
