import { config } from '../config/index.js';

const DIAS_MAP = {
  0: 'DOMINGO',
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO'
};

/**
 * Retorna la fecha y hora actual en zona horaria de Argentina (America/Argentina/Buenos_Aires).
 * @returns {{ fecha: string, hora: string, fechaHora: string, diaSemana: string }}
 */
export function getNowInArgentina() {
  const now = new Date();

  // YYYY-MM-DD
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  // HH:MM:SS
  const horaConSegundos = new Intl.DateTimeFormat('es-AR', {
    timeZone: config.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  const hora = horaConSegundos.slice(0, 5);

  // Determinar día de la semana en la zona horaria de Argentina
  // Creamos una fecha local a partir del string YYYY-MM-DD
  const [y, m, d] = fecha.split('-').map(Number);
  const localDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const diaSemana = DIAS_MAP[localDate.getUTCDay()];

  return {
    fecha,
    hora,
    fechaHora: `${fecha} ${horaConSegundos}`,
    diaSemana
  };
}

/**
 * Obtiene el nombre del día de la semana para una fecha dada (YYYY-MM-DD).
 * @param {string} fechaStr Formato YYYY-MM-DD
 * @returns {string} LUNES..DOMINGO
 */
export function getDiaSemana(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const localDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return DIAS_MAP[localDate.getUTCDay()];
}

/**
 * Convierte un horario HH:MM a minutos desde las 00:00.
 * @param {string} horaStr
 * @returns {number}
 */
export function horaToMinutos(horaStr) {
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convierte minutos desde las 00:00 a string HH:MM.
 * @param {number} minutos
 * @returns {string}
 */
export function minutosToHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Compara dos momentos fecha + hora (YYYY-MM-DD HH:MM).
 * @returns {number} Negativo si dt1 < dt2, 0 si son iguales, positivo si dt1 > dt2
 */
export function compareDateTime(fecha1, hora1, fecha2, hora2) {
  const dt1 = `${fecha1} ${hora1}`;
  const dt2 = `${fecha2} ${hora2}`;
  return dt1.localeCompare(dt2);
}
