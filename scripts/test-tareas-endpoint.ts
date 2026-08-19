import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  const userEmail = 'Ileana_Ruiz@nadro.com.mx';
  
  console.log(`Simulando endpoint para: ${userEmail}\n`);

  const tareas = await prisma.tareaFlujo.findMany({
    where: { asignadoARol: userEmail },
    include: {
      solicitud: {
        include: {
          tareasFlujo: true,
          historialPasos: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Total de tareas encontradas: ${tareas.length}\n`);

  const tareasConUsuario = await Promise.all(
    tareas.map(async (tarea) => {
      let usuarioCreador = null;
      if (tarea.solicitud.usuarioId) {
        usuarioCreador = await prisma.user.findUnique({
          where: { id: tarea.solicitud.usuarioId },
          select: { name: true, email: true },
        });
      }

      return {
        id: tarea.id,
        nombreSolicitud: tarea.solicitud.tipoProceso || "Sin descripción",
        usuarioCreador: usuarioCreador?.name || "Usuario desconocido",
        nombreTarea: tarea.nombreTarea || "Sin nombre",
        estadoTarea: tarea.estadoTarea,
        createdAt: tarea.createdAt,
        solicitudId: tarea.solicitudId,
      };
    })
  );

  console.log('Tareas procesadas:\n');
  tareasConUsuario.forEach((tarea, i) => {
    console.log(`${i + 1}. ${tarea.nombreSolicitud}`);
    console.log(`   Usuario: ${tarea.usuarioCreador}`);
    console.log(`   Tarea: ${tarea.nombreTarea}`);
    console.log(`   Estado: ${tarea.estadoTarea}`);
    console.log(`   Fecha: ${tarea.createdAt.toLocaleString('es-MX')}\n`);
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
