// Script para probar el cálculo de antigüedad

function calcularAntiguedad(fechaIngreso) {
  // Parsear la fecha en formato DD/MM/YYYY
  const [dia, mes, anio] = fechaIngreso.split('/').map(Number);
  const inicio = new Date(anio, mes - 1, dia); // mes - 1 porque los meses en JS van de 0-11
  const hoy = new Date();

  let años = hoy.getFullYear() - inicio.getFullYear();
  let meses = hoy.getMonth() - inicio.getMonth();
  let dias = hoy.getDate() - inicio.getDate();

  // Ajustar días si son negativos
  if (dias < 0) {
    meses--;
    // Obtener el último día del mes anterior
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }

  // Ajustar meses si son negativos
  if (meses < 0) {
    años--;
    meses += 12;
  }

  // Construir el resultado - SIEMPRE mostrar años, meses y días
  const partes = [];

  // Siempre incluir años (incluso si es 0)
  if (años > 0) {
    partes.push(`${años} año${años !== 1 ? 's' : ''}`);
  }

  // Siempre incluir meses si hay años o si los meses son > 0
  if (años > 0 || meses > 0) {
    partes.push(`${meses} mes${meses !== 1 ? 'es' : ''}`);
  }

  // Siempre incluir días si hay años o meses, o si los días son > 0
  if (años > 0 || meses > 0 || dias > 0) {
    partes.push(`${dias} día${dias !== 1 ? 's' : ''}`);
  }

  // Si no hay ninguna parte, significa que es el mismo día
  if (partes.length === 0) {
    return 'Menos de 1 día';
  }

  return partes.join(', ');
}

// Pruebas
console.log("🧪 Pruebas de cálculo de antigüedad\n");

const fechaHoy = new Date();
console.log(`📅 Fecha actual: ${fechaHoy.toLocaleDateString('es-MX')}\n`);

const casos = [
  { fecha: "23/08/2023", descripcion: "Caso del ejemplo" },
  { fecha: "01/01/2020", descripcion: "Inicio de año" },
  { fecha: "15/05/2024", descripcion: "Hace un año exacto" },
  { fecha: "22/05/2024", descripcion: "Hace un año (mismo día)" },
];

casos.forEach(caso => {
  const resultado = calcularAntiguedad(caso.fecha);
  console.log(`📌 ${caso.descripcion}`);
  console.log(`   Fecha ingreso: ${caso.fecha}`);
  console.log(`   Antigüedad: ${resultado}\n`);
});
