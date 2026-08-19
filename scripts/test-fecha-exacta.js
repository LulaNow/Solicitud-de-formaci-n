// Test para verificar el cálculo exacto
const fechaIngreso = "2023-08-23";
const fechaHoy = new Date(2026, 4, 22); // Mayo es mes 4 (0-indexed)

// Parsear correctamente YYYY-MM-DD
const [anio, mes, dia] = fechaIngreso.split('-').map(Number);
const inicio = new Date(anio, mes - 1, dia);

console.log("Fecha ingreso:", inicio.toLocaleDateString('es-MX'));
console.log("Fecha hoy:", fechaHoy.toLocaleDateString('es-MX'));

let años = fechaHoy.getFullYear() - inicio.getFullYear();
let meses = fechaHoy.getMonth() - inicio.getMonth();
let dias = fechaHoy.getDate() - inicio.getDate();

console.log("\nAntes de ajustes:");
console.log("Años:", años);
console.log("Meses:", meses);
console.log("Días:", dias);

// Ajustar días si son negativos
if (dias < 0) {
  meses--;
  const ultimoDiaMesAnterior = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), 0).getDate();
  dias += ultimoDiaMesAnterior;
  console.log("\nAjuste de días negativos:");
  console.log("Último día del mes anterior:", ultimoDiaMesAnterior);
}

// Ajustar meses si son negativos
if (meses < 0) {
  años--;
  meses += 12;
}

console.log("\nDespués de ajustes:");
console.log("Años:", años);
console.log("Meses:", meses);
console.log("Días:", dias);

console.log("\nResultado:", `${años} años, ${meses} meses, ${dias} días`);
