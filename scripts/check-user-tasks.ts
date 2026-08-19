import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  const userEmail = 'Jose_Luis_Gonzalez@nadro.com.mx';
  
  console.log(`Buscando tareas para: ${userEmail}\n`);

  const tareas = await prisma.tareaFlujo.findMany({
    where: { asignadoARol: userEmail },
    include: {
      solicitud: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Total de tareas encontradas: ${tareas.length}\n`);

  if (tareas.length === 0) {
    console.log('No hay tareas asignadas a este usuario.');
    return;
  }

  console.log('Detalle de tareas:');
  console.log('='.repeat(100));

  tareas.forEach((tarea, index) => {
    console.log(`\n${index + 1}. Tarea ID: ${tarea.id}`);
    console.log(`   Ticket: ${tarea.solicitud.numeroTicket || 'N/A'}`);
    console.log(`   Nombre: ${tarea.nombreTarea}`);
    console.log(`   Tipo Tarea: ${tarea.tipoTarea || 'NO DEFINIDO'}`);
    console.log(`   Estado: ${tarea.estadoTarea}`);
    console.log(`   Tipo Proceso: ${tarea.solicitud.tipoProceso}`);
    console.log(`   Asignado a: ${tarea.asignadoARol}`);
    console.log(`   Creado: ${tarea.createdAt}`);
  });

  // Contar por tipo
  const porTipo = tareas.reduce((acc, t) => {
    const tipo = t.tipoTarea || 'Sin tipo';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n\nResumen por tipo:');
  console.log('='.repeat(50));
  Object.entries(porTipo).forEach(([tipo, count]) => {
    console.log(`${tipo}: ${count}`);
  });

  // Contar por estado
  const porEstado = tareas.reduce((acc, t) => {
    const estado = t.estadoTarea.toLowerCase();
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n\nResumen por estado:');
  console.log('='.repeat(50));
  Object.entries(porEstado).forEach(([estado, count]) => {
    console.log(`${estado}: ${count}`);
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
