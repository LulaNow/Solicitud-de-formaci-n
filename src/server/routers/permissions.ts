import { router, adminProcedure } from "../trpc";

export const permissionsRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });
  }),
});
