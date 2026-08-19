import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  const email = 'lourdes_bautista@nadro.com.mx';
  
  console.log(`Buscando usuario: ${email}\n`);

  const user = await prisma.user.findUnique({
    where: { email: email },
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
    console.log(`  Name: ${user.name}`);
    console.log(`  Status: ${user.status}`);
    console.log(`  MFA Enabled: ${user.mfaEnabled}`);
    console.log(`  Roles: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);
  } else {
    console.log('✗ Usuario no encontrado');
  }

  console.log('\nListando todos los usuarios:');
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      username: true,
      name: true,
      status: true,
    },
  });

  console.log(`\nTotal de usuarios: ${allUsers.length}\n`);
  allUsers.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email} (${u.username}) - ${u.status}`);
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
