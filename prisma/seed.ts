import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const PEPPER = process.env.ENCRYPTION_PEPPER || "";

async function hashPw(password: string): Promise<string> {
  return argon2.hash(password + PEPPER, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main() {
  console.log("🌱 Seeding database...");

  // --- Permissions ---
  const permissionDefs = [
    { name: "Ver Dashboard", key: "dashboard.view", module: "dashboard", action: "read" },
    { name: "Gestionar Usuarios", key: "users.manage", module: "users", action: "manage" },
    { name: "Ver Usuarios", key: "users.read", module: "users", action: "read" },
    { name: "Gestionar Roles", key: "roles.manage", module: "roles", action: "manage" },
    { name: "Ver Roles", key: "roles.read", module: "roles", action: "read" },
    { name: "Gestionar Permisos", key: "permissions.manage", module: "permissions", action: "manage" },
    { name: "Gestionar Menú", key: "menus.manage", module: "menus", action: "manage" },
    { name: "Crear Formularios", key: "forms.create", module: "forms", action: "create" },
    { name: "Ver Formularios", key: "forms.read", module: "forms", action: "read" },
    { name: "Editar Formularios", key: "forms.update", module: "forms", action: "update" },
    { name: "Eliminar Formularios", key: "forms.delete", module: "forms", action: "delete" },
    { name: "Publicar Formularios", key: "forms.publish", module: "forms", action: "publish" },
    { name: "Ver Peticiones", key: "requests.read", module: "requests", action: "read" },
    { name: "Gestionar Peticiones", key: "requests.manage", module: "requests", action: "manage" },
    { name: "Acceso Admin", key: "admin.access", module: "admin", action: "access" },
    { name: "Ver Configuración", key: "settings.read", module: "settings", action: "read" },
    { name: "Gestionar Configuración", key: "settings.manage", module: "settings", action: "manage" },
  ];

  const permissions: Record<string, string> = {};
  for (const pDef of permissionDefs) {
    const p = await prisma.permission.upsert({
      where: { key: pDef.key },
      update: pDef,
      create: pDef,
    });
    permissions[p.key] = p.id;
  }
  console.log(`  ✅ ${permissionDefs.length} permisos creados`);

  // --- Roles ---
  const adminRole = await prisma.role.upsert({
    where: { name: "Administrador" },
    update: {},
    create: { name: "Administrador", description: "Acceso total al sistema", isSystem: true },
  });

  const internalRole = await prisma.role.upsert({
    where: { name: "Usuario Interno" },
    update: {},
    create: { name: "Usuario Interno", description: "Usuario interno de la organización", isSystem: true },
  });

  const externalRole = await prisma.role.upsert({
    where: { name: "Usuario Externo" },
    update: {},
    create: { name: "Usuario Externo", description: "Usuario externo (proveedor, cliente)", isSystem: true },
  });
  console.log("  ✅ 3 roles creados");

  // --- Assign all permissions to admin ---
  for (const permId of Object.values(permissions)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permId },
    });
  }

  // --- Assign limited permissions to internal ---
  const internalPerms = [
    "dashboard.view", "forms.read", "requests.read", "requests.manage",
  ];
  for (const key of internalPerms) {
    if (permissions[key]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: internalRole.id, permissionId: permissions[key] } },
        update: {},
        create: { roleId: internalRole.id, permissionId: permissions[key] },
      });
    }
  }

  // --- Assign limited permissions to external ---
  const externalPerms = ["dashboard.view", "forms.read", "requests.read"];
  for (const key of externalPerms) {
    if (permissions[key]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: externalRole.id, permissionId: permissions[key] } },
        update: {},
        create: { roleId: externalRole.id, permissionId: permissions[key] },
      });
    }
  }
  console.log("  ✅ Permisos asignados a roles");

  // --- Admin User ---
  const adminPwHash = await hashPw("admin");
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash: adminPwHash },
    create: {
      username: "admin",
      email: "admin@nadro.mx",
      passwordHash: adminPwHash,
      name: "Administrador",
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });
  console.log("  ✅ Usuario admin/admin creado");

  // --- Menu Items ---
  const menuItems = [
    { label: "Dashboard", labelEs: "Panel", icon: "LayoutDashboard", path: "/dashboard", order: 1, permKey: "dashboard.view" },
    { label: "Forms", labelEs: "Formularios", icon: "FileText", path: "/forms", order: 2, permKey: "forms.read" },
    { label: "Requests", labelEs: "Peticiones", icon: "Inbox", path: "/requests", order: 3, permKey: "requests.read" },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.label.toLowerCase() },
      update: { label: item.label, labelEs: item.labelEs, icon: item.icon, path: item.path, order: item.order, permissionId: permissions[item.permKey] || null },
      create: { id: item.label.toLowerCase(), label: item.label, labelEs: item.labelEs, icon: item.icon, path: item.path, order: item.order, permissionId: permissions[item.permKey] || null },
    });
  }

  // Admin parent menu
  const adminMenu = await prisma.menuItem.upsert({
    where: { id: "admin" },
    update: { label: "Administration", labelEs: "Administración", icon: "Shield", order: 10, permissionId: permissions["admin.access"] },
    create: { id: "admin", label: "Administration", labelEs: "Administración", icon: "Shield", order: 10, permissionId: permissions["admin.access"] },
  });

  const adminSubMenus = [
    { id: "admin-users", label: "Users", labelEs: "Usuarios", icon: "Users", path: "/admin/users", order: 1, permKey: "users.manage" },
    { id: "admin-roles", label: "Roles", labelEs: "Roles", icon: "UserCog", path: "/admin/roles", order: 2, permKey: "roles.manage" },
    { id: "admin-permissions", label: "Permissions", labelEs: "Permisos", icon: "Key", path: "/admin/permissions", order: 3, permKey: "permissions.manage" },
    { id: "admin-menus", label: "Menu", labelEs: "Menú", icon: "Menu", path: "/admin/menus", order: 4, permKey: "menus.manage" },
  ];

  for (const sub of adminSubMenus) {
    await prisma.menuItem.upsert({
      where: { id: sub.id },
      update: { label: sub.label, labelEs: sub.labelEs, icon: sub.icon, path: sub.path, order: sub.order, parentId: adminMenu.id, permissionId: permissions[sub.permKey] || null },
      create: { id: sub.id, label: sub.label, labelEs: sub.labelEs, icon: sub.icon, path: sub.path, order: sub.order, parentId: adminMenu.id, permissionId: permissions[sub.permKey] || null },
    });
  }
  console.log("  ✅ Menú dinámico creado");

  // --- App Settings ---
  const settings = [
    { key: "app.name", value: "NADRO Portal", type: "string" },
    { key: "app.locale", value: "es", type: "string" },
    { key: "app.registration.enabled", value: "true", type: "boolean" },
    { key: "app.registration.defaultRole", value: externalRole.id, type: "string" },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, type: s.type },
      create: s,
    });
  }
  console.log("  ✅ Configuración de app creada");

  console.log("🎉 Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
