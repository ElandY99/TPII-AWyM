import * as seed from './seed.js';
import {
  ESTADOS,
  aMinutos,
  diaSemanaISO,
  hoyISO,
  minutosAMinutos,
  sumarDias
} from './format.js';

const TRANSICIONES = {
  PENDIENTE: ['CONFIRMADO', 'CANCELADO', 'AUSENTE'],
  CONFIRMADO: ['EN_CONSULTORIO', 'CANCELADO', 'AUSENTE'],
  EN_CONSULTORIO: ['ASISTIDO', 'AUSENTE'],
  ASISTIDO: [],
  AUSENTE: [],
  CANCELADO: []
};

export class ErrorNegocio extends Error {
  constructor(codigo, mensaje, detalle = {}) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.codigo = codigo;
    this.detalle = detalle;
  }
}

let datos = null;

function estado() {
  if (!datos) datos = seed.obtener();
  return datos;
}

function siguienteId(prefijo, coleccion) {
  const maximo = coleccion.reduce((mayor, item) => {
    const numero = Number(String(item.id).replace(/\D/g, ''));
    return Number.isFinite(numero) && numero > mayor ? numero : mayor;
  }, 0);
  return `${prefijo}-${String(maximo + 1).padStart(2, '0')}`;
}

function limpiarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : valor;
}

export function cargar() {
  return seed.cargar().then((cargado) => {
    datos = cargado;
    return datos;
  });
}

export function restablecer() {
  return seed.restablecer().then((cargado) => {
    datos = cargado;
    return datos;
  });
}

export function profesionales() {
  return estado().profesionales.filter((p) => p.activo);
}

export function todosLosProfesionales() {
  return estado().profesionales;
}

export function especialidades() {
  return estado().especialidades;
}

export function usuarioPorCorreo(correo) {
  const normalizado = limpiarTexto(correo).toLowerCase();
  return estado().usuarios.find((u) => u.correo.toLowerCase() === normalizado) ?? null;
}

export function profesionalPorId(id) {
  return estado().profesionales.find((p) => p.id === id) ?? null;
}

export function especialidadPorId(id) {
  return estado().especialidades.find((e) => e.id === id) ?? null;
}

export function profesionalesPorEspecialidad(especialidadId) {
  return profesionales().filter((p) => p.especialidadId === especialidadId);
}

export function pacientes({ texto = '', soloActivos = true } = {}) {
  const filtro = limpiarTexto(texto).toLowerCase();
  return estado().pacientes
    .filter((p) => (soloActivos ? p.activo !== false : true))
    .filter((p) => {
      if (!filtro) return true;
      return `${p.dni} ${p.nombre} ${p.apellido} ${p.correo}`.toLowerCase().includes(filtro);
    })
    .sort((a, b) => a.apellido.localeCompare(b.apellido, 'es'));
}

export function pacientePorId(id) {
  return estado().pacientes.find((p) => p.id === id) ?? null;
}

export function pacientePorDni(dni) {
  const normalizado = String(dni ?? '').trim();
  return estado().pacientes.find((p) => p.dni === normalizado) ?? null;
}

export function buscarPacientes(texto, limite = 8) {
  const filtro = limpiarTexto(texto).toLowerCase();
  if (filtro.length < 2) return [];
  return pacientes({ texto: filtro }).slice(0, limite);
}

export function altaPaciente(datos) {
  const actual = estado();
  const dni = String(datos.dni ?? '').trim();

  if (actual.pacientes.some((p) => p.dni === dni)) {
    throw new ErrorNegocio(
      'DNI_DUPLICADO',
      'El DNI ingresado ya se encuentra registrado en el sistema.',
      { campo: 'dni' }
    );
  }

  const paciente = {
    id: siguienteId('PAC', actual.pacientes),
    dni,
    nombre: limpiarTexto(datos.nombre),
    apellido: limpiarTexto(datos.apellido),
    fechaNacimiento: limpiarTexto(datos.fechaNacimiento),
    telefono: String(datos.telefono ?? '').replace(/\D/g, ''),
    correo: limpiarTexto(datos.correo).toLowerCase(),
    obraSocial: limpiarTexto(datos.obraSocial),
    activo: true
  };

  actual.pacientes.push(paciente);
  seed.guardar();
  return paciente;
}

export function disponibilidadDe(profesionalId, fecha) {
  const dia = diaSemanaISO(fecha);
  return estado().disponibilidad
    .filter((d) => d.profesionalId === profesionalId && d.activo)
    .filter((d) => d.diaSemana === dia)
    .sort((a, b) => aMinutos(a.horaInicio) - aMinutos(b.horaInicio));
}

export function tieneAgenda(profesionalId) {
  return estado().disponibilidad.some((d) => d.profesionalId === profesionalId && d.activo);
}

function turnosDelProfesional(profesionalId, fecha) {
  return estado().turnos.filter(
    (t) => t.profesionalId === profesionalId && t.fecha === fecha && t.estado !== 'CANCELADO'
  );
}

function generarSlots(profesionalId, fecha) {
  const bloques = disponibilidadDe(profesionalId, fecha);
  if (bloques.length === 0) return [];

  const ocupados = turnosDelProfesional(profesionalId, fecha);
  const slots = [];

  for (const bloque of bloques) {
    const inicio = aMinutos(bloque.horaInicio);
    const fin = aMinutos(bloque.horaFin);
    for (let minuto = inicio; minuto + bloque.duracionMin <= fin; minuto += bloque.duracionMin) {
      const turno = ocupados.find((t) => aMinutos(t.hora) === minuto);
      slots.push({
        hora: minutosAMinutos(minuto),
        duracionMin: bloque.duracionMin,
        libre: !turno,
        turno: turno ?? null
      });
    }
  }

  return slots;
}

export function slotsDe(profesionalId, fecha) {
  return generarSlots(profesionalId, fecha);
}

export function horariosLibres(profesionalId, fecha) {
  return generarSlots(profesionalId, fecha)
    .filter((s) => s.libre)
    .map((s) => s.hora);
}

export function agendaDe(profesionalId, fecha) {
  const slots = generarSlots(profesionalId, fecha);
  return {
    profesionalId,
    fecha,
    slots,
    libres: slots.filter((s) => s.libre).length,
    ocupados: slots.filter((s) => !s.libre).length,
    tieneAgenda: tieneAgenda(profesionalId),
    configurada: slots.length > 0
  };
}

export function horariosReservados(profesionalId, fecha, hora) {
  return turnosDelProfesional(profesionalId, fecha).some((t) => t.hora === hora);
}

export function turnoOcupado(profesionalId, fecha, hora, ignorarId = null) {
  return turnosDelProfesional(profesionalId, fecha).find(
    (t) => t.hora === hora && t.id !== ignorarId
  ) ?? null;
}

function turnosOrdenados(turnos) {
  return [...turnos].sort((a, b) =>
    a.fecha === b.fecha
      ? aMinutos(a.hora) - aMinutos(b.hora)
      : a.fecha.localeCompare(b.fecha)
  );
}

function enrich(turno) {
  if (!turno) return null;
  const paciente = pacientePorId(turno.pacienteId);
  const profesional = profesionalPorId(turno.profesionalId);
  const especialidad = profesional ? especialidadPorId(profesional.especialidadId) : null;
  return { ...turno, paciente, profesional, especialidad };
}

export function turnos(filtros = {}) {
  const {
    profesionalId = null,
    especialidadId = null,
    pacienteId = null,
    desde = null,
    hasta = null,
    estados = null
  } = filtros;

  return turnosOrdenados(
    estado()
      .turnos.filter((t) => {
        if (profesionalId && t.profesionalId !== profesionalId) return false;
        if (pacienteId && t.pacienteId !== pacienteId) return false;
        if (especialidadId) {
          const profesional = profesionalPorId(t.profesionalId);
          if (!profesional || profesional.especialidadId !== especialidadId) return false;
        }
        if (desde && t.fecha < desde) return false;
        if (hasta && t.fecha > hasta) return false;
        if (estados && !estados.includes(t.estado)) return false;
        return true;
      })
      .map(enrich)
  );
}

export function turnoPorId(id) {
  return enrich(estado().turnos.find((t) => t.id === id));
}

export function turnosDeHoy(filtros = {}) {
  return turnos({ ...filtros, desde: hoyISO(), hasta: hoyISO() });
}

export function proximosTurnos(cantidad = 5, filtros = {}) {
  const hoy = hoyISO();
  const futuros = turnos(filtros).filter(
    (t) =>
      t.fecha > hoy ||
      (t.fecha === hoy && t.estado !== 'CANCELADO' && t.estado !== 'ASISTIDO')
  );
  return futuros.slice(0, cantidad);
}

export function crearTurno(datos) {
  const actual = estado();
  const profesional = profesionalPorId(datos.profesionalId);
  const paciente = pacientePorId(datos.pacienteId);

  if (!paciente || paciente.activo === false) {
    throw new ErrorNegocio('PACIENTE_INVALIDO', 'El paciente seleccionado no está activo.', {
      campo: 'pacienteId'
    });
  }
  if (!profesional || !profesional.activo) {
    throw new ErrorNegocio('PROFESIONAL_INVALIDO', 'El profesional seleccionado no está activo.', {
      campo: 'profesionalId'
    });
  }

  const slots = generarSlots(profesional.id, datos.fecha);
  if (slots.length === 0) {
    throw new ErrorNegocio(
      'SIN_DISPONIBILIDAD',
      'El profesional no atiende en la fecha seleccionada.',
      { campo: 'fecha' }
    );
  }

  const slot = slots.find((s) => s.hora === datos.hora);
  if (!slot) {
    throw new ErrorNegocio(
      'FUERA_DE_DISPONIBILIDAD',
      'El horario seleccionado está fuera de la disponibilidad configurada.',
      { campo: 'hora' }
    );
  }

  if (turnoOcupado(profesional.id, datos.fecha, datos.hora)) {
    throw new ErrorNegocio(
      'HORARIO_OCUPADO',
      'El horario seleccionado acaba de ser tomado. Volvé a elegir un horario libre.',
      { campo: 'hora' }
    );
  }

  const estadoInicial = ESTADOS.includes(datos.estado) ? datos.estado : 'PENDIENTE';

  const turno = {
    id: siguienteId('TUR', actual.turnos),
    pacienteId: paciente.id,
    profesionalId: profesional.id,
    fecha: datos.fecha,
    hora: datos.hora,
    duracionMin: slot.duracionMin,
    estado: estadoInicial,
    motivo: limpiarTexto(datos.motivo) ?? ''
  };

  actual.turnos.push(turno);
  seed.guardar();
  return enrich(turno);
}

export function transicionesPermitidas(estadoActual) {
  return TRANSICIONES[estadoActual] ?? [];
}

export function puedeCambiarEstado(turnoId, nuevoEstado) {
  const turno = estado().turnos.find((t) => t.id === turnoId);
  if (!turno) return false;
  return transicionesPermitidas(turno.estado).includes(nuevoEstado);
}

export function cambiarEstado(turnoId, nuevoEstado) {
  const turno = estado().turnos.find((t) => t.id === turnoId);
  if (!turno) {
    throw new ErrorNegocio('TURNO_INEXISTENTE', 'El turno solicitado no existe.');
  }
  if (!ESTADOS.includes(nuevoEstado)) {
    throw new ErrorNegocio('ESTADO_INVALIDO', 'El estado indicado no es válido.');
  }
  if (nuevoEstado === turno.estado) return enrich(turno);
  if (!puedeCambiarEstado(turnoId, nuevoEstado)) {
    throw new ErrorNegocio(
      'TRANSICION_INVALIDA',
      `Un turno en estado "${turno.estado}" no puede pasar a "${nuevoEstado}".`
    );
  }
  turno.estado = nuevoEstado;
  seed.guardar();
  return enrich(turno);
}

export function indicadores(filtros = {}) {
  const todos = turnos(filtros);
  const porEstado = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
  for (const turno of todos) porEstado[turno.estado] += 1;

  const vigentes = todos.filter((t) => t.estado !== 'CANCELADO');
  const sinCerrar = todos.filter(
    (t) => t.estado === 'PENDIENTE' || t.estado === 'CONFIRMADO'
  );

  return {
    total: todos.length,
    porEstado,
    vigentes: vigentes.length,
    sinCerrar: sinCerrar.length,
    cancelados: porEstado.CANCELADO,
    atendidos: porEstado.ASISTIDO,
    ausentes: porEstado.AUSENTE
  };
}

export function ocupacionDe(profesionalId, fecha) {
  return agendaDe(profesionalId, fecha);
}

export function semanaDe(referencia = hoyISO()) {
  const dia = diaSemanaISO(referencia);
  const lunes = sumarDias(referencia, 1 - dia);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}
