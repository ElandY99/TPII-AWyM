import { getDb } from '../db/connection.js';
import { profesionalRepository } from '../repositories/profesionalRepository.js';
import { turnoService } from './turnoService.js';
import { getDiaSemana, horaToMinutos, minutosToHora, getNowInArgentina } from '../core/time.js';
import { NotFoundError } from '../core/errors.js';

export const agendaService = {
  /**
   * Genera la grilla de agenda médica diaria o mensual (CU-04, D-38, Q9).
   * Diferencia visualmente horarios LIBRE y OCUPADO con detalle del turno.
   * Si es PROFESIONAL, se restringe estrictamente a su propia agenda (D-02, CA-17.2).
   */
  getAgenda({ id_profesional, id_especialidad, fecha, mes }, user) {
    turnoService.marcarAusentes();
    const db = getDb();

    // 1. Determinar profesional o profesionales a consultar
    let targetProfesionalId = id_profesional;
    if (user.rol === 'PROFESIONAL') {
      targetProfesionalId = user.id_profesional;
    }

    let docs = [];
    if (targetProfesionalId) {
      const p = profesionalRepository.findById(targetProfesionalId);
      if (!p) throw new NotFoundError('Profesional no encontrado');
      docs = [p];
    } else if (id_especialidad) {
      docs = db.prepare(`
        SELECT p.id_profesional, p.nombre, p.apellido, p.consultorio, p.estado, e.nombre AS especialidad_nombre
        FROM profesional p
        JOIN especialidad e ON p.id_especialidad = e.id_especialidad
        WHERE p.id_especialidad = ? AND p.estado = 1
      `).all(id_especialidad);
    } else {
      // Si no especificó profesional ni especialidad, traer profesionales activos
      docs = db.prepare(`
        SELECT p.id_profesional, p.nombre, p.apellido, p.consultorio, p.estado, e.nombre AS especialidad_nombre
        FROM profesional p
        JOIN especialidad e ON p.id_especialidad = e.id_especialidad
        WHERE p.estado = 1
      `).all();
    }

    // 2. Determinar rango de fechas (diario o mensual)
    const fechas = [];
    if (fecha) {
      fechas.push(fecha);
    } else if (mes) {
      const [y, m] = mes.split('-').map(Number);
      const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = String(day).padStart(2, '0');
        fechas.push(`${mes}-${dStr}`);
      }
    }

    const agenda = [];

    for (const doc of docs) {
      const franjas = profesionalRepository.getDisponibilidad(doc.id_profesional);
      const tieneAgenda = franjas.length > 0;

      const profItem = {
        id_profesional: doc.id_profesional,
        profesional: `${doc.nombre} ${doc.apellido}`,
        especialidad: doc.especialidad_nombre,
        consultorio: doc.consultorio,
        tiene_agenda: tieneAgenda,
        dias: []
      };

      if (!tieneAgenda) {
        profItem.mensaje = 'El profesional no posee agenda de atención activa configurada';
        agenda.push(profItem);
        continue;
      }

      for (const fDate of fechas) {
        const diaSemana = getDiaSemana(fDate);
        const franjasDelDia = franjas.filter(f => f.dia_semana === diaSemana);

        if (franjasDelDia.length === 0) {
          continue; // No atiende este día
        }

        // Consultar turnos programados en esa fecha para ese profesional
        const turnosDelDia = db.prepare(`
          SELECT 
            t.id_turno, t.hora, t.estado, t.motivo_consulta,
            pa.id_paciente, pa.dni AS paciente_dni, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido
          FROM turno t
          JOIN paciente pa ON t.id_paciente = pa.id_paciente
          WHERE t.id_profesional = ? AND t.fecha = ?
        `).all(doc.id_profesional, fDate);

        const slots = [];

        for (const franja of franjasDelDia) {
          let cursor = horaToMinutos(franja.hora_inicio);
          const fin = horaToMinutos(franja.hora_fin);

          while (cursor + 30 <= fin) {
            const horaStr = minutosToHora(cursor);
            // Buscar turno activo en este slot
            const turnoOcupado = turnosDelDia.find(t => t.hora === horaStr && t.estado !== 'CANCELADO');

            if (turnoOcupado) {
              slots.push({
                hora: horaStr,
                estado: 'OCUPADO',
                turno: {
                  id_turno: turnoOcupado.id_turno,
                  estado: turnoOcupado.estado,
                  motivo: turnoOcupado.motivo_consulta,
                  paciente: `${turnoOcupado.paciente_nombre} ${turnoOcupado.paciente_apellido}`,
                  paciente_dni: turnoOcupado.paciente_dni
                }
              });
            } else {
              slots.push({
                hora: horaStr,
                estado: 'LIBRE',
                turno: null
              });
            }

            cursor += 30;
          }
        }

        profItem.dias.push({
          fecha: fDate,
          dia_semana: diaSemana,
          slots
        });
      }

      agenda.push(profItem);
    }

    return agenda;
  },

  /**
   * Cálculo de métricas e indicadores para el Dashboard (RFB-57, D-39, Q8).
   * Período: fecha actual hasta +30 días.
   * Próximos turnos: primeros 5 ordenados cronológicamente desde el momento actual excluyendo CANCELADOS.
   */
  getDashboard(user) {
    turnoService.marcarAusentes();
    const db = getDb();
    const { fecha: hoy, hora: horaActual } = getNowInArgentina();

    // Fecha límite +30 días
    const [y, m, d] = hoy.split('-').map(Number);
    const dateMax = new Date(Date.UTC(y, m - 1, d + 30));
    const fechaLimite = dateMax.toISOString().slice(0, 10);

    // Filtro por profesional si el rol es PROFESIONAL
    const isDoc = user.rol === 'PROFESIONAL';
    const profFilter = isDoc ? 'AND t.id_profesional = ?' : '';
    const params = isDoc ? [hoy, fechaLimite, user.id_profesional] : [hoy, fechaLimite];

    // Contadores en la ventana [hoy, hoy+30]
    const turnosEnVentana = db.prepare(`
      SELECT t.estado, COUNT(*) as cantidad
      FROM turno t
      WHERE t.fecha >= ? AND t.fecha <= ? ${profFilter}
      GROUP BY t.estado
    `).all(...params);

    const por_estado = {
      PENDIENTE: 0,
      CONFIRMADO: 0,
      EN_CONSULTORIO: 0,
      ASISTIDO: 0,
      AUSENTE: 0,
      CANCELADO: 0
    };

    let total = 0;
    for (const r of turnosEnVentana) {
      if (por_estado[r.estado] !== undefined) {
        por_estado[r.estado] = r.cantidad;
      }
      total += r.cantidad;
    }

    // Próximos turnos: desde ahora en adelante, no cancelados, máx 5 (CA-18.2, Q8)
    const proximosParams = isDoc ? [hoy, hoy, horaActual, user.id_profesional] : [hoy, hoy, horaActual];
    const proximos = db.prepare(`
      SELECT 
        t.id_turno, t.fecha, t.hora, t.estado, t.motivo_consulta,
        pa.id_paciente, pa.dni AS paciente_dni, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
        pr.id_profesional, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido, pr.consultorio
      FROM turno t
      JOIN paciente pa ON t.id_paciente = pa.id_paciente
      JOIN profesional pr ON t.id_profesional = pr.id_profesional
      WHERE (t.fecha > ? OR (t.fecha = ? AND t.hora >= ?))
        AND t.estado <> 'CANCELADO'
        ${isDoc ? 'AND t.id_profesional = ?' : ''}
      ORDER BY t.fecha ASC, t.hora ASC
      LIMIT 5
    `).all(...proximosParams);

    return {
      ventana: {
        desde: hoy,
        hasta: fechaLimite
      },
      indicadores: {
        total,
        confirmados: por_estado.CONFIRMADO,
        cancelados: por_estado.CANCELADO,
        por_estado
      },
      proximos
    };
  }
};
