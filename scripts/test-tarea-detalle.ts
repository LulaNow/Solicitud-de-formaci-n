import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando una tarea de ejemplo...\n');

  const tarea = await prisma.tareaFlujo.findFirst({
    where: { asignadoARol: 'Ileana_Ruiz@nadro.com.mx' },
    include: {
      solicitud: true,
    },
  });

  if (!tarea) {
    console.log('No se encontró ninguna tarea');
    return;
  }

  console.log(`Tarea encontrada: ${tarea.id}\n`);

  let usuarioCreador = null;
  if (tarea.solicitud.usuarioId) {
    usuarioCreador = await prisma.user.findUnique({
      where: { id: tarea.solicitud.usuarioId },
      select: { name: true, email: true },
    });
  }

  let datosEntrada: Record<string, unknown> = {};
  if (tarea.solicitud.datosEntrada) {
    try {
      datosEntrada = tarea.solicitud.datosEntrada as Record<string, unknown>;
    } catch {
      datosEntrada = {};
    }
  }

  const resultado = {
    id: tarea.id,
    numeroTicket: tarea.solicitud.numeroTicket || "Sin número",
    nombreSolicitud: tarea.solicitud.tipoProceso || "Sin descripción",
    usuarioCreador: usuarioCreador?.name || "Usuario desconocido",
    emailCreador: usuarioCreador?.email || "",
    nombreTarea: tarea.nombreTarea || "Sin nombre",
    estadoTarea: tarea.estadoTarea,
    estadoSolicitud: tarea.solicitud.estado,
    createdAt: tarea.createdAt,
    solicitudCreatedAt: tarea.solicitud.createdAt,
    solicitudId: tarea.solicitudId,
    datosEntrada,
    webhookResumeUrl: tarea.webhookResumeUrl,
  };

  console.log('Detalle de la tarea:');
  console.log('='.repeat(60));
  console.log(`ID: ${resultado.id}`);
  console.log(`Número Ticket: ${resultado.numeroTicket}`);
  console.log(`Usuario Creador: ${resultado.usuarioCreador}`);
  console.log(`Email Creador: ${resultado.emailCreador}`);
  console.log(`Nombre Tarea: ${resultado.nombreTarea}`);
  console.log(`Estado Tarea: ${resultado.estadoTarea}`);
  console.log(`Estado Solicitud: ${resultado.estadoSolicitud}`);
  console.log(`Fecha Creación Tarea: ${resultado.createdAt.toLocaleString('es-MX')}`);
  console.log(`Fecha Creación Solicitud: ${resultado.solicitudCreatedAt.toLocaleString('es-MX')}`);
  console.log('\nDatos de entrada:');
  console.log(JSON.stringify(resultado.datosEntrada, null, 2));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
