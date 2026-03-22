import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando estructura del menú...\n");

  const allItems = await prisma.menuItem.findMany({
    include: { permission: true },
    orderBy: { order: "asc" },
  });

  console.log("📋 Todos los items:\n");
  for (const item of allItems) {
    console.log(`ID: ${item.id}`);
    console.log(`  Label: ${item.labelEs || item.label}`);
    console.log(`  Path: ${item.path || "sin path"}`);
    console.log(`  ParentId: ${item.parentId || "null (es raíz)"}`);
    console.log(`  Order: ${item.order}`);
    console.log(`  Permission: ${item.permission?.key || "ninguno"}`);
    console.log("");
  }

  const rootItems = allItems.filter((item) => !item.parentId);
  console.log(`\n📌 Items raíz: ${rootItems.length}`);
  rootItems.forEach((item) => console.log(`  - ${item.id} (${item.labelEs})`));

  const childItems = allItems.filter((item) => item.parentId);
  console.log(`\n📌 Items hijos: ${childItems.length}`);
  childItems.forEach((item) => console.log(`  - ${item.id} (parent: ${item.parentId})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
