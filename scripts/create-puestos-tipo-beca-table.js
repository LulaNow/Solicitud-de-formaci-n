// Script para crear la tabla puestos_tipo_beca
const { PrismaClient } = require('@prisma/client');

async function createTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log("🔧 Creando tabla puestos_tipo_beca...\n");
    
    // Crear la tabla
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS puestos_tipo_beca (
        id VARCHAR(255) PRIMARY KEY,
        puesto VARCHAR(255) NOT NULL,
        tipo_beca VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log("✅ Tabla puestos_tipo_beca creada exitosamente\n");
    
    // Crear índice
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_puestos_tipo_beca_puesto 
      ON puestos_tipo_beca(puesto);
    `;
    
    console.log("✅ Índice creado exitosamente\n");
    
    // Verificar que la tabla existe
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'puestos_tipo_beca'
      ORDER BY ordinal_position;
    `;
    
    console.log("📋 Estructura de la tabla:");
    console.table(result);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTable();
