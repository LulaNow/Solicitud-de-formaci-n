import * as dotenv from 'dotenv';

dotenv.config();

async function testCdrGerenteAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Probando API de Gerente CDR...\n');

  // Probar con CDR 3050 (MERIDA)
  console.log('1. Probando CDR 3050 (MERIDA):');
  console.log('   URL:', `${baseUrl}/api/cdr-gerente?cdr=3050`);
  
  try {
    const response = await fetch(`${baseUrl}/api/cdr-gerente?cdr=3050`);
    const data = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Respuesta:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('   Error:', error);
  }

  console.log('\n2. Probando CDR 3000 (BAJIO):');
  console.log('   URL:', `${baseUrl}/api/cdr-gerente?cdr=3000`);
  
  try {
    const response = await fetch(`${baseUrl}/api/cdr-gerente?cdr=3000`);
    const data = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Respuesta:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('   Error:', error);
  }

  console.log('\n3. Probando CDR inexistente (9999):');
  console.log('   URL:', `${baseUrl}/api/cdr-gerente?cdr=9999`);
  
  try {
    const response = await fetch(`${baseUrl}/api/cdr-gerente?cdr=9999`);
    const data = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Respuesta:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('   Error:', error);
  }
}

testCdrGerenteAPI();
