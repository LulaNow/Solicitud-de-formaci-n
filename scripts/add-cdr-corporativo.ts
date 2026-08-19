import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  console.log('Agregando CDR 1000 - CORPORATIVO...\n');

  // Verificar si ya existe
  const existente = await prisma.cdr.findFirst({
    where: { valor: '1000' },
  });

  if (existente) {
    console.log('El CDR 1000 ya existe:', existente);
    return;
  }

  // Crear el nuevo CDR
  const nuevoCdr = await prisma.cdr.create({
    data: {
      valor: '1000',
      nombre: 'CORPORATIVO',
      gerenteTalentoCultura: 'Por definir',
      gerenteCdr: 'Por definir',
    },
  });

  console.log('CDR creado exitosamente:');
  console.log('Valor:', nuevoCdr.valor);
  console.log('Nombre:', nuevoCdr.nombre);
  console.log('Gerente Talento Cultura:', nuevoCdr.gerenteTalentoCultura);
  console.log('Gerente CDR:', nuevoCdr.gerenteCdr);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
