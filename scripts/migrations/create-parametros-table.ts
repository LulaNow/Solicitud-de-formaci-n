/**
 * Script para crear la tabla parametros
 * 
 * Uso: npx tsx scripts/migrations/create-parametros-table.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creando tabla parametros...\n');

  try {
    // Crear tabla parametros
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS parametros (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero_ticket VARCHAR(20) NOT NULL,
        json_parametros JSONB NOT NULL,
        porcentaje_asignado DECIMAL(5, 2) NOT NULL,
        monto_beca DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Tabla parametros creada exitosamente\n');

    // Crear índice en numero_ticket
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_parametros_numero_ticket 
      ON parametros(numero_ticket)
    `);
    console.log('✅ Índice en numero_ticket creado\n');

    // Verificar la tabla
    console.log('🔍 Verificando tabla creada...');
    const tableInfo: any = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'parametros'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Estructura de la tabla parametros:');
    console.table(tableInfo);

    console.log('\n✅ ¡Tabla parametros creada exitosamente!\n');
    console.log('📋 Resumen:');
    console.log('   ✓ Tabla: parametros');
    console.log('   ✓ Columnas: id, numero_ticket, json_parametros, porcentaje_asignado, monto_beca, created_at, updated_at');
    console.log('   ✓ Índice en numero_ticket creado');

  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  La tabla parametros ya existe\n');
    } else {
      console.error('❌ Error al crear la tabla:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });
