import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  console.log('Actualizando gerentes de CDRs...\n');

  // Actualizar CDR 3050 (MERIDA) con el correo de Ileana Ruiz como ejemplo
  const cdr3050 = await prisma.cdr.updateMany({
    where: { valor: '3050' },
    data: {
      gerenteCdr: 'Ileana_Ruiz@nadro.com.mx',
      gerenteTalentoCultura: 'talento_cultura@nadro.com.mx',
    },
  });

  console.log(`CDR 3050 (MERIDA) actualizado: ${cdr3050.count} registro(s)`);

  // Listar todos los CDRs para verificar
  const cdrs = await prisma.cdr.findMany({
    orderBy: { valor: 'asc' },
  });

  console.log('\nCDRs en la base de datos:');
  console.log('='.repeat(80));
  for (const cdr of cdrs) {
    console.log(`${cdr.valor} - ${cdr.nombre}`);
    console.log(`  Gerente CDR: ${cdr.gerenteCdr}`);
    console.log(`  Gerente Talento Cultura: ${cdr.gerenteTalentoCultura}`);
    console.log('');
  }

  console.log('\n⚠️  NOTA: Actualiza los correos de los gerentes según corresponda a cada CDR');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
