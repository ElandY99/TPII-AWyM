/**
 * Utilidades de manipulación y normalización de texto.
 */

/**
 * Normaliza un texto: elimina tildes/acentos, convierte a minúsculas y recorta espacios extremos.
 * @param {string|null|undefined} str
 * @returns {string}
 */
export function normalizar(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Genera la clave única de un consultorio:
 * Normaliza y elimina TODOS los espacios internos.
 * Ejemplo: "Consultorio 1" -> "consultorio1" === "consultorio1" (D-18)
 * @param {string|null|undefined} str
 * @returns {string|null}
 */
export function claveConsultorio(str) {
  if (!str) return null;
  const norm = normalizar(str).replace(/\s+/g, '');
  return norm.length > 0 ? norm : null;
}

/**
 * Escapa caracteres comodín para búsquedas seguras con LIKE (... ESCAPE '\').
 * @param {string} str
 * @returns {string}
 */
export function escapeLike(str) {
  if (!str) return '';
  return String(str).replace(/([%_\\])/g, '\\$1');
}
