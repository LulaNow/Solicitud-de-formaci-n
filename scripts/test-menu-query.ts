import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Simulando query menus.getForUser para admin...\n");

  // Simular el contexto del usuario admin
  const admin = await prisma.user.findUnique({
    where: { username: "admin" },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!admin) {
    console.error("❌ Usuario admin no encontrado");
    return;
  }

  const roles = admin.userRoles.map((ur) => ur.role.name);
  const permissions = admin.userRoles.flatMap((ur) =>
    ur.role.rolePermissions.map((rp) => rp.permission.key)
  );

  console.log("👤 Usuario:", admin.username);
  console.log("📋 Roles:", roles);
  console.log("🔑 Permisos:", permissions.length);
  console.log("");

  // Simular la lógica de menus.getForUser
  const isAdmin = roles.includes("Administrador");

  const allItems = await prisma.menuItem.findMany({
    where: { isActive: true },
    include: { permission: true },
    orderBy: { order: "asc" },
  });

  const userPermissions = new Set(permissions);
  const filtered = allItems.filter(
    (item) =>
      isAdmin ||
      !item.permissionId ||
      userPermissions.has(item.permission?.key || "")
  );

  console.log(`📊 Items totales: ${allItems.length}`);
  console.log(`📊 Items filtrados: ${filtered.length}`);
  console.log("");

  const rootItems = filtered.filter((item) => !item.parentId);
  const childMap = new Map<string, typeof filtered>();
  for (const item of filtered) {
    if (item.parentId) {
      const children = childMap.get(item.parentId) || [];
      children.push(item);
      childMap.set(item.parentId, children);
    }
  }

  const result = rootItems.map((item) => ({
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

  console.log("📋 Resultado final (lo que devuelve getForUser):\n");
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
