import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/security/hash";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Probando creación de usuario...\n");

  // Obtener roles disponibles
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  console.log("📋 Roles disponibles:");
  roles.forEach((r) => console.log(`  - ${r.name} (${r.id})`));
  console.log("");

  if (roles.length === 0) {
    console.error("❌ No hay roles disponibles");
    return;
  }

  // Intentar crear un usuario de prueba
  const testUser = {
    username: "test_user_" + Date.now(),
    email: `test${Date.now()}@nadro.mx`,
    name: "Usuario de Prueba",
    password: "test1234",
  };

  console.log("👤 Creando usuario de prueba:");
  console.log(`  Username: ${testUser.username}`);
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Rol: ${roles[0].name}`);
  console.log("");

  try {
    const passwordHash = await hashPassword(testUser.password);
    
    const user = await prisma.user.create({
      data: {
        username: testUser.username,
        email: testUser.email,
        passwordHash,
        name: testUser.name,
        userRoles: {
          create: [{ roleId: roles[0].id }],
        },
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    console.log("✅ Usuario creado exitosamente:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Roles: ${user.userRoles.map((ur) => ur.role.name).join(", ")}`);

    // Limpiar - eliminar el usuario de prueba
    await prisma.user.delete({ where: { id: user.id } });
    console.log("\n🧹 Usuario de prueba eliminado");
  } catch (error) {
    console.error("❌ Error al crear usuario:");
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
