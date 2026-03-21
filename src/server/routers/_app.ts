import { router } from "../trpc";
import { usersRouter } from "./users";
import { rolesRouter } from "./roles";
import { permissionsRouter } from "./permissions";
import { formsRouter } from "./forms";
import { requestsRouter } from "./requests";
import { menusRouter } from "./menus";
import { tasksRouter } from "./tasks";
import { mfaRouter } from "./mfa";
import { appearanceRouter } from "./appearance";
import { servicePortalRouter } from "./servicePortal";

export const appRouter = router({
  users: usersRouter,
  roles: rolesRouter,
  permissions: permissionsRouter,
  forms: formsRouter,
  requests: requestsRouter,
  menus: menusRouter,
  tasks: tasksRouter,
  mfa: mfaRouter,
  appearance: appearanceRouter,
  servicePortal: servicePortalRouter,
});

export type AppRouter = typeof appRouter;
