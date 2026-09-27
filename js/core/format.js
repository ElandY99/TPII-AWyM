const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGOS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export const ESTADOS = [
  'PENDIENTE',
  'CONFIRMADO',
  'EN_CONSULTORIO',
  'ASISTIDO',
  'AUSENTE',
  'CANCELADO'
];

export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPCION: 'RECEPCION',
  PROFESIONAL: 'PROFESIONAL',
  PACIENTE: 'PACIENTE'
};

export const ETIQUETA_ESTADO = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  EN_CONSULTORIO: 'En consultorio',
  ASISTIDO: 'Asistido',
  AUSENTE: 'Ausente',
  CANCELADO: 'Cancelado'
};

export const ETIQUETA_ROL = {
  ADMIN: 'Administrador',
  RECEPCION: 'Recepcionista',
  PROFESIONAL: 'Profesional médico',
  PACIENTE: 'Paciente'
};

function partes(fechaISO) {
  const [anio, mes, dia] = String(fechaISO).split('-').map(Number);
  return { anio, mes, dia };
}

export function hoyISO() {
  return aISO(new Date());
}

export function aISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function desdeISO(fechaISO) {
  const { anio, mes, dia } = partes(fechaISO);
  return new Date(anio, mes - 1, dia);
}

export function sumarDias(fechaISO, dias) {
  const fecha = desdeISO(fechaISO);
  fecha.setDate(fecha.getDate() + dias);
  return aISO(fecha);
}

/** Día de la semana en formato ISO: 1 = lunes ... 7 = domingo. */
export function diaSemanaISO(fechaISO) {
  const dia = desdeISO(fechaISO).getDay();
  return dia === 0 ? 7 : dia;
}

export function nombreDia(fechaISO, largo = false) {
  const indice = diaSemanaISO(fechaISO) - 1;
  return largo ? DIAS_LARGOS[indice] : DIAS_CORTOS[indice];
}

/** "12/04/1990" */
export function fechaCorta(fechaISO) {
  if (!fechaISO) return '—';
  const { anio, mes, dia } = partes(fechaISO);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
}

/** "sábado, 12 de abril de 2026" */
export function fechaLarga(fechaISO) {
  if (!fechaISO) return '—';
  const { anio, mes, dia } = partes(fechaISO);
  return `${nombreDia(fechaISO, true)}, ${dia} de ${MESES[mes - 1]} de ${anio}`;
}

/** "hoy", "mañana", "en 3 días" o la fecha corta si está fuera de rango. */
export function fechaRelativa(fechaISO) {
  const dias = diffDias(hoyISO(), fechaISO);
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias === -1) return 'ayer';
  if (dias > 1 && dias <= 7) return `en ${dias} días`;
  if (dias < -1 && dias >= -7) return `hace ${Math.abs(dias)} días`;
  return fechaCorta(fechaISO);
}

export function diffDias(fechaA, fechaB) {
  const ms = desdeISO(fechaB).getTime() - desdeISO(fechaA).getTime();
  return Math.round(ms / 86400000);
}

export function minutosAMinutos(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function aMinutos(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
}

export function nombreCompleto(persona) {
  if (!persona) return '—';
  return `${persona.nombre} ${persona.apellido}`.trim();
}

export function iniciales(persona) {
  if (!persona) return '—';
  const letras = `${persona.nombre ?? ''}${persona.apellido ?? ''}`.replace(/\s/g, '');
  return (letras.charAt(0) + (letras.charAt(1) || '')).toUpperCase();
}
