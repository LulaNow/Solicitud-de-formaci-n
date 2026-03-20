import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { generateMfaSecret, verifyMfaToken, MFA_MAX_BYPASS } from "@/lib/security/mfa";
import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";

export const mfaRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { mfaEnabled: true, mfaVerified: true, mfaBypassCount: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    const portalMfaSetting = await ctx.prisma.appSetting.findUnique({
      where: { key: "mfa_portal_enabled" },
    });

    return {
      enabled: user.mfaEnabled,
      verified: user.mfaVerified,
      bypassRemaining: MFA_MAX_BYPASS - user.mfaBypassCount,
      portalMfaRequired: portalMfaSetting?.value === "true",
    };
  }),

  setup: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { username: true, mfaSecret: true, mfaVerified: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    const { secret, uri } = generateMfaSecret(user.username);

    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { mfaSecret: secret, mfaEnabled: true, mfaVerified: false },
    });

    const qrDataUrl = await QRCode.toDataURL(uri);

    return { secret, qrCode: qrDataUrl };
  }),

  verify: protectedProcedure
    .input(z.object({ token: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { mfaSecret: true },
      });
      if (!user?.mfaSecret) throw new TRPCError({ code: "BAD_REQUEST", message: "MFA no configurado" });

      const valid = verifyMfaToken(user.mfaSecret, input.token);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Código inválido" });

      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { mfaVerified: true, mfaBypassCount: 0 },
      });

      return { success: true };
    }),

  disable: protectedProcedure
    .input(z.object({ token: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { mfaSecret: true },
      });
      if (!user?.mfaSecret) throw new TRPCError({ code: "BAD_REQUEST" });

      const valid = verifyMfaToken(user.mfaSecret, input.token);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Código inválido" });

      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { mfaSecret: null, mfaEnabled: false, mfaVerified: false, mfaBypassCount: 0 },
      });

      return { success: true };
    }),

  adminResetBypass: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { mfaBypassCount: 0 },
      });
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "MFA_RESET_BYPASS", entity: "User", entityId: input.userId },
      });
      return { success: true };
    }),

  adminForceEnable: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { mfaEnabled: true },
      });
      return { success: true };
    }),

  adminDisable: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { mfaSecret: null, mfaEnabled: false, mfaVerified: false, mfaBypassCount: 0 },
      });
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.user.id, action: "MFA_ADMIN_DISABLE", entity: "User", entityId: input.userId },
      });
      return { success: true };
    }),

  portalSettings: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.appSetting.findMany({
      where: { key: { startsWith: "mfa_" } },
    });
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }),

  updatePortalSetting: adminProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.appSetting.upsert({
        where: { key: input.key },
        create: { key: input.key, value: input.value, type: "boolean" },
        update: { value: input.value },
      });
      return { success: true };
    }),
});
