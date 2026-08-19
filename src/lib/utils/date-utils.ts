/**
 * Utilidades para manejo de fechas en zona horaria local del sistema
 * 
 * Todas las funciones usan la zona horaria del navegador/sistema del usuario
 * en lugar de UTC para evitar problemas de conversión de fechas.
 */

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en zona horaria local
 */
export function getLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha y hora actual en formato YYYY-MM-DD HH:mm:ss en zona horaria local
 */
export function getLocalDateTime(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formatea una fecha en formato dd/mm/aaaa (español)
 */
export function formatDateES(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatea una fecha y hora en formato dd/mm/aaaa HH:mm (español)
 */
export function formatDateTimeES(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea una fecha en formato largo (español)
 * Ejemplo: "12 de mayo de 2026"
 */
export function formatDateLongES(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function getDaysDifference(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Convierte una fecha UTC a fecha local en formato YYYY-MM-DD
 */
export function utcToLocalDate(utcDate: Date | string): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return getLocalDate(date);
}

/**
 * Obtiene la hora actual en formato HH:mm
 */
export function getLocalTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Verifica si una fecha es válida
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Obtiene el nombre del día de la semana en español
 */
export function getDayNameES(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('es-MX', { weekday: 'long' });
}

/**
 * Obtiene el nombre del mes en español
 */
export function getMonthNameES(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('es-MX', { month: 'long' });
}

/**
 * Formatea una fecha relativa (hace X días, hace X horas, etc.)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  if (diffDay < 7) return `hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
  if (diffDay < 30) return `hace ${Math.floor(diffDay / 7)} semana${Math.floor(diffDay / 7) > 1 ? 's' : ''}`;
  if (diffDay < 365) return `hace ${Math.floor(diffDay / 30)} mes${Math.floor(diffDay / 30) > 1 ? 'es' : ''}`;
  return `hace ${Math.floor(diffDay / 365)} año${Math.floor(diffDay / 365) > 1 ? 's' : ''}`;
}
