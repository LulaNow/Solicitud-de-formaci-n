import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Creando tablas cdrs y grupos_asignacion...');

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "cdrs" (
          "id" TEXT NOT NULL,
          "nombre" TEXT NOT NULL,
          "valor" TEXT NOT NULL,
          "gerente_talento_cultura" TEXT NOT NULL,
          "gerente_cdr" TEXT NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "cdrs_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('✓ Tabla cdrs creada exitosamente');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "grupos_asignacion" (
          "id" TEXT NOT NULL,
          "nombre" TEXT NOT NULL,
          "usuario" TEXT NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "grupos_asignacion_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('✓ Tabla grupos_asignacion creada exitosamente');
    console.log('\n¡Tablas creadas con éxito!');
  } catch (error) {
    console.error('Error al crear las tablas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
