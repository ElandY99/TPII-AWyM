import { turnoRepository } from '../repositories/turnoRepository.js';
import { pacienteRepository } from '../repositories/pacienteRepository.js';
import { profesionalRepository } from '../repositories/profesionalRepository.js';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../core/errors.js';
import { auditService } from './auditService.js';
import { getDb } from '../db/connection.js';
import { getNowInArgentina, getDiaSemana, horaToMinutos, minutosToHora, compareDateTime } from '../core/time.js';

export const turnoService = {
  /**
   * Ejecuta el pase automático a AUSENTE si pasaron 30 min desde el inicio (Q2 / D-30).
   * Se invoca de forma perezosa en consultas/escrituras para garantizar consistencia.
   */
  marcarAusentes() {
    const { fecha, hora } = getNowInArgentina();
    // hora actual menos 30 minutos
    const minActual = horaToMinutos(hora);
    const limiteMin = minActual - 30;

    let limiteFecha = fecha;
    let limiteHoraStr = minutosToHora(Math.max(0, limiteMin));

    if (limiteMin < 0) {
      // Cruzó medianoche: calcular fecha del día anterior
      const [y, m, d] = fecha.split('-').map(Number);
      const prevDay = new Date(Date.UTC(y, m - 1, d - 1));
      limiteFecha = prevDay.toISOString().slice(0, 10);
      limiteHoraStr = minutosToHora(1440 + limiteMin);
    }

    const fechaHoraLimite = `${limiteFecha} ${limiteHoraStr}`;
    const ausentes = turnoRepository.marcarTurnosAusentesAutomaticos(fechaHoraLimite);

    for (const t of ausentes) {
      auditService.log({
        id_usuario: null, // Acción automática del sistema
        accion: 'CAMBIAR_ESTADO',
        entidad: 'TURNO',
        id_entidad: t.id_turno,
        antes: { estado: t.estado },
        despues: { estado: 'AUSENTE', motivo: 'Pase automático por transcurso de 30 minutos sin cambio' }
      });
    }
  },

  list(filters = {}, user) {
    this.marcarAusentes();
    const scope = user.rol === 'PROFESIONAL' ? user.id_profesional : null;
    return turnoRepository.findAll({ ...filters, id_profesional_scope: scope });
  },

  getById(id, user) {
    this.marcarAusentes();
    const turno = turnoRepository.findById(id);
    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }
    // Si es PROFESIONAL, solo puede consultar sus propios turnos (D-02)
    if (user.rol === 'PROFESIONAL' && turno.id_profesional !== user.id_profesional) {
      throw new NotFoundError('Turno no encontrado');
    }
    return turno;
  },

  /**
   * Asignar nuevo turno (CU-03, RFB-40, D-26, D-27, D-28).
   * Estado inicial: PENDIENTE.
   */
  create(data, user) {
    this.marcarAusentes();

    // 1. Validar que el paciente exista y esté activo
    const paciente = pacienteRepository.findById(data.id_paciente);
    if (!paciente || !paciente.estado) {
      throw new ValidationError('El paciente no existe o está inactivo.', {
        id_paciente: 'Paciente inexistente o inactivo'
      });
    }

    // 2. Validar que el profesional exista, esté activo y tenga consultorio asignado
    const profesional = profesionalRepository.findById(data.id_profesional);
    if (!profesional || !profesional.estado) {
      throw new ValidationError('El profesional no existe o está inactivo.', {
        id_profesional: 'Profesional inexistente o inactivo'
      });
    }
    if (!profesional.consultorio) {
      throw new ValidationError('El profesional no tiene consultorio fijo asignado.', {
        id_profesional: 'Profesional sin consultorio asignado'
      });
    }

    // 3. No permitir turnos en fechas/horas pasadas (D-26)
    const { fecha: hoy, hora: horaActual } = getNowInArgentina();
    if (compareDateTime(data.fecha, data.hora, hoy, horaActual) <= 0) {
      throw new ValidationError('No se pueden asignar turnos para fechas u horarios pasados.', {
        fecha: 'Fecha u horario anterior al momento actual'
      });
    }

    // 4. Validar que el horario caiga dentro de la disponibilidad configurada del profesional
    const diaSemanaTurno = getDiaSemana(data.fecha);
    const disponibilidad = profesionalRepository.getDisponibilidad(data.id_profesional);
    const turnoMin = horaToMinutos(data.hora);

    const estaEnDisponibilidad = disponibilidad.some((f) => {
      if (f.dia_semana !== diaSemanaTurno) return false;
      const ini = horaToMinutos(f.hora_inicio);
      const fin = horaToMinutos(f.hora_fin);
      return turnoMin >= ini && turnoMin + 30 <= fin;
    });

    if (!estaEnDisponibilidad) {
      throw new ValidationError('El horario seleccionado se encuentra fuera de la agenda de atención del profesional.', {
        hora: 'Horario fuera de disponibilidad'
      });
    }

    // 5. Validar que el profesional no tenga otro turno activo en ese horario
    const conflictProf = turnoRepository.findConflictTurnoProfesional(data.id_profesional, data.fecha, data.hora);
    if (conflictProf) {
      throw new ConflictError('El horario dejó de estar disponible. Seleccione otro.');
    }

    // 6. Validar que el paciente no tenga otro turno activo en ese mismo horario (D-27)
    const conflictPac = turnoRepository.findConflictTurnoPaciente(data.id_paciente, data.fecha, data.hora);
    if (conflictPac) {
      throw new ConflictError('El paciente ya posee otro turno asignado en la misma fecha y horario.');
    }

    const db = getDb();
    let newId;

    const tx = db.transaction(() => {
      newId = turnoRepository.create({
        ...data,
        creado_por: user.id
      });

      auditService.log({
        id_usuario: user.id,
        accion: 'CREAR',
        entidad: 'TURNO',
        id_entidad: Number(newId),
        despues: { id: newId, ...data, estado: 'PENDIENTE' }
      });
    });

    tx();
    return this.getById(newId, user);
  },

  /**
   * Modificación de turno (Q11 / D-33).
   * - Profesional, fecha, hora, motivo: modificables mientras el turno esté PENDIENTE o CONFIRMADO y antes de iniciar.
   * - Observaciones: modificable mientras el turno esté EN_CONSULTORIO (por Recepción/Admin o el médico asignado).
   * - Estados finales (ASISTIDO, AUSENTE, CANCELADO): no permiten modificaciones.
   * - Paciente: no modificable jamás.
   */
  update(id, data, user) {
    this.marcarAusentes();
    const current = this.getById(id, user);

    if (['ASISTIDO', 'AUSENTE', 'CANCELADO'].includes(current.estado)) {
      throw new ConflictError(`Un turno en estado ${current.estado} no puede ser modificado.`);
    }

    const { fecha: hoy, hora: horaActual } = getNowInArgentina();
    const yaInicio = compareDateTime(current.fecha, current.hora, hoy, horaActual) <= 0;

    const fieldsToUpdate = {};

    // Caso 1: Observaciones durante la consulta (EN_CONSULTORIO)
    if (data.observaciones !== undefined) {
      if (current.estado !== 'EN_CONSULTORIO') {
        throw new ValidationError('Las observaciones de consulta solo pueden registrarse mientras el turno esté En Consultorio.');
      }
      fieldsToUpdate.observaciones = data.observaciones;
    }

    // Caso 2: Reprogramación (profesional, fecha, hora, motivo)
    const intentaReprogramar = data.id_profesional !== undefined || data.fecha !== undefined || data.hora !== undefined || data.motivo_consulta !== undefined;
    if (intentaReprogramar) {
      if (user.rol === 'PROFESIONAL') {
        throw new ForbiddenError('Los profesionales no pueden reprogramar turnos.');
      }
      if (!['PENDIENTE', 'CONFIRMADO'].includes(current.estado) || yaInicio) {
        throw new ConflictError('Solo se pueden reprogramar o cambiar los datos del turno antes de su inicio.');
      }

      const targetProf = data.id_profesional || current.id_profesional;
      const targetFecha = data.fecha || current.fecha;
      const targetHora = data.hora || current.hora;

      // Si cambia fecha/hora/profesional, validar disponibilidad y solapamiento
      if (targetProf !== current.id_profesional || targetFecha !== current.fecha || targetHora !== current.hora) {
        if (compareDateTime(targetFecha, targetHora, hoy, horaActual) <= 0) {
          throw new ValidationError('La nueva fecha y horario no pueden ser anteriores al momento actual.');
        }

        const profesional = profesionalRepository.findById(targetProf);
        if (!profesional || !profesional.estado) {
          throw new ValidationError('El profesional seleccionado no existe o está inactivo.');
        }

        const diaSemana = getDiaSemana(targetFecha);
        const disp = profesionalRepository.getDisponibilidad(targetProf);
        const tMin = horaToMinutos(targetHora);

        const cubre = disp.some((f) => {
          if (f.dia_semana !== diaSemana) return false;
          const ini = horaToMinutos(f.hora_inicio);
          const fin = horaToMinutos(f.hora_fin);
          return tMin >= ini && tMin + 30 <= fin;
        });

        if (!cubre) {
          throw new ValidationError('El horario solicitado no se encuentra dentro de la disponibilidad del profesional.');
        }

        const confProf = turnoRepository.findConflictTurnoProfesional(targetProf, targetFecha, targetHora, id);
        if (confProf) {
          throw new ConflictError('El nuevo horario seleccionado no está disponible.');
        }

        const confPac = turnoRepository.findConflictTurnoPaciente(current.id_paciente, targetFecha, targetHora, id);
        if (confPac) {
          throw new ConflictError('El paciente ya posee otro turno en la nueva fecha y horario solicitado.');
        }

        fieldsToUpdate.id_profesional = targetProf;
        fieldsToUpdate.fecha = targetFecha;
        fieldsToUpdate.hora = targetHora;
      }

      if (data.motivo_consulta !== undefined) {
        fieldsToUpdate.motivo_consulta = data.motivo_consulta;
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return current;
    }

    const db = getDb();
    const tx = db.transaction(() => {
      turnoRepository.update(id, fieldsToUpdate);
      auditService.log({
        id_usuario: user.id,
        accion: 'MODIFICAR',
        entidad: 'TURNO',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...fieldsToUpdate }
      });
    });

    tx();
    return this.getById(id, user);
  },

  /**
   * Transición de estado (Q1, CU-06, D-03, D-04, D-32).
   * Matriz de transiciones:
   * PENDIENTE -> CONFIRMADO | CANCELADO
   * CONFIRMADO -> EN_CONSULTORIO | AUSENTE | CANCELADO
   * EN_CONSULTORIO -> ASISTIDO
   * ASISTIDO / AUSENTE / CANCELADO: finales
   */
  cambiarEstado(id, nuevoEstado, user) {
    this.marcarAusentes();
    const current = this.getById(id, user);

    // Cancelar turno: solo Recepción y Admin (D-04)
    if (nuevoEstado === 'CANCELADO' && user.rol === 'PROFESIONAL') {
      throw new ForbiddenError('Los profesionales médicos no pueden cancelar turnos directamente.');
    }

    // Validar transición según la tabla de Q1
    const allowedTransitions = {
      PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
      CONFIRMADO: ['EN_CONSULTORIO', 'AUSENTE', 'CANCELADO'],
      EN_CONSULTORIO: ['ASISTIDO'],
      ASISTIDO: [],
      AUSENTE: [],
      CANCELADO: []
    };

    const validNextStates = allowedTransitions[current.estado] || [];
    if (!validNextStates.includes(nuevoEstado)) {
      throw new ConflictError(
        `Transición no permitida: no se puede pasar un turno de estado '${current.estado}' a '${nuevoEstado}'.`
      );
    }

    const extraFields = {};
    const { fecha: hoy, hora: horaActual, fechaHora } = getNowInArgentina();

    // Regla de registro de llegada a EN_CONSULTORIO (CU-06, D-32):
    // Solo turnos del día actual y dentro de su franja horaria de media hora [hora, hora+30)
    if (nuevoEstado === 'EN_CONSULTORIO') {
      if (current.fecha !== hoy) {
        throw new ValidationError('La llegada del paciente solo puede registrarse para turnos del día actual.');
      }
      const tMin = horaToMinutos(current.hora);
      const actMin = horaToMinutos(horaActual);
      if (actMin < tMin || actMin >= tMin + 30) {
        throw new ValidationError('La llegada del paciente solo puede registrarse durante la franja horaria correspondiente al turno.');
      }
      extraFields.fecha_hora_llegada = fechaHora;
    }

    if (nuevoEstado === 'CANCELADO') {
      extraFields.cancelado_por = user.id;
      extraFields.fecha_cancelacion = fechaHora;
    }

    const db = getDb();
    const tx = db.transaction(() => {
      turnoRepository.setEstado(id, nuevoEstado, extraFields);
      auditService.log({
        id_usuario: user.id,
        accion: 'CAMBIAR_ESTADO',
        entidad: 'TURNO',
        id_entidad: id,
        antes: { estado: current.estado },
        despues: { estado: nuevoEstado, ...extraFields }
      });
    });

    tx();
    return this.getById(id, user);
  },

  /**
   * Cancelar turno (equivalente a cambiar estado a CANCELADO).
   */
  cancelar(id, user) {
    return this.cambiarEstado(id, 'CANCELADO', user);
  },

  /**
   * Horarios libres para una fecha y profesional/especialidad (RF-06, CU-03, Q5).
   */
  getHorariosLibres({ fecha, id_profesional, id_especialidad }) {
    this.marcarAusentes();
    const db = getDb();

    // Obtener lista de profesionales a evaluar
    let docs = [];
    if (id_profesional) {
      const p = profesionalRepository.findById(id_profesional);
      if (p && p.estado && p.consultorio) docs = [p];
    } else if (id_especialidad) {
      docs = db.prepare(`
        SELECT id_profesional, nombre, apellido, consultorio
        FROM profesional
        WHERE id_especialidad = ? AND estado = 1 AND consultorio IS NOT NULL
      `).all(id_especialidad);
    }

    const { fecha: hoy, hora: horaActual } = getNowInArgentina();
    const esHoy = fecha === hoy;
    const minActual = horaToMinutos(horaActual);
    const diaSemana = getDiaSemana(fecha);

    const resultado = [];

    for (const doc of docs) {
      const franjas = profesionalRepository.getDisponibilidad(doc.id_profesional);
      const turnosOcupados = db.prepare(`
        SELECT hora FROM turno
        WHERE id_profesional = ? AND fecha = ? AND estado <> 'CANCELADO'
      `).all(doc.id_profesional, fecha).map(t => t.hora);

      const slotsLibres = [];

      for (const f of franjas) {
        if (f.dia_semana !== diaSemana) continue;

        let slot = horaToMinutos(f.hora_inicio);
        const fin = horaToMinutos(f.hora_fin);

        while (slot + 30 <= fin) {
          const slotHoraStr = minutosToHora(slot);

          // Si es hoy, no ofrecer horarios que ya pasaron
          const yaPaso = esHoy && slot <= minActual;
          const ocupado = turnosOcupados.includes(slotHoraStr);

          if (!yaPaso && !ocupado) {
            slotsLibres.push(slotHoraStr);
          }
          slot += 30;
        }
      }

      if (slotsLibres.length > 0) {
        resultado.push({
          id_profesional: doc.id_profesional,
          profesional: `${doc.nombre} ${doc.apellido}`,
          consultorio: doc.consultorio,
          horarios: slotsLibres
        });
      }
    }

    return resultado;
  }
};
