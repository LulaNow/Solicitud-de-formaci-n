import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando menú en la base de datos...\n");

  const menuItems = await prisma.menuItem.findMany({
    include: { permission: true, children: true },
    orderBy: { order: "asc" },
  });

  console.log(`📋 Total de items de menú: ${menuItems.length}\n`);

  for (const item of menuItems) {
    const indent = item.parentId ? "  └─ " : "📌 ";
    console.log(`${indent}${item.labelEs || item.label} (${item.path || "sin path"})`);
    console.log(`     ID: ${item.id}`);
    console.log(`     Permiso: ${item.permission?.key || "ninguno"}`);
    console.log(`     Activo: ${item.isActive}`);
    console.log("");
  }

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

  if (admin) {
    console.log("👤 Usuario admin:");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Roles: ${admin.userRoles.map((ur) => ur.role.name).join(", ")}`);
    console.log(`   Permisos: ${admin.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.key)).length}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
