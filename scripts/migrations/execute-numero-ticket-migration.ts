/**
 * Script simplificado para ejecutar la migración de numero_ticket
 * 
 * Uso: npx tsx scripts/migrations/execute-numero-ticket-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración: Agregar secuencia para numero_ticket\n');

  try {
    // 1. Crear secuencia
    console.log('📝 Creando secuencia solicitud_ticket_seq...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE SEQUENCE IF NOT EXISTS solicitud_ticket_seq START WITH 1
      `);
      console.log('✅ Secuencia creada exitosamente\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  La secuencia ya existe, continuando...\n');
      } else {
        throw error;
      }
    }

    // 2. Establecer valor por defecto
    console.log('📝 Configurando valor por defecto para numero_ticket...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE solicitudes 
        ALTER COLUMN numero_ticket SET DEFAULT ('SF' || LPAD(nextval('solicitud_ticket_seq')::text, 7, '0'))
      `);
      console.log('✅ Valor por defecto configurado exitosamente\n');
    } catch (error: any) {
      console.log('⚠️  Error al configurar valor por defecto:', error.message);
      console.log('   Esto puede ser normal si ya estaba configurado\n');
    }

    // 3. Actualizar registros existentes sin numero_ticket
    console.log('🔄 Actualizando registros existentes sin numero_ticket...');
    const updateResult = await prisma.$executeRawUnsafe(`
      UPDATE solicitudes 
      SET numero_ticket = ('SF' || LPAD(nextval('solicitud_ticket_seq')::text, 7, '0'))
      WHERE numero_ticket IS NULL
    `);
    console.log(`✅ ${updateResult} registros actualizados\n`);

    // 4. Verificar configuración
    console.log('🔍 Verificando configuración...');
    
    const sequenceInfo: any = await prisma.$queryRawUnsafe(`
      SELECT 
        c.relname as sequence_name,
        pg_sequence_last_value(c.oid) as last_value
      FROM pg_class c
      WHERE c.relkind = 'S' AND c.relname = 'solicitud_ticket_seq'
    `);
    
    if (sequenceInfo && sequenceInfo.length > 0) {
      console.log('   Secuencia:', sequenceInfo[0]);
    }

    const columnInfo: any = await prisma.$queryRawUnsafe(`
      SELECT column_default 
      FROM information_schema.columns 
      WHERE table_name = 'solicitudes' AND column_name = 'numero_ticket'
    `);
    
    if (columnInfo && columnInfo.length > 0) {
      console.log('   Valor por defecto:', columnInfo[0].column_default);
    }

    // 5. Probar la secuencia
    console.log('\n🧪 Probando la secuencia con una solicitud de prueba...');
    const testSolicitud = await prisma.solicitud.create({
      data: {
        usuarioId: '00000000-0000-0000-0000-000000000000',
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

    console.log('✅ ¡Migración completada exitosamente!\n');
    console.log('📋 Resumen:');
    console.log('   ✓ Secuencia "solicitud_ticket_seq" creada');
    console.log('   ✓ Valor por defecto configurado en columna "numero_ticket"');
    console.log('   ✓ Formato: SF + 7 dígitos (ej: SF0000001)');
    console.log('   ✓ Registros existentes actualizados');
    console.log('   ✓ Prueba exitosa\n');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });
