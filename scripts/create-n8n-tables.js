const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createN8nTables() {
  try {
    console.log('📋 Creando tablas para integración con n8n...');

    // Crear tabla solicitudes
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS solicitudes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero_ticket VARCHAR(20) UNIQUE,
        usuario_id UUID NOT NULL,
        tipo_proceso VARCHAR(50),
        estado VARCHAR(20) DEFAULT 'abierto',
        datos_entrada JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Crear tabla tareas_flujo
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS tareas_flujo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        solicitud_id UUID REFERENCES solicitudes(id) ON DELETE CASCADE,
        nombre_tarea VARCHAR(100),
        asignado_a_rol VARCHAR(50),
        estado_tarea VARCHAR(20) DEFAULT 'pendiente',
        resultado_json JSONB,
        webhook_resume_url TEXT,
        vencimiento_sla TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Crear tabla historial_pasos
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS historial_pasos (
        id SERIAL PRIMARY KEY,
        solicitud_id UUID REFERENCES solicitudes(id),
        paso_nombre TEXT,
        detalles TEXT,
        fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Crear índices
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario_id ON solicitudes(usuario_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo_proceso ON solicitudes(tipo_proceso)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_tareas_flujo_solicitud_id ON tareas_flujo(solicitud_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_tareas_flujo_estado_tarea ON tareas_flujo(estado_tarea)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_historial_pasos_solicitud_id ON historial_pasos(solicitud_id)`);

    console.log('✅ Tablas creadas exitosamente:');
    console.log('   - solicitudes');
    console.log('   - tareas_flujo');
    console.log('   - historial_pasos');
    console.log('');
    console.log('📊 Estructura creada:');
    console.log('   • Solicitudes: Gestión principal de tickets');
    console.log('   • Tareas Flujo: Tareas individuales del workflow');
    console.log('   • Historial Pasos: Auditoría de todos los pasos');
    console.log('');
    console.log('🔗 Relaciones configuradas:');
    console.log('   • tareas_flujo → solicitudes (CASCADE)');
    console.log('   • historial_pasos → solicitudes');
    console.log('');
    console.log('📈 Índices creados para optimización de consultas');

  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createN8nTables()
  .then(() => {
    console.log('');
    console.log('🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
