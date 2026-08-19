import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '');
  
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('Verificando las tablas creadas...\n');

    const result = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('cdrs', 'grupos_asignacion')
      ORDER BY table_name, ordinal_position;
    `);

    console.log('Estructura de las tablas:\n');
    
    let currentTable = '';
    for (const row of result.rows) {
      if (currentTable !== row.table_name) {
        currentTable = row.table_name;
        console.log(`\n📋 Tabla: ${row.table_name}`);
        console.log('─'.repeat(60));
      }
      console.log(`  • ${row.column_name.padEnd(30)} ${row.data_type.padEnd(15)} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    }

    console.log('\n✓ Verificación completada');
  } catch (error) {
    console.error('Error al verificar las tablas:', error);
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
