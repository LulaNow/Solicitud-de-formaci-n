// Script para verificar la estructura de la tabla ceco
const { PrismaClient } = require('@prisma/client');

async function checkCecoTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log("🔍 Verificando tabla ceco...\n");
    
    // Consultar la estructura de la tabla
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'ceco'
      ORDER BY ordinal_position;
    `;
    
    console.log("📋 Estructura de la tabla 'ceco':");
    console.table(result);
    
    // Consultar algunos registros de ejemplo
    const cecos = await prisma.$queryRaw`
      SELECT * FROM ceco LIMIT 5;
    `;
    
    console.log("\n📊 Registros de ejemplo:");
    console.table(cecos);
    
    console.log(`\n✅ Total de registros: ${cecos.length > 0 ? 'Tabla poblada' : 'Tabla vacía'}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCecoTable();
