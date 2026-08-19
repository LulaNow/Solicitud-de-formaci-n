import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '');
  
  console.log('Conectando a la base de datos...');
  
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos');

    console.log('\nCreando tabla cdrs...');
    await client.query(`
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

    console.log('\nCreando tabla grupos_asignacion...');
    await client.query(`
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
    await client.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
