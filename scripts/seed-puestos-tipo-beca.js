// Script para poblar la tabla puestos_tipo_beca con las reglas de negocio
const { PrismaClient } = require('@prisma/client');

async function seedPuestosTipoBeca() {
  const prisma = new PrismaClient();
  
  try {
    console.log("🌱 Poblando tabla puestos_tipo_beca...\n");
    
    // Limpiar tabla primero
    await prisma.$executeRaw`DELETE FROM puestos_tipo_beca;`;
    console.log("🗑️  Tabla limpiada\n");
    
    const registros = [
      {
        id: 'puesto-operativo',
        puesto: 'PUESTOS OPERATIVOS',
        tipoBeca: 'Curso,Diplomado,Bachillerato,Licenciatura'
      },
      {
        id: 'hasta-gerencial',
        puesto: 'HASTA EL NIVEL GERENCIAL',
        tipoBeca: 'Curso,Diplomado,Bachillerato,Licenciatura,Titulación'
      },
      {
        id: 'gerencia-superior',
        puesto: 'GERENCIA O CARGOS SUPERIORES',
        tipoBeca: 'Curso,Certificación,Maestría,Seminario,Titulación de maestría,Licenciatura,Diplomado,Bachillerato,Titulación de licenciatura,Otros'
      }
    ];
    
    for (const registro of registros) {
      await prisma.puestoTipoBeca.create({
        data: registro
      });
      console.log(`✅ Creado: ${registro.puesto}`);
    }
    
    console.log("\n📊 Registros creados:");
    const todos = await prisma.puestoTipoBeca.findMany();
    console.table(todos.map(r => ({
      Puesto: r.puesto,
      'Tipos de Beca': r.tipoBeca.split(',').length + ' opciones'
    })));
    
    console.log("\n✅ Tabla poblada exitosamente");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedPuestosTipoBeca();
