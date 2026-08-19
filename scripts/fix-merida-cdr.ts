import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  console.log('Corrigiendo datos del CDR MERIDA...\n');

  // Corregir el CDR 3050 (MERIDA) con los datos correctos
  const resultado = await prisma.cdr.updateMany({
    where: { valor: '3050' },
    data: {
      nombre: 'MERIDA',
      gerenteTalentoCultura: 'Ileana_Ruiz@nadro.com.mx',
      gerenteCdr: 'Jose_Luis_Gonzalez@nadro.com.mx',
    },
  });

  console.log(`CDR 3050 (MERIDA) corregido: ${resultado.count} registro(s)`);

  // Verificar el registro actualizado
  const cdrMerida = await prisma.cdr.findFirst({
    where: { valor: '3050' },
  });

  console.log('\nDatos actualizados:');
  console.log('Nombre:', cdrMerida?.nombre);
  console.log('Valor:', cdrMerida?.valor);
  console.log('Gerente Talento Cultura:', cdrMerida?.gerenteTalentoCultura);
  console.log('Gerente CDR:', cdrMerida?.gerenteCdr);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
