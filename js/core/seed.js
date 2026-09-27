import { diaSemanaISO, hoyISO, sumarDias } from './format.js';

const CLAVE = 'sgm.state.v1';

const ARCHIVOS = {
  usuarios: '../data/usuarios.json',
  especialidades: '../data/especialidades.json',
  profesionales: '../data/profesionales.json',
  disponibilidad: '../data/disponibilidad.json',
  pacientes: '../data/pacientes.json',
  turnos: '../data/turnos.json'
};

let estado = null;
let promesaCarga = null;

function resolverFecha(diaSemana, desplazamiento = 0) {
  const hoy = hoyISO();
  const hoySemana = diaSemanaISO(hoy);
  const delta = (diaSemana - hoySemana + 7) % 7;
  return sumarDias(hoy, desplazamiento === 0 ? delta : delta - 7);
}

function duracionDe(disponibilidad, profesionalId, fecha) {
  const dia = diaSemanaISO(fecha);
  const bloque = disponibilidad.find(
    (d) => d.profesionalId === profesionalId && d.diaSemana === dia && d.activo
  );
  return bloque ? bloque.duracionMin : 30;
}

function prepararTurnos(turnosCrudos, disponibilidad) {
  const vistos = new Set();
  return turnosCrudos.map((turno) => {
    const fecha = resolverFecha(turno.diaSemana, turno.desplazamiento);
    const clave = `${turno.profesionalId}|${fecha}|${turno.hora}`;
    if (vistos.has(clave)) {
      throw new Error(`Dato de prueba inconsistente: turno duplicado ${clave}`);
    }
    vistos.add(clave);
    const { diaSemana, desplazamiento, ...resto } = turno;
    return {
      ...resto,
      fecha,
      duracionMin: duracionDe(disponibilidad, turno.profesionalId, fecha)
    };
  });
}

function leer(clave) {
  return fetch(ARCHIVOS[clave], { cache: 'no-store' }).then((respuesta) => {
    if (!respuesta.ok) {
      throw new Error(
        `No se pudo cargar ${ARCHIVOS[clave]} (HTTP ${respuesta.status}). ` +
          'Verificá que el sitio se este sirviendo con un servidor local.'
      );
    }
    return respuesta.json();
  });
}

function sembrar() {
  return Promise.all(Object.keys(ARCHIVOS).map(leer)).then(
    ([usuarios, especialidades, profesionales, disponibilidad, pacientes, turnos]) => ({
      usuarios,
      especialidades,
      profesionales,
      disponibilidad,
      pacientes,
      turnos: prepararTurnos(turnos, disponibilidad),
      sembradoEn: new Date().toISOString()
    })
  );
}

function persistir() {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch (error) {
    console.warn('No se pudo guardar el estado de prueba en sessionStorage.', error);
  }
}

export function cargar() {
  if (estado) return Promise.resolve(estado);
  if (promesaCarga) return promesaCarga;

  const guardado = sessionStorage.getItem(CLAVE);
  if (guardado) {
    try {
      estado = JSON.parse(guardado);
      return Promise.resolve(estado);
    } catch {
      sessionStorage.removeItem(CLAVE);
    }
  }

  promesaCarga = sembrar()
    .then((nuevo) => {
      estado = nuevo;
      persistir();
      return estado;
    })
    .catch((error) => {
      promesaCarga = null;
      throw error;
    });

  return promesaCarga;
}

export function obtener() {
  if (!estado) {
    throw new Error('El store no fue inicializado. Llamá a cargar() primero.');
  }
  return estado;
}

export function guardar() {
  persistir();
  return estado;
}

export function restablecer() {
  sessionStorage.removeItem(CLAVE);
  estado = null;
  promesaCarga = null;
  return cargar();
}

export function estaSembrado() {
  return Boolean(estado);
}
