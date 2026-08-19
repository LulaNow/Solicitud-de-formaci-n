import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  const userEmail = 'Ileana_Ruiz@nadro.com.mx';
  
  console.log(`Buscando usuario: ${userEmail}\n`);

  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: userEmail },
        { username: userEmail }
      ]
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (user) {
    console.log('✓ Usuario encontrado:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Roles: ${user.userRoles.map(ur => ur.role.name).join(', ')}\n`);

    console.log('Buscando tareas asignadas...\n');
    
    const tareasPorId = await prisma.tareaFlujo.findMany({
      where: { asignadoARol: user.id },
      take: 5,
    });
    console.log(`Tareas donde asignado_a_rol = user.id (${user.id}): ${tareasPorId.length}`);

    const tareasPorUsername = await prisma.tareaFlujo.findMany({
      where: { asignadoARol: user.username },
      take: 5,
    });
    console.log(`Tareas donde asignado_a_rol = username (${user.username}): ${tareasPorUsername.length}`);

    const tareasPorEmail = await prisma.tareaFlujo.findMany({
      where: { asignadoARol: user.email },
      take: 5,
    });
    console.log(`Tareas donde asignado_a_rol = email (${user.email}): ${tareasPorEmail.length}`);

    for (const rol of user.userRoles) {
      const tareasPorRol = await prisma.tareaFlujo.findMany({
        where: { asignadoARol: rol.role.name },
        take: 5,
      });
      console.log(`Tareas donde asignado_a_rol = rol.name (${rol.role.name}): ${tareasPorRol.length}`);
    }

    console.log('\nMuestra de todas las tareas (primeras 5):');
    const todasLasTareas = await prisma.tareaFlujo.findMany({
      take: 5,
      select: {
        id: true,
        nombreTarea: true,
        asignadoARol: true,
        estadoTarea: true,
      },
    });
    
    todasLasTareas.forEach((tarea, i) => {
      console.log(`\n${i + 1}. ${tarea.nombreTarea || 'Sin nombre'}`);
      console.log(`   Asignado a: ${tarea.asignadoARol || 'Sin asignar'}`);
      console.log(`   Estado: ${tarea.estadoTarea}`);
    });

  } else {
    console.log('✗ Usuario no encontrado');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
