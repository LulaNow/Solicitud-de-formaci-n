// Script para ver los datos actuales de la tabla puestos_tipo_beca
const { PrismaClient } = require('@prisma/client');

async function checkTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log("🔍 Consultando tabla puestos_tipo_beca...\n");
    
    const registros = await prisma.$queryRaw`
      SELECT * FROM puestos_tipo_beca ORDER BY puesto;
    `;
    
    console.log("📋 Datos actuales:");
    console.table(registros);
    
    console.log(`\n✅ Total de registros: ${registros.length}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTable();
