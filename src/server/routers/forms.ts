import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { encryptJson, decryptJson } from "@/lib/security/encryption";
import { triggerN8nWebhook } from "@/lib/n8n/client";

const fieldTypeEnum = z.enum([
  "TEXT", "NUMBER", "EMAIL", "DATE", "DATETIME",
  "SELECT", "MULTI_SELECT", "CHECKBOX", "RADIO",
  "TEXTAREA", "FILE", "URL", "PHONE",
]);

const fieldSchema = z.object({
  label: z.string().min(1),
  fieldKey: z.string().min(1),
  type: fieldTypeEnum,
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  options: z.any().optional(),
  validation: z.any().optional(),
  defaultValue: z.string().optional(),
  order: z.number().default(0),
  gridColumn: z.number().min(1).max(12).default(12),
});

export const formsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.formDefinition.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: input.status ? { status: input.status } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
          _count: { select: { registries: true, fields: true } },
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
    const form = await ctx.prisma.formDefinition.findUnique({
      where: { id: input },
      include: {
        fields: { orderBy: { order: "asc" } },
        roleAccess: { include: { role: true } },
        createdBy: { select: { name: true } },
      },
    });
    if (!form) throw new TRPCError({ code: "NOT_FOUND" });
    return form;
  }),

  getBySlug: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const form = await ctx.prisma.formDefinition.findUnique({
      where: { slug: input, status: "PUBLISHED" },
      include: {
        fields: { orderBy: { order: "asc" } },
        roleAccess: { include: { role: true } },
      },
    });
    if (!form) throw new TRPCError({ code: "NOT_FOUND", message: "Formulario no encontrado" });

    if (!form.isPublic) {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso no autorizado" });
      }

      const userRoles = await ctx.prisma.userRole.findMany({
        where: { userId: ctx.user.id },
        select: { roleId: true },
      });
      const userRoleIds = userRoles.map(ur => ur.roleId);
      const allowedRoleIds = form.roleAccess.map(ra => ra.roleId);

      const hasAccess = allowedRoleIds.length === 0 || allowedRoleIds.some(roleId => userRoleIds.includes(roleId));

      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permisos para acceder a este formulario" });
      }
    }
    return {
      id: form.id,
      name: form.name,
      slug: form.slug,
      description: form.description,
      version: form.version,
      isPublic: form.isPublic,
      // n8nWebhookUrl: form.n8nWebhookUrl, // ❌ SECURITY: Never expose webhook URLs to frontend
      fields: form.fields.map((f) => ({
        id: f.id,
        label: f.label,
        fieldKey: f.fieldKey,
        type: f.type,
        placeholder: f.placeholder,
        helpText: f.helpText,
        required: f.required,
        options: f.options,
        defaultValue: f.defaultValue,
        order: f.order,
        gridColumn: f.gridColumn,
      })),
    };
  }),

  create: requirePermission("forms.create")
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
        n8nWebhookUrl: z.string().url().optional().or(z.literal("")),
        n8nWorkflowId: z.string().optional(),
        fields: z.array(fieldSchema),
        roleIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { fields, roleIds, n8nWebhookUrl, ...formData } = input;

      const form = await ctx.prisma.formDefinition.create({
        data: {
          ...formData,
          n8nWebhookUrl: n8nWebhookUrl || null,
          createdById: ctx.user.id,
          fields: {
            create: fields.map((f, i) => ({ ...f, order: f.order || i })),
          },
          roleAccess: roleIds
            ? { create: roleIds.map((roleId) => ({ roleId })) }
            : undefined,
        },
      });

      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "CREATE", entity: "FormDefinition", entityId: form.id },
      });

      return form;
    }),

  update: requirePermission("forms.update")
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
        n8nWebhookUrl: z.string().url().optional().or(z.literal("")),
        n8nWorkflowId: z.string().optional(),
        fields: z.array(fieldSchema).optional(),
        roleIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, fields, roleIds, ...data } = input;

      await ctx.prisma.formDefinition.update({
        where: { id },
        data: {
          ...data,
          version: { increment: 1 },
        },
      });

      if (fields) {
        await ctx.prisma.formField.deleteMany({ where: { formId: id } });
        await ctx.prisma.formField.createMany({
          data: fields.map((f, i) => ({ ...f, formId: id, order: f.order || i })),
        });
      }

      if (roleIds) {
        await ctx.prisma.formRoleAccess.deleteMany({ where: { formId: id } });
        await ctx.prisma.formRoleAccess.createMany({
          data: roleIds.map((roleId) => ({ formId: id, roleId })),
        });
      }

      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "UPDATE", entity: "FormDefinition", entityId: id },
      });

      return { success: true };
    }),

  publish: requirePermission("forms.publish")
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.formDefinition.update({
        where: { id: input },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      return { success: true };
    }),

  delete: requirePermission("forms.delete")
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.formDefinition.delete({ where: { id: input } });
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "DELETE", entity: "FormDefinition", entityId: input },
      });
      return { success: true };
    }),

  submit: publicProcedure
    .input(
      z.object({
        formId: z.string(),
        data: z.record(z.unknown()),
        submitterName: z.string().optional(),
        submitterEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const form = await ctx.prisma.formDefinition.findUnique({
        where: { id: input.formId, status: "PUBLISHED" },
      });
      if (!form) throw new TRPCError({ code: "NOT_FOUND" });

      const encryptedData = encryptJson(input.data);

      const registry = await ctx.prisma.requestRegistry.create({
        data: {
          formId: form.id,
          formVersion: form.version,
          submittedData: encryptedData,
          submittedById: ctx.user?.id || null,
          submitterEmail: input.submitterEmail || ctx.user?.email || null,
          submitterName: input.submitterName || ctx.user?.name || null,
        },
      });

      if (form.n8nWebhookUrl) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const result = await triggerN8nWebhook(form.n8nWebhookUrl, {
          registryId: registry.id,
          formId: form.id,
          formVersion: form.version,
          data: input.data,
          submittedBy: {
            id: ctx.user?.id,
            name: input.submitterName || ctx.user?.name,
            email: input.submitterEmail || ctx.user?.email,
          },
          callbackUrl: `${appUrl}/api/webhooks/n8n`,
        });

        if (result.executionId) {
          await ctx.prisma.requestRegistry.update({
            where: { id: registry.id },
            data: { n8nExecutionId: result.executionId },
          });
        }
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user?.id || null,
          action: "SUBMIT",
          entity: "RequestRegistry",
          entityId: registry.id,
        },
      });

      return { id: registry.id, success: true };
    }),
});
