# 🔌 Integración con API de Empleados NADRO

## ✅ Implementación Completada

Se ha integrado exitosamente la API SOAP de empleados de NADRO para autocompletar datos en el formulario de solicitud de formación.

---

## 🎯 Funcionalidad

### **Autocompletado Automático**
Cuando el usuario ingresa:
1. **Empresa** (Nadro, Ubictum o PRESTOMYC)
2. **No. Empleado** (6 dígitos)

El sistema automáticamente:
- ✅ Consulta la API de empleados
- ✅ Obtiene los datos del empleado
- ✅ Completa el campo **Nombre** (nombre + apellido paterno + apellido materno)
- ✅ Calcula y completa la **Antigüedad** (en años, meses y días)

---

## 🔧 Configuración de la API

### **Endpoint**
```
https://api.nadro.mx/prod/Empleados/
```

### **API Key**
```
1dcbd29175c84594b164cbd552c52cd1
```

### **Método**
SOAP (XML)

---

## 📊 Mapeo de Empresas

| Empresa | Código CIA |
|---------|------------|
| Nadro | 643 |
| Ubictum | 884 |
| PRESTOMYC | 819 |

---

## 📝 Estructura de la Petición SOAP

```xml
<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ven="http://venturessoft.ws.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <ven:getEspecifico>
         <cia>643</cia>
         <numEmp>147694</numEmp>
      </ven:getEspecifico>
   </soapenv:Body>
</soapenv:Envelope>
```

### **Parámetros**
- `<cia>`: Código de la empresa (643, 884 o 819)
- `<numEmp>`: Número de empleado (6 dígitos)

---

## 📥 Estructura de la Respuesta

```xml
<?xml version="1.0" encoding="utf-16" standalone="yes"?>
<Empls>
    <Emp>
        <num_cia>643</num_cia>
        <num_emp>147694</num_emp>
        <nombre>MARIANA MAGDALENA</nombre>
        <apell_pat>MEDINA</apell_pat>
        <apell_mat>CASTILLO</apell_mat>
        <plaza>1552031</plaza>
        <area>1</area>
        <centro>1</centro>
        <linea>1510</linea>
        <puesto>244</puesto>
        <email>Mariana_Medina@nadro.com.mx</email>
        <estatus>A</estatus>
        <cod_susp>ACT</cod_susp>
        <fecha_ingreso>2014-01-22</fecha_ingreso>
        <fecha_antiguedad>2014-01-22</fecha_antiguedad>
        <fecha_nac>1968-01-26</fecha_nac>
        <fecha_promocion>2026-04-01</fecha_promocion>
        <sucursal>0</sucursal>
    </Emp>
</Empls>
```

---

## 🔄 Mapeo de Datos

### **Nombre Completo**
```
Nombre = <nombre> + <apell_pat> + <apell_mat>
Ejemplo: "MARIANA MAGDALENA MEDINA CASTILLO"
```

### **Antigüedad**
Se calcula desde `<fecha_ingreso>` hasta la fecha actual:
```
Ejemplo: "12 años, 3 meses, 20 días"
```

---

## 💻 Implementación Técnica

### **Archivo de Utilidades**
`src/lib/api/empleados-api.ts`

### **Funciones Principales**

#### 1. **getEmpleado()**
Consulta los datos de un empleado
```typescript
import { getEmpleado } from "@/lib/api/empleados-api";

const response = await getEmpleado("Nadro", "147694");

if (response.success) {
  console.log(response.nombreCompleto); // "MARIANA MAGDALENA MEDINA CASTILLO"
  console.log(response.antiguedad);     // "12 años, 3 meses, 20 días"
}
```

#### 2. **validarNumeroEmpleado()**
Valida el formato del número de empleado
```typescript
import { validarNumeroEmpleado } from "@/lib/api/empleados-api";

const esValido = validarNumeroEmpleado("147694"); // true
const noValido = validarNumeroEmpleado("123");    // false (debe tener 6 dígitos)
```

---

## 🎨 Experiencia de Usuario

### **Flujo de Uso**

1. **Usuario selecciona Empresa**
   ```
   Empresa: Nadro ✓
   ```

2. **Usuario ingresa No. Empleado**
   ```
   No. Empleado: 147694
   ```

3. **Sistema consulta automáticamente** (con debounce de 500ms)
   ```
   🔄 Consultando empleado...
   ```

4. **Campos se completan automáticamente**
   ```
   ✅ Nombre: MARIANA MAGDALENA MEDINA CASTILLO
   ✅ Antigüedad: 12 años, 3 meses, 20 días
   ```

### **Indicadores Visuales**

#### **Cargando**
```
🔄 Consultando empleado...
[Spinner animado en el campo No. Empleado]
```

#### **Error**
```
❌ Empleado no encontrado o inactivo
```

#### **Éxito**
```
✅ Campos completados automáticamente
```

---

## 🔍 Validaciones

### **Número de Empleado**
- ✅ Debe tener exactamente **6 dígitos**
- ✅ Solo acepta números
- ✅ Placeholder: "Ej: 147694"

### **Empresa**
- ✅ Debe seleccionar una opción válida
- ✅ Opciones: Nadro, Ubictum, PRESTOMYC

### **Estado del Empleado**
- ✅ Solo empleados activos (`estatus: "A"`)
- ❌ Empleados inactivos son rechazados

---

## ⚡ Optimizaciones

### **Debounce**
- Espera **500ms** después de que el usuario deja de escribir
- Evita consultas innecesarias mientras el usuario escribe

### **Caché**
- Las respuestas no se cachean (siempre consulta datos actuales)
- Puedes agregar caché si es necesario

### **Manejo de Errores**
- ✅ Errores de red
- ✅ Errores de parseo XML
- ✅ Empleado no encontrado
- ✅ Empleado inactivo
- ✅ Formato de número inválido

---

## 📋 Ejemplo de Uso

### **Caso 1: Empleado Encontrado**
```
Entrada:
  Empresa: Nadro
  No. Empleado: 147694

Resultado:
  ✅ Nombre: MARIANA MAGDALENA MEDINA CASTILLO
  ✅ Antigüedad: 12 años, 3 meses, 20 días
```

### **Caso 2: Empleado No Encontrado**
```
Entrada:
  Empresa: Nadro
  No. Empleado: 999999

Resultado:
  ❌ Error: Empleado no encontrado o inactivo
  Nombre: [vacío]
  Antigüedad: [vacío]
```

### **Caso 3: Número Inválido**
```
Entrada:
  Empresa: Nadro
  No. Empleado: 123

Resultado:
  ❌ Error: El número de empleado debe tener 6 dígitos
```

---

## 🛠️ Archivos Modificados/Creados

```
✅ src/lib/api/empleados-api.ts (NUEVO)
   └─ Lógica de integración con API SOAP

✅ src/app/(portal)/requests/training/new/page.tsx (MODIFICADO)
   └─ Autocompletado de campos con datos del empleado

✅ INTEGRACION_API_EMPLEADOS.md (NUEVO)
   └─ Documentación de la integración
```

---

## 🔐 Seguridad

### **API Key**
- ✅ Hardcodeada en el código (para desarrollo)
- ⚠️ **Recomendación**: Mover a variable de entorno en producción

### **Validación**
- ✅ Solo acepta empresas válidas
- ✅ Valida formato de número de empleado
- ✅ Verifica estado activo del empleado

---

## 🐛 Debugging

### **Ver Logs en Consola**
```javascript
console.log("[API Empleados] Consultando empleado:", { empresa, numEmpleado });
console.log("[API Empleados] Respuesta recibida");
console.log("[API Empleados] Empleado encontrado:", nombreCompleto);
```

### **Errores Comunes**

#### **CORS Error**
```
Solución: La API debe tener CORS habilitado
```

#### **XML Parse Error**
```
Solución: Verificar formato de la respuesta XML
```

#### **Network Error**
```
Solución: Verificar conectividad y URL de la API
```

---

## 🚀 Mejoras Futuras

### **Posibles Mejoras**
1. ✅ Caché de consultas recientes
2. ✅ Autocompletar más campos (puesto, email, etc.)
3. ✅ Búsqueda por nombre
4. ✅ Validación de permisos del empleado
5. ✅ Historial de consultas

---

## 📚 Recursos

- **Archivo de API**: `src/lib/api/empleados-api.ts`
- **Formulario**: `src/app/(portal)/requests/training/new/page.tsx`
- **Endpoint**: https://api.nadro.mx/prod/Empleados/

---

## ✅ Checklist de Integración

- [x] ✅ Crear función para consultar API SOAP
- [x] ✅ Parsear respuesta XML
- [x] ✅ Mapear empresas a códigos
- [x] ✅ Calcular antigüedad
- [x] ✅ Integrar en formulario
- [x] ✅ Agregar indicador de carga
- [x] ✅ Manejar errores
- [x] ✅ Validar formato de número
- [x] ✅ Debounce para optimizar
- [x] ✅ Documentación completa

---

¿Necesitas agregar más campos del empleado o modificar la integración?
