// Script para agregar el menú "Crear solicitud de formación"
// Ejecutar con: node scripts/add-training-menu.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Agregando menú "Crear solicitud de formación"...\n');

  try {
    // 1. Verificar si ya existe el menú "Crear solicitud de formación"
    const existingMenu = await prisma.menuItem.findFirst({
      where: {
        labelEs: 'Crear solicitud de formación'
      }
    });

    if (existingMenu) {
      console.log(`⚠️  El menú "Crear solicitud de formación" ya existe (ID: ${existingMenu.id})`);
      console.log(`   Path: ${existingMenu.path}`);
      console.log(`   Parent: ${existingMenu.parentId || 'Ninguno (menú principal)'}`);

      // Si tiene padre, actualizarlo para que no tenga
      if (existingMenu.parentId) {
        console.log('\n🔄 Actualizando menú para que aparezca en el menú principal...');
        await prisma.menuItem.update({
          where: { id: existingMenu.id },
          data: { parentId: null, order: 3 }
        });
        console.log('✅ Menú actualizado exitosamente.');
      } else {
        console.log('\n✅ El menú ya está en el menú principal.');
      }
      return;
    }

    // 2. Crear el nuevo menú directamente en el menú principal
    console.log('📄 Creando menú "Crear solicitud de formación" en el menú principal...');
    const newMenu = await prisma.menuItem.create({
      data: {
        label: 'New Training Request',
        labelEs: 'Crear solicitud de formación',
        icon: 'FileText',
        path: '/requests/training/new',
        parentId: null, // Sin padre = menú principal
        order: 3,
      }
    });
    console.log(`✅ Menú creado con ID: ${newMenu.id}\n`);

    // 4. El menú está disponible para todos los usuarios
    console.log('✅ El menú está disponible para todos los usuarios.');
    console.log('   Si necesitas restringir el acceso, puedes asignar un permiso desde /admin/menus');

    console.log('\n🎉 ¡Menú agregado exitosamente!');
    console.log('\n📍 El menú aparecerá directamente en el sidebar:');
    console.log('   📄 Crear solicitud de formación');
    console.log('\n🌐 URL directa: http://localhost:3001/requests/training/new');

  } catch (error) {
    console.error('\n❌ Error al agregar el menú:', error.message);
    console.error('\nDetalles del error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
