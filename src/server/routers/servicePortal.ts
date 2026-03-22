import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const servicePortalRouter = router({
  // Get portal configuration (enabled/disabled)
  getPortalConfig: publicProcedure.query(async ({ ctx }) => {
    const enabled = await ctx.prisma.appSetting.findUnique({
      where: { key: "service_portal_enabled" },
    });

    const maintenanceMessage = await ctx.prisma.appSetting.findUnique({
      where: { key: "service_portal_maintenance_message" },
    });

    return {
      enabled: enabled?.value === "true",
      maintenanceMessage: maintenanceMessage?.value || null,
    };
  }),

  // Update portal configuration (admin only)
  updatePortalConfig: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        maintenanceMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update enabled status
      await ctx.prisma.appSetting.upsert({
        where: { key: "service_portal_enabled" },
        create: {
          key: "service_portal_enabled",
          value: input.enabled.toString(),
          type: "boolean",
        },
        update: {
          value: input.enabled.toString(),
        },
      });

      // Update maintenance message if provided
      if (input.maintenanceMessage !== undefined) {
        await ctx.prisma.appSetting.upsert({
          where: { key: "service_portal_maintenance_message" },
          create: {
            key: "service_portal_maintenance_message",
            value: input.maintenanceMessage,
            type: "string",
          },
          update: {
            value: input.maintenanceMessage,
          },
        });
      }

      return { success: true };
    }),

  // Get all categories
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return categories;
  }),

  // Get items (with optional filtering)
  getItems: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.serviceItem.findMany({
        where: {
          isPublished: true,
          ...(input.categoryId && { categoryId: input.categoryId }),
          ...(input.search && {
            OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { shortDescription: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
              { tags: { has: input.search } },
            ],
          }),
        },
        take: input.limit,
        orderBy: [{ order: "asc" }, { requestCount: "desc" }],
        include: {
          category: {
            select: {
              name: true,
              icon: true,
              color: true,
            },
          },
        },
      });

      return items;
    }),

  // Get item by slug
  getItemBySlug: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.serviceItem.findUnique({
        where: { slug: input },
        include: {
          category: true,
          form: {
            include: {
              fields: { orderBy: { order: "asc" } },
            },
          },
        },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item no encontrado" });
      }

      if (!item.isPublished || !item.isAvailable) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Item no disponible" });
      }

      // Increment view count
      await ctx.prisma.serviceItem.update({
        where: { id: item.id },
        data: { viewCount: { increment: 1 } },
      });

      return item;
    }),

  // Create service request
  createRequest: publicProcedure
    .input(
      z.object({
        itemId: z.string(),
        formData: z.record(z.any()),
        requesterName: z.string().optional(),
        requesterEmail: z.string().email().optional(),
        requesterPhone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.serviceItem.findUnique({
        where: { id: input.itemId },
      });

      if (!item || !item.isPublished || !item.isAvailable) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Item no disponible" });
      }

      const request = await ctx.prisma.serviceRequest.create({
        data: {
          itemId: input.itemId,
          userId: ctx.user?.id,
          requesterName: input.requesterName,
          requesterEmail: input.requesterEmail,
          requesterPhone: input.requesterPhone,
          formData: input.formData,
          status: "PENDING",
          priority: "MEDIUM",
        },
      });

      // Increment request count
      await ctx.prisma.serviceItem.update({
        where: { id: input.itemId },
        data: { requestCount: { increment: 1 } },
      });

      return request;
    }),

  // Get my requests (authenticated users)
  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    const requests = await ctx.prisma.serviceRequest.findMany({
      where: { userId: ctx.user.id },
      orderBy: { submittedAt: "desc" },
      include: {
        item: {
          select: {
            name: true,
            icon: true,
            category: {
              select: { name: true },
            },
          },
        },
      },
    });

    return requests;
  }),

  // Admin: Get all categories (including inactive)
  adminGetCategories: protectedProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.serviceCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return categories;
  }),

  // Admin: Create category
  adminCreateCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        order: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.serviceCategory.create({
        data: input,
      });

      return category;
    }),

  // Admin: Update category
  adminUpdateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const category = await ctx.prisma.serviceCategory.update({
        where: { id },
        data,
      });

      return category;
    }),

  // Admin: Get all items
  adminGetItems: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.prisma.serviceItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        form: {
          select: { name: true },
        },
        _count: {
          select: { requests: true },
        },
      },
    });

    return items;
  }),

  // Admin: Create item
  adminCreateItem: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        shortDescription: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
        image: z.string().optional(),
        categoryId: z.string(),
        formId: z.string().optional(),
        price: z.number().optional(),
        estimatedTime: z.string().optional(),
        requiresApproval: z.boolean().default(false),
        tags: z.array(z.string()).default([]),
        order: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.serviceItem.create({
        data: input,
      });

      return item;
    }),

  // Admin: Update item
  adminUpdateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        shortDescription: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        image: z.string().optional(),
        categoryId: z.string().optional(),
        formId: z.string().optional(),
        price: z.number().optional(),
        estimatedTime: z.string().optional(),
        isAvailable: z.boolean().optional(),
        requiresApproval: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
        order: z.number().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const updateData: any = { ...data };
      if (input.isPublished === true) {
        updateData.publishedAt = new Date();
      }

      const item = await ctx.prisma.serviceItem.update({
        where: { id },
        data: updateData,
      });

      return item;
    }),

  // Admin: Get all requests
  adminGetRequests: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "REVIEWING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const requests = await ctx.prisma.serviceRequest.findMany({
        where: input.status ? { status: input.status } : undefined,
        take: input.limit,
        orderBy: { submittedAt: "desc" },
        include: {
          item: {
            select: {
              name: true,
              icon: true,
              category: { select: { name: true } },
            },
          },
          user: {
            select: { name: true, email: true },
          },
          assignedTo: {
            select: { name: true },
          },
        },
      });

      return requests;
    }),

  // Admin: Update request status
  adminUpdateRequest: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "REVIEWING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        assignedToId: z.string().optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const updateData: any = { ...data };

      if (input.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }

      if (input.status && ["REVIEWING", "APPROVED", "REJECTED"].includes(input.status)) {
        updateData.reviewedAt = new Date();
      }

      const request = await ctx.prisma.serviceRequest.update({
        where: { id },
        data: updateData,
      });

      return request;
    }),
});
