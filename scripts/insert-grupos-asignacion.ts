import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  console.log('Insertando registros en la tabla grupos_asignacion...\n');

  try {
    const registro1 = await prisma.grupoAsignacion.create({
      data: {
        nombre: 'Coordinación de Formación Institucional',
        usuario: 'Victor_Garcia@nadro.com.mx',
      },
    });
    console.log('✓ Registro 1 creado:', registro1);

    const registro2 = await prisma.grupoAsignacion.create({
      data: {
        nombre: 'Gerencia de Formación Institucional',
        usuario: 'Nancy_Banda@nadro.com.mx',
      },
    });
    console.log('✓ Registro 2 creado:', registro2);

    console.log('\n¡Registros insertados exitosamente!');

    console.log('\nVerificando todos los registros en grupos_asignacion:');
    const todosLosGrupos = await prisma.grupoAsignacion.findMany();
    console.log(`\nTotal de registros: ${todosLosGrupos.length}`);
    todosLosGrupos.forEach((grupo, index) => {
      console.log(`\n${index + 1}. ${grupo.nombre}`);
      console.log(`   Usuario: ${grupo.usuario}`);
      console.log(`   ID: ${grupo.id}`);
    });

  } catch (error) {
    console.error('Error al insertar los registros:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
