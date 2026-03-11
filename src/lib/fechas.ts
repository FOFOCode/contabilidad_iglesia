/**
 * Utilidades de fecha para la zona horaria de El Salvador (UTC-6)
 * El Salvador no tiene horario de verano, siempre es UTC-6
 */

/**
 * Obtiene la fecha y hora actual ajustada a la zona horaria de El Salvador (UTC-6)
 * @returns Date object representando la hora actual en El Salvador
 */
export function obtenerFechaElSalvador(): Date {
  const ahora = new Date();
  // Obtener el offset local en minutos
  const offsetLocal = ahora.getTimezoneOffset(); // minutos desde UTC (positivo si estás al oeste de UTC)
  const offsetElSalvador = 6 * 60; // 6 horas = 360 minutos

  // Calcular la diferencia entre la zona local y El Salvador
  // y ajustar el tiempo para que represente la hora de El Salvador
  const tiempoElSalvador =
    ahora.getTime() - (offsetLocal + offsetElSalvador) * 60 * 1000;
  return new Date(tiempoElSalvador + offsetLocal * 60 * 1000);
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD para inputs de tipo date
 * Usa la zona horaria de El Salvador
 * @returns string en formato "YYYY-MM-DD"
 */
export function obtenerFechaHoyElSalvador(): string {
  const fecha = obtenerFechaElSalvador();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el año actual según la zona horaria de El Salvador
 * @returns number del año actual
 */
export function obtenerAnioElSalvador(): number {
  return obtenerFechaElSalvador().getFullYear();
}

/**
 * Obtiene el mes actual (1-12) según la zona horaria de El Salvador
 * @returns number del mes actual (1 = enero, 12 = diciembre)
 */
export function obtenerMesElSalvador(): number {
  return obtenerFechaElSalvador().getMonth() + 1;
}

/**
 * Convierte un string de fecha (YYYY-MM-DD) a un Date con hora al mediodía
 * para evitar problemas de zona horaria
 * @param fechaString - Fecha en formato "YYYY-MM-DD"
 * @returns Date object a las 12:00:00 del día especificado
 */
export function parsearFechaLocal(fechaString: string): Date {
  const [year, month, day] = fechaString.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formatea una fecha para mostrar en formato legible español
 * @param fecha - Date object o string de fecha
 * @returns string formateado como "2 de enero de 2026"
 */
export function formatearFechaLarga(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formatea una fecha para mostrar de forma corta
 * @param fecha - Date object o string de fecha
 * @returns string formateado como "02/01/2026"
 */
export function formatearFechaCorta(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-SV");
}
