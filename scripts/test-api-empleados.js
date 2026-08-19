// Script de prueba para la API de empleados
// Ejecutar con: node scripts/test-api-empleados.js

const API_URL = "https://api.nadro.mx/prod/Empleados/";
const API_KEY = "1dcbd29175c84594b164cbd552c52cd1";

const EMPRESA_CIA_MAP = {
  "Nadro": "643",
  "Ubictum": "884",
  "PRESTOMYC": "819",
};

function buildSoapRequest(cia, numEmp) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ven="http://venturessoft.ws.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <ven:getEspecifico>
         <cia>${cia}</cia>
         <numEmp>${numEmp}</numEmp>
      </ven:getEspecifico>
   </soapenv:Body>
</soapenv:Envelope>`;
}

async function testAPI() {
  console.log("🧪 Probando API de Empleados NADRO\n");
  
  const empresa = "Nadro";
  const numEmpleado = "147694";
  const cia = EMPRESA_CIA_MAP[empresa];
  
  console.log("📋 Datos de prueba:");
  console.log(`   Empresa: ${empresa}`);
  console.log(`   Código CIA: ${cia}`);
  console.log(`   No. Empleado: ${numEmpleado}\n`);
  
  try {
    console.log("🔄 Enviando petición SOAP...");
    
    const soapRequest = buildSoapRequest(cia, numEmpleado);
    console.log("📤 Request XML:");
    console.log(soapRequest);
    console.log("");
    
    const response = await fetch(
      `${API_URL}?soapAction=getEspecifico&api-key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "getEspecifico",
        },
        body: soapRequest,
      }
    );
    
    console.log(`📥 Respuesta HTTP: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      console.error("❌ Error en la petición HTTP");
      return;
    }
    
    const xmlText = await response.text();
    console.log("📄 Respuesta XML:");
    console.log(xmlText);
    console.log("");
    
    // Intentar parsear con DOMParser (solo funciona en navegador)
    // En Node.js necesitarías una librería como 'xmldom'
    console.log("✅ Petición exitosa!");
    console.log("\n💡 Para ver los datos parseados, ejecuta esto en el navegador");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testAPI();
