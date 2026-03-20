import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";

export const appearanceRouter = router({
  // Public — used by login page (no auth required)
  getSceneConfig: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.appSetting.findMany({
      where: { key: { startsWith: "appearance." } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    const eventKeys = [
      "event_reyes",
      "event_valentine",
      "event_patrias",
      "event_halloween",
      "event_muertos",
      "event_christmas",
    ];
    const calendarEvents: Record<string, boolean> = {};
    for (const ek of eventKeys) {
      calendarEvents[ek] = map[`appearance.${ek}`] === "true";
    }

    return {
      sceneMode: map["appearance.scene_mode"] || "random",
      christmasEnabled: map["appearance.christmas_enabled"] === "true",
      snowEnabled: map["appearance.snow_enabled"] === "true",
      calendarAuto: map["appearance.calendar_auto"] === "true",
      calendarEvents,
    };
  }),

  // Admin — get all appearance settings
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.appSetting.findMany({
      where: { key: { startsWith: "appearance." } },
    });
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }),

  // Admin — update a single appearance setting
  updateSetting: adminProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!input.key.startsWith("appearance.")) {
        throw new Error(
          "Solo se pueden modificar configuraciones de apariencia",
        );
      }
      await ctx.prisma.appSetting.upsert({
        where: { key: input.key },
        create: { key: input.key, value: input.value, type: "string" },
        update: { value: input.value },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "UPDATE",
          entity: "AppSetting",
          entityId: input.key,
          changes: { key: input.key, value: input.value },
        },
      });
      return { success: true };
    }),
});
