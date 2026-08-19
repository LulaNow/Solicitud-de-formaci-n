import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  console.log('Ejemplo de uso de las nuevas tablas\n');

  console.log('1. Creando un registro en la tabla cdrs...');
  const cdr = await prisma.cdr.create({
    data: {
      nombre: 'CDR Ejemplo',
      valor: 'VALOR001',
      gerenteTalentoCultura: 'Juan Pérez',
      gerenteCdr: 'María García',
    },
  });
  console.log('✓ CDR creado:', cdr);

  console.log('\n2. Creando un registro en la tabla grupos_asignacion...');
  const grupo = await prisma.grupoAsignacion.create({
    data: {
      nombre: 'Grupo A',
      usuario: 'usuario@ejemplo.com',
    },
  });
  console.log('✓ Grupo de asignación creado:', grupo);

  console.log('\n3. Listando todos los CDRs...');
  const cdrs = await prisma.cdr.findMany();
  console.log('CDRs encontrados:', cdrs.length);

  console.log('\n4. Listando todos los grupos de asignación...');
  const grupos = await prisma.grupoAsignacion.findMany();
  console.log('Grupos encontrados:', grupos.length);

  console.log('\n✓ Ejemplo completado exitosamente');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
