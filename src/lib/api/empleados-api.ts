/**
 * API de Empleados NADRO
 * Integración con servicio SOAP para obtener datos de empleados
 */

const API_URL = "https://api.nadro.mx/prod/Empleados/";
const API_KEY = "1dcbd29175c84594b164cbd552c52cd1";

// Mapeo de empresas a códigos de compañía
const EMPRESA_CIA_MAP: Record<string, string> = {
  "Nadro": "643",
  "Ubictum": "884",
  "PRESTOMYC": "819",
};

export interface EmpleadoData {
  num_cia: string;
  num_emp: string;
  nombre: string;
  apell_pat: string;
  apell_mat: string;
  plaza: string;
  area: string;
  centro: string;
  linea: string;
  puesto: string;
  email: string;
  estatus: string;
  cod_susp: string;
  fecha_ingreso: string;
  fecha_antiguedad: string;
  fecha_nac: string;
  fecha_promocion: string;
  sucursal: string;
}

export interface EmpleadoResponse {
  success: boolean;
  data?: EmpleadoData;
  error?: string;
  nombreCompleto?: string;
  antiguedad?: string;
  fechaIngreso?: string;
  clavePuesto?: string;
  area?: string;
  centro?: string;
  linea?: string;
}

/**
 * Calcula la antigüedad en años, meses y días desde una fecha
 */
function calcularAntiguedad(fechaIngreso: string): string {
  const inicio = new Date(fechaIngreso);
  const hoy = new Date();

  let años = hoy.getFullYear() - inicio.getFullYear();
  let meses = hoy.getMonth() - inicio.getMonth();
  let dias = hoy.getDate() - inicio.getDate();

  // Ajustar si los días son negativos
  if (dias < 0) {
    meses--;
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }

  // Ajustar si los meses son negativos
  if (meses < 0) {
    años--;
    meses += 12;
  }

  const partes: string[] = [];
  if (años > 0) partes.push(`${años} año${años !== 1 ? 's' : ''}`);
  if (meses > 0) partes.push(`${meses} mes${meses !== 1 ? 'es' : ''}`);
  if (dias > 0) partes.push(`${dias} día${dias !== 1 ? 's' : ''}`);

  return partes.length > 0 ? partes.join(', ') : '0 días';
}

/**
 * Construye el XML SOAP para la petición
 */
function buildSoapRequest(cia: string, numEmp: string): string {
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

/**
 * Parsea la respuesta XML y extrae los datos del empleado
 */
function parseEmpleadoXML(xmlText: string): EmpleadoData | null {
  try {
    // Crear parser XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Verificar si hay errores de parseo
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      console.error("Error al parsear XML:", parseError.textContent);
      return null;
    }

    // Buscar el nodo Emp
    const empNode = xmlDoc.querySelector("Emp");
    if (!empNode) {
      console.error("No se encontró el nodo Emp en la respuesta");
      return null;
    }

    // Extraer todos los campos
    const getData = (tagName: string): string => {
      const node = empNode.querySelector(tagName);
      return node?.textContent?.trim() || "";
    };

    return {
      num_cia: getData("num_cia"),
      num_emp: getData("num_emp"),
      nombre: getData("nombre"),
      apell_pat: getData("apell_pat"),
      apell_mat: getData("apell_mat"),
      plaza: getData("plaza"),
      area: getData("area"),
      centro: getData("centro"),
      linea: getData("linea"),
      puesto: getData("puesto"),
      email: getData("email"),
      estatus: getData("estatus"),
      cod_susp: getData("cod_susp"),
      fecha_ingreso: getData("fecha_ingreso"),
      fecha_antiguedad: getData("fecha_antiguedad"),
      fecha_nac: getData("fecha_nac"),
      fecha_promocion: getData("fecha_promocion"),
      sucursal: getData("sucursal"),
    };
  } catch (error) {
    console.error("Error al parsear XML:", error);
    return null;
  }
}

/**
 * Obtiene los datos de un empleado específico
 * Usa el endpoint de Next.js para evitar problemas de CORS
 */
export async function getEmpleado(
  empresa: string,
  numEmpleado: string
): Promise<EmpleadoResponse> {
  try {
    // Validar parámetros
    if (!empresa || !numEmpleado) {
      return {
        success: false,
        error: "Empresa y número de empleado son requeridos",
      };
    }

    console.log("[API Empleados] Consultando empleado:", { empresa, numEmpleado });

    // Llamar al endpoint de Next.js
    const response = await fetch(
      `/api/empleados?empresa=${encodeURIComponent(empresa)}&numEmpleado=${encodeURIComponent(numEmpleado)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("[API Empleados] Error:", data.error);
      return {
        success: false,
        error: data.error || "Error al consultar empleado",
      };
    }

    console.log("[API Empleados] Empleado encontrado:", data.nombreCompleto);

    return {
      success: true,
      nombreCompleto: data.nombreCompleto,
      antiguedad: data.antiguedad,
      fechaIngreso: data.fechaIngreso,
      clavePuesto: data.clavePuesto,
      area: data.area,
      centro: data.centro,
      linea: data.linea,
    };
  } catch (error) {
    console.error("[API Empleados] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Valida si un número de empleado tiene el formato correcto
 */
export function validarNumeroEmpleado(numEmp: string): boolean {
  // Debe contener solo números (sin restricción de longitud)
  return /^\d+$/.test(numEmp) && numEmp.length > 0;
}

/**
 * Obtiene el CECO del departamento
 */
export async function getDepartamento(
  empresa: string,
  area: string,
  centro: string,
  linea: string
): Promise<{ success: boolean; cecoDescripcion?: string; agrupacion1?: string; error?: string }> {
  try {
    if (!empresa || !area || !centro || !linea) {
      return {
        success: false,
        error: "Empresa, área, centro y línea son requeridos",
      };
    }

    console.log("[API Departamento] Consultando departamento:", { empresa, area, centro, linea });

    const response = await fetch(
      `/api/departamento?empresa=${encodeURIComponent(empresa)}&area=${encodeURIComponent(area)}&centro=${encodeURIComponent(centro)}&linea=${encodeURIComponent(linea)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("[API Departamento] Error:", data.error);
      return {
        success: false,
        error: data.error || "Error al consultar departamento",
      };
    }

    console.log("[API Departamento] CECO encontrado:", data.cecoDescripcion);

    return {
      success: true,
      cecoDescripcion: data.cecoDescripcion,
      agrupacion1: data.agrupacion1,
    };
  } catch (error) {
    console.error("[API Departamento] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Obtiene la descripción de un puesto
 */
export async function getPuesto(
  empresa: string,
  clavePuesto: string
): Promise<{ success: boolean; descripcionPuesto?: string; error?: string }> {
  try {
    if (!empresa || !clavePuesto) {
      return {
        success: false,
        error: "Empresa y clave de puesto son requeridos",
      };
    }

    console.log("[API Puesto] Consultando puesto:", { empresa, clavePuesto });

    const response = await fetch(
      `/api/puesto?empresa=${encodeURIComponent(empresa)}&clavePuesto=${encodeURIComponent(clavePuesto)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("[API Puesto] Error:", data.error);
      return {
        success: false,
        error: data.error || "Error al consultar puesto",
      };
    }

    console.log("[API Puesto] Puesto encontrado:", data.descripcionPuesto);

    return {
      success: true,
      descripcionPuesto: data.descripcionPuesto,
    };
  } catch (error) {
    console.error("[API Puesto] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
