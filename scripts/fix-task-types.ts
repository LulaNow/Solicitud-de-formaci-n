import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  console.log('Actualizando tipos de tareas...\n');

  // Actualizar tareas que no tienen tipo_tarea definido
  const tareasSinTipo = await prisma.tareaFlujo.findMany({
    where: {
      OR: [
        { tipoTarea: null },
        { tipoTarea: '' },
      ],
    },
  });

  console.log(`Tareas sin tipo encontradas: ${tareasSinTipo.length}\n`);

  for (const tarea of tareasSinTipo) {
    let nuevoTipo = 'Tarea';
    
    // Si el nombre contiene "Solicitud de aprobación", es tipo "Aprobación"
    if (tarea.nombreTarea?.toLowerCase().includes('solicitud de aprobación')) {
      nuevoTipo = 'Aprobación';
    }

    await prisma.tareaFlujo.update({
      where: { id: tarea.id },
      data: { tipoTarea: nuevoTipo },
    });

    console.log(`✓ Tarea ${tarea.id}: "${tarea.nombreTarea}" → ${nuevoTipo}`);
  }

  console.log('\n✓ Actualización completada');

  // Mostrar resumen
  const resumen = await prisma.tareaFlujo.groupBy({
    by: ['tipoTarea'],
    _count: true,
  });

  console.log('\nResumen de tipos de tarea:');
  console.log('='.repeat(50));
  resumen.forEach((item) => {
    console.log(`${item.tipoTarea || 'Sin tipo'}: ${item._count} tarea(s)`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
