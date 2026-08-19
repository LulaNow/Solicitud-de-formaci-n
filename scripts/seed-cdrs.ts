import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

const cdrsData = [
  {
    nombre: 'BAJIO',
    valor: '3000',
    gerenteTalentoCultura: 'Maria_Ramirez@nadro.com.mx',
    gerenteCdr: 'Andres_Fraga@nadro.com.mx',
  },
  {
    nombre: 'CHIHUAHUA',
    valor: '3010',
    gerenteTalentoCultura: 'Vitlayii_Prieto@nadro.com.mx',
    gerenteCdr: 'Ivan_Flores@nadro.com.mx',
  },
  {
    nombre: 'CULIACAN',
    valor: '3020',
    gerenteTalentoCultura: 'Abraham_Huitron@nadro.com.mx',
    gerenteCdr: 'Maria_Chavez@nadro.com.mx',
  },
  {
    nombre: 'GUADALAJARA',
    valor: '3030',
    gerenteTalentoCultura: 'Janet_Macias@nadro.com.mx',
    gerenteCdr: 'Luis_Lujan@nadro.com.mx',
  },
  {
    nombre: 'LA PAZ',
    valor: '3040',
    gerenteTalentoCultura: 'Andrea_Ortega@nadro.com.mx',
    gerenteCdr: 'Patricia_Cornejo@nadro.com.mx',
  },
  {
    nombre: 'MERIDA',
    valor: '3050',
    gerenteTalentoCultura: 'Ileana_Ruiz@nadro.com.mx',
    gerenteCdr: 'Jose_Luis_Gonzalez@nadro.com.mx',
  },
  {
    nombre: 'MEXICO NORTE',
    valor: '3060',
    gerenteTalentoCultura: 'Lourdes_Perez@nadro.com.mx',
    gerenteCdr: 'Oscar_Lacorte@nadro.com.mx',
  },
  {
    nombre: 'MEXICO SUR',
    valor: '3070',
    gerenteTalentoCultura: 'Zinthia_Vazquez@nadro.com.mx',
    gerenteCdr: 'Manuel_Pozos@nadro.com.mx',
  },
  {
    nombre: 'MONTERREY',
    valor: '3080',
    gerenteTalentoCultura: 'Claudia_Gonzalez@nadro.com.mx',
    gerenteCdr: 'Erick_Eslava@nadro.com.mx',
  },
  {
    nombre: 'MORELIA',
    valor: '3090',
    gerenteTalentoCultura: 'Ines_Valadez@nadro.com.mx',
    gerenteCdr: 'Victor_Rangel@nadro.com.mx',
  },
  {
    nombre: 'PUEBLA',
    valor: '3100',
    gerenteTalentoCultura: 'Maribel_Medellin@nadro.com.mx',
    gerenteCdr: 'Liliana_Vazquez@nadro.com.mx',
  },
  {
    nombre: 'TIJUANA',
    valor: '3110',
    gerenteTalentoCultura: 'Olivier_Sanchez@nadro.com.mx',
    gerenteCdr: 'Adrian_Marmolejo@nadro.com.mx',
  },
  {
    nombre: 'TUXTLA',
    valor: '3120',
    gerenteTalentoCultura: 'Ruben_Celaya@nadro.com.mx',
    gerenteCdr: 'Martin_Espinosa@nadro.com.mx',
  },
  {
    nombre: 'VERACRUZ',
    valor: '3130',
    gerenteTalentoCultura: 'Elizabeth_Gonzalez@nadro.com.mx',
    gerenteCdr: 'Rudy_Roque@nadro.com.mx',
  },
];

async function main() {
  console.log('Limpiando tabla cdrs...\n');

  const deletedCount = await prisma.cdr.deleteMany({});
  console.log(`✓ ${deletedCount.count} registros eliminados\n`);

  console.log('Insertando nuevos registros en la tabla cdrs...\n');

  let insertedCount = 0;
  for (const cdrData of cdrsData) {
    const cdr = await prisma.cdr.create({
      data: cdrData,
    });
    insertedCount++;
    console.log(`✓ Registro ${insertedCount}: ${cdr.nombre} (${cdr.valor})`);
  }

  console.log(`\n¡${insertedCount} registros insertados exitosamente!`);

  console.log('\n' + '='.repeat(80));
  console.log('Verificando todos los registros en cdrs:');
  console.log('='.repeat(80) + '\n');

  const todosLosCdrs = await prisma.cdr.findMany({
    orderBy: {
      valor: 'asc',
    },
  });

  console.log(`Total de registros: ${todosLosCdrs.length}\n`);

  todosLosCdrs.forEach((cdr, index) => {
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${cdr.nombre.padEnd(20)} | Valor: ${cdr.valor}`);
    console.log(`    Gerente T&C: ${cdr.gerenteTalentoCultura}`);
    console.log(`    Gerente CDR: ${cdr.gerenteCdr}`);
    console.log('');
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
