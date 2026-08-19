import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL no está definida en el archivo .env');
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'add-tipo-tarea-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Ejecutando migración...\n');

    // Ejecutar el SQL
    const result = await client.query(sql);

    console.log('✓ Migración completada exitosamente\n');

    // Mostrar resultados de la clasificación
    const verificacion = await client.query(`
      SELECT 
        tipo_tarea,
        COUNT(*) as cantidad
      FROM tareas_flujo
      GROUP BY tipo_tarea
      ORDER BY tipo_tarea;
    `);

    console.log('Clasificación de tareas:');
    console.log('='.repeat(50));
    verificacion.rows.forEach(row => {
      console.log(`${row.tipo_tarea}: ${row.cantidad} tarea(s)`);
    });

    // Mostrar algunos ejemplos
    console.log('\nEjemplos de clasificación:');
    console.log('='.repeat(50));
    const ejemplos = await client.query(`
      SELECT nombre_tarea, tipo_tarea
      FROM tareas_flujo
      ORDER BY tipo_tarea, nombre_tarea
      LIMIT 10;
    `);

    ejemplos.rows.forEach(row => {
      console.log(`[${row.tipo_tarea}] ${row.nombre_tarea}`);
    });

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✓ Conexión cerrada');
  }
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  });
