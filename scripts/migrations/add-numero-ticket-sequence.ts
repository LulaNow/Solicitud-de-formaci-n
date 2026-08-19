/**
 * Script de migración: Agregar secuencia para numero_ticket
 *
 * Este script ejecuta la migración SQL que crea una secuencia
 * para generar números de ticket automáticos con formato SF0000001
 *
 * Uso: npx tsx scripts/migrations/add-numero-ticket-sequence.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración: Agregar secuencia para numero_ticket\n');

  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'add-numero-ticket-sequence.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    // Dividir en comandos individuales (separados por punto y coma)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📄 Ejecutando ${commands.length} comandos SQL...\n`);

    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Saltar comentarios y líneas vacías
      if (command.startsWith('--') || command.length === 0) {
        continue;
      }

      console.log(`[${i + 1}/${commands.length}] Ejecutando comando...`);

      try {
        const result = await prisma.$executeRawUnsafe(command);
        console.log(`✅ Comando ejecutado exitosamente\n`);
      } catch (error: any) {
        // Si el error es porque ya existe, lo ignoramos
        if (error.message.includes('already exists')) {
          console.log(`⚠️  El objeto ya existe, continuando...\n`);
        } else {
          throw error;
        }
      }
    }

    // Verificar la secuencia
    console.log('🔍 Verificando secuencia creada...');
    const sequences = await prisma.$queryRaw`
      SELECT sequence_name, start_value, increment, last_value
      FROM information_schema.sequences
      WHERE sequence_name = 'solicitud_ticket_seq'
    `;
    console.log('Secuencia:', sequences);

    // Verificar el valor por defecto
    console.log('\n🔍 Verificando valor por defecto de numero_ticket...');
    const columnInfo = await prisma.$queryRaw`
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      AND column_name = 'numero_ticket'
    `;
    console.log('Columna:', columnInfo);

    // Actualizar registros existentes sin numero_ticket
    console.log('\n🔄 Actualizando registros existentes sin numero_ticket...');
    const updateResult = await prisma.$executeRaw`
      UPDATE solicitudes
      SET numero_ticket = DEFAULT
      WHERE numero_ticket IS NULL
    `;
    console.log(`✅ ${updateResult} registros actualizados\n`);

    // Probar la secuencia creando una solicitud de prueba
    console.log('🧪 Probando la secuencia...');
    const testSolicitud = await prisma.solicitud.create({
      data: {
        usuarioId: '00000000-0000-0000-0000-000000000000', // Usuario de prueba
        tipoProceso: 'TEST - Verificación de secuencia',
        estado: 'abierto',
        datosEntrada: {
          test: true,
          descripcion: 'Solicitud de prueba para verificar numero_ticket automático'
        }
      }
    });

    console.log('✅ Solicitud de prueba creada:');
    console.log(`   ID: ${testSolicitud.id}`);
    console.log(`   Número de Ticket: ${testSolicitud.numeroTicket}`);
    console.log(`   Formato esperado: SF0000XXX\n`);

    // Eliminar la solicitud de prueba
    await prisma.solicitud.delete({
      where: { id: testSolicitud.id }
    });
    console.log('🗑️  Solicitud de prueba eliminada\n');

    console.log('✅ Migración completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('   - Secuencia "solicitud_ticket_seq" creada');
    console.log('   - Valor por defecto configurado en columna "numero_ticket"');
    console.log('   - Formato: SF + 7 dígitos (ej: SF0000001)');
    console.log('   - Registros existentes actualizados');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
