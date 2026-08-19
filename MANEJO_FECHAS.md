# 📅 Manejo de Fechas y Horas en el Sistema

## ✅ Configuración Implementada

El sistema ahora utiliza **la zona horaria local del navegador/sistema del usuario** para todas las fechas y horas, evitando problemas de conversión UTC.

---

## 🌍 Zona Horaria

### **Comportamiento**
- ✅ Todas las fechas se muestran en la **zona horaria del sistema del usuario**
- ✅ No hay conversión a UTC que cause cambios de fecha
- ✅ La fecha que ve el usuario es la fecha real de su ubicación

### **Ejemplo**
Si un usuario en México (UTC-6) abre el formulario el **12 de mayo de 2026 a las 15:00**:
- ✅ **Correcto**: Muestra "12/05/2026"
- ❌ **Incorrecto (UTC)**: Mostraría "12/05/2026" o "13/05/2026" dependiendo de la hora

---

## 🛠️ Utilidades de Fecha

Se creó el archivo `src/lib/utils/date-utils.ts` con funciones para manejo de fechas:

### **Funciones Principales**

#### 1. **getLocalDate()**
Obtiene la fecha actual en formato YYYY-MM-DD
```typescript
import { getLocalDate } from "@/lib/utils/date-utils";

const today = getLocalDate(); // "2026-05-12"
```

#### 2. **formatDateES()**
Formatea una fecha en formato dd/mm/aaaa (español)
```typescript
import { formatDateES } from "@/lib/utils/date-utils";

const formatted = formatDateES("2026-05-12"); // "12/05/2026"
```

#### 3. **getDaysDifference()**
Calcula la diferencia en días entre dos fechas
```typescript
import { getDaysDifference } from "@/lib/utils/date-utils";

const days = getDaysDifference("2026-05-01", "2026-05-12"); // 11
```

#### 4. **formatDateTimeES()**
Formatea fecha y hora en formato dd/mm/aaaa HH:mm
```typescript
import { formatDateTimeES } from "@/lib/utils/date-utils";

const formatted = formatDateTimeES(new Date()); // "12/05/2026 15:30"
```

#### 5. **formatRelativeTime()**
Formatea tiempo relativo (hace X días, hace X horas)
```typescript
import { formatRelativeTime } from "@/lib/utils/date-utils";

const relative = formatRelativeTime(new Date(Date.now() - 3600000)); // "hace 1 hora"
```

---

## 📋 Uso en el Formulario

### **Fecha Actual**
```typescript
import { getLocalDate } from "@/lib/utils/date-utils";

const [formData, setFormData] = useState({
  fecha: getLocalDate(), // Fecha actual en zona horaria local
});
```

### **Mostrar Fecha Formateada**
```typescript
import { formatDateES } from "@/lib/utils/date-utils";

<input
  type="text"
  value={formatDateES(formData.fecha)} // "12/05/2026"
  readOnly
/>
```

### **Calcular Duración**
```typescript
import { getDaysDifference } from "@/lib/utils/date-utils";

useEffect(() => {
  if (formData.fechaInicio && formData.fechaFin) {
    const days = getDaysDifference(formData.fechaInicio, formData.fechaFin);
    setFormData(prev => ({ 
      ...prev, 
      duracion: `${days} día${days !== 1 ? 's' : ''}` 
    }));
  }
}, [formData.fechaInicio, formData.fechaFin]);
```

---

## 🔧 Funciones Disponibles

| Función | Descripción | Ejemplo de Salida |
|---------|-------------|-------------------|
| `getLocalDate()` | Fecha actual YYYY-MM-DD | `"2026-05-12"` |
| `getLocalDateTime()` | Fecha y hora actual | `"2026-05-12 15:30:45"` |
| `formatDateES()` | Formato dd/mm/aaaa | `"12/05/2026"` |
| `formatDateTimeES()` | Formato dd/mm/aaaa HH:mm | `"12/05/2026 15:30"` |
| `formatDateLongES()` | Formato largo | `"12 de mayo de 2026"` |
| `getDaysDifference()` | Diferencia en días | `11` |
| `getLocalTime()` | Hora actual HH:mm | `"15:30"` |
| `getDayNameES()` | Nombre del día | `"lunes"` |
| `getMonthNameES()` | Nombre del mes | `"mayo"` |
| `formatRelativeTime()` | Tiempo relativo | `"hace 2 horas"` |
| `isValidDate()` | Validar fecha | `true/false` |
| `utcToLocalDate()` | UTC a local | `"2026-05-12"` |

---

## 📊 Ejemplos de Uso

### **Dashboard - Última Conexión**
```typescript
import { formatRelativeTime } from "@/lib/utils/date-utils";

<p>Última conexión: {formatRelativeTime(user.lastLoginAt)}</p>
// "Última conexión: hace 2 horas"
```

### **Lista de Peticiones - Fecha de Creación**
```typescript
import { formatDateES } from "@/lib/utils/date-utils";

<td>{formatDateES(request.createdAt)}</td>
// "12/05/2026"
```

### **Detalles - Fecha Completa**
```typescript
import { formatDateLongES } from "@/lib/utils/date-utils";

<p>Creado el {formatDateLongES(request.createdAt)}</p>
// "Creado el 12 de mayo de 2026"
```

---

## ⚠️ Consideraciones Importantes

### **1. Almacenamiento en Base de Datos**
- Las fechas se guardan en formato **YYYY-MM-DD** o **ISO 8601**
- La base de datos puede usar UTC, pero la conversión se hace en el servidor
- El usuario siempre ve fechas en su zona horaria local

### **2. Campos de Fecha en Formularios**
```typescript
// ✅ Correcto - Usar getLocalDate()
fecha: getLocalDate()

// ❌ Incorrecto - Usar toISOString() causa problemas de zona horaria
fecha: new Date().toISOString().split('T')[0]
```

### **3. Comparación de Fechas**
```typescript
// ✅ Correcto - Usar getDaysDifference()
const days = getDaysDifference(startDate, endDate);

// ✅ También correcto para comparar
const start = new Date(startDate + 'T00:00:00');
const end = new Date(endDate + 'T00:00:00');
```

---

## 🌐 Soporte de Idiomas

Todas las funciones usan **español de México (es-MX)** por defecto:
- Formato de fecha: dd/mm/aaaa
- Nombres de días: lunes, martes, miércoles...
- Nombres de meses: enero, febrero, marzo...

---

## 📝 Migración de Código Existente

### **Antes**
```typescript
// ❌ Problema: Usa UTC
const today = new Date().toISOString().split('T')[0];
const formatted = new Date(date).toLocaleDateString('es-MX');
```

### **Después**
```typescript
// ✅ Solución: Usa zona horaria local
import { getLocalDate, formatDateES } from "@/lib/utils/date-utils";

const today = getLocalDate();
const formatted = formatDateES(date);
```

---

## 🔍 Debugging

Si ves fechas incorrectas:

1. **Verificar que se use `getLocalDate()`** en lugar de `toISOString()`
2. **Agregar 'T00:00:00'** al crear Date desde string:
   ```typescript
   // ✅ Correcto
   new Date(dateString + 'T00:00:00')
   
   // ❌ Incorrecto (puede cambiar de día)
   new Date(dateString)
   ```
3. **Usar las utilidades** en lugar de manipulación manual de fechas

---

## ✅ Beneficios

- ✅ **Consistencia**: Todas las fechas usan la misma lógica
- ✅ **Sin bugs de zona horaria**: No más fechas que cambian de día
- ✅ **Fácil mantenimiento**: Funciones centralizadas
- ✅ **Localización**: Formato español automático
- ✅ **Reutilizable**: Importar y usar en cualquier componente

---

## 📚 Recursos

- **Archivo de utilidades**: `src/lib/utils/date-utils.ts`
- **Ejemplo de uso**: `src/app/(portal)/requests/training/new/page.tsx`
- **Documentación MDN**: [Date](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Date)

---

## 🆘 Soporte

Si necesitas agregar nuevas funciones de fecha o tienes problemas con zonas horarias, consulta este documento o modifica `date-utils.ts`.
