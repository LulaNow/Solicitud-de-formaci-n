import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { decryptJson } from "@/lib/security/encryption";

export const requestsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
        formId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.requestRegistry.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          ...(input.status ? { status: input.status } : {}),
          ...(input.formId ? { formId: input.formId } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          form: { select: { name: true, slug: true } },
          submittedBy: { select: { name: true, email: true } },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: items.map((item) => ({
          ...item,
          submittedData: undefined,
        })),
        nextCursor,
      };
    }),

  getById: requirePermission("requests.read")
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const request = await ctx.prisma.requestRegistry.findUnique({
        where: { id: input },
        include: {
          form: { include: { fields: { orderBy: { order: "asc" } } } },
          submittedBy: { select: { name: true, email: true } },
        },
      });
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      let decryptedData: Record<string, unknown> = {};
      try {
        decryptedData = decryptJson(request.submittedData);
      } catch {
        decryptedData = { error: "No se pudo descifrar los datos" };
      }

      return {
        ...request,
        submittedData: decryptedData,
      };
    }),

  updateStatus: requirePermission("requests.manage")
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "CANCELLED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.requestRegistry.update({
        where: { id: input.id },
        data: {
          status: input.status,
          processedAt: ["APPROVED", "REJECTED", "CANCELLED"].includes(input.status) ? new Date() : null,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "UPDATE_STATUS",
          entity: "RequestRegistry",
          entityId: input.id,
          changes: { status: input.status },
        },
      });

      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const [total, pending, inProgress, approved, rejected] = await Promise.all([
      ctx.prisma.requestRegistry.count(),
      ctx.prisma.requestRegistry.count({ where: { status: "PENDING" } }),
      ctx.prisma.requestRegistry.count({ where: { status: "IN_PROGRESS" } }),
      ctx.prisma.requestRegistry.count({ where: { status: "APPROVED" } }),
      ctx.prisma.requestRegistry.count({ where: { status: "REJECTED" } }),
    ]);
    return { total, pending, inProgress, approved, rejected };
  }),
});
