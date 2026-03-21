import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function enablePortal() {
  console.log("🚀 Habilitando el Portal de Servicios...");

  try {
    // Habilitar el portal
    await prisma.appSetting.upsert({
      where: { key: "service_portal_enabled" },
      create: {
        key: "service_portal_enabled",
        value: "true",
        type: "boolean",
      },
      update: {
        value: "true",
      },
    });

    console.log("✅ Portal habilitado correctamente");
    console.log("🌐 Accede a: http://localhost:3000/portal");
    console.log("");
    console.log("📝 Nota: Si no ves servicios, es porque no hay categorías/items en la BD.");
    console.log("   Los formularios públicos aparecerán automáticamente si están publicados.");
  } catch (error) {
    console.error("❌ Error al habilitar el portal:", error);
    process.exit(1);
  }
}

enablePortal()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
