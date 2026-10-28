import { getDb } from '../db/connection.js';
import { escapeLike } from '../core/text.js';

export const turnoRepository = {
  findAll({ fecha, hora, paciente, profesional, estado, id_profesional_scope }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    // Si el usuario autenticado es PROFESIONAL, se restringe estrictamente a sus turnos (D-02, CA-15.3)
    if (id_profesional_scope) {
      conditions.push('t.id_profesional = ?');
      params.push(id_profesional_scope);
    } else if (profesional) {
      conditions.push('(normalizar(pr.nombre) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\' OR normalizar(pr.apellido) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\')');
      params.push(escapeLike(profesional), escapeLike(profesional));
    }

    if (fecha) {
      conditions.push('t.fecha = ?');
      params.push(fecha);
    }
    if (hora) {
      conditions.push('t.hora = ?');
      params.push(hora);
    }
    if (paciente) {
      conditions.push('(pa.dni LIKE \'%\' || ? || \'%\' ESCAPE \'\\\' OR normalizar(pa.nombre) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\' OR normalizar(pa.apellido) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\')');
      const escPac = escapeLike(paciente);
      params.push(escPac, escPac, escPac);
    }
    if (estado !== undefined && estado !== 'todos') {
      conditions.push('t.estado = ?');
      params.push(estado);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        t.id_turno, t.fecha, t.hora, t.estado, t.motivo_consulta, t.observaciones,
        t.fecha_creacion, t.fecha_hora_llegada, t.fecha_cancelacion,
        pa.id_paciente, pa.dni AS paciente_dni, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido, pa.telefono AS paciente_telefono, pa.correo AS paciente_correo,
        pr.id_profesional, pr.matricula AS profesional_matricula, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido, pr.consultorio AS consultorio,
        e.id_especialidad, e.nombre AS especialidad_nombre
      FROM turno t
      JOIN paciente pa ON t.id_paciente = pa.id_paciente
      JOIN profesional pr ON t.id_profesional = pr.id_profesional
      JOIN especialidad e ON pr.id_especialidad = e.id_especialidad
      ${where}
      ORDER BY t.fecha ASC, t.hora ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT 
        t.id_turno, t.id_paciente, t.id_profesional, t.fecha, t.hora, t.estado,
        t.motivo_consulta, t.observaciones, t.fecha_creacion, t.fecha_hora_llegada,
        t.creado_por, t.cancelado_por, t.fecha_cancelacion,
        pa.dni AS paciente_dni, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
        pr.matricula AS profesional_matricula, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido, pr.consultorio AS consultorio,
        e.nombre AS especialidad_nombre
      FROM turno t
      JOIN paciente pa ON t.id_paciente = pa.id_paciente
      JOIN profesional pr ON t.id_profesional = pr.id_profesional
      JOIN especialidad e ON pr.id_especialidad = e.id_especialidad
      WHERE t.id_turno = ?
    `).get(id);
  },

  create({ id_paciente, id_profesional, fecha, hora, motivo_consulta, observaciones, creado_por }) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO turno (id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, creado_por)
      VALUES (?, ?, ?, ?, 'PENDIENTE', ?, ?, ?)
    `).run(
      id_paciente,
      id_profesional,
      fecha,
      hora,
      motivo_consulta || null,
      observaciones || null,
      creado_por
    );

    return result.lastInsertRowid;
  },

  update(id, fields) {
    const db = getDb();
    const sets = [];
    const params = [];

    for (const [key, value] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
    params.push(id);

    db.prepare(`
      UPDATE turno
      SET ${sets.join(', ')}
      WHERE id_turno = ?
    `).run(...params);
  },

  setEstado(id, estado, extraFields = {}) {
    const db = getDb();
    const sets = ['estado = ?'];
    const params = [estado];

    for (const [k, v] of Object.entries(extraFields)) {
      sets.push(`${k} = ?`);
      params.push(v);
    }
    params.push(id);

    db.prepare(`
      UPDATE turno
      SET ${sets.join(', ')}
      WHERE id_turno = ?
    `).run(...params);
  },

  findConflictTurnoProfesional(id_profesional, fecha, hora, excludeTurnoId = null) {
    const db = getDb();
    if (excludeTurnoId) {
      return db.prepare(`
        SELECT id_turno FROM turno
        WHERE id_profesional = ? AND fecha = ? AND hora = ? AND estado <> 'CANCELADO' AND id_turno <> ?
      `).get(id_profesional, fecha, hora, excludeTurnoId);
    }
    return db.prepare(`
      SELECT id_turno FROM turno
      WHERE id_profesional = ? AND fecha = ? AND hora = ? AND estado <> 'CANCELADO'
    `).get(id_profesional, fecha, hora);
  },

  findConflictTurnoPaciente(id_paciente, fecha, hora, excludeTurnoId = null) {
    const db = getDb();
    if (excludeTurnoId) {
      return db.prepare(`
        SELECT id_turno FROM turno
        WHERE id_paciente = ? AND fecha = ? AND hora = ? AND estado <> 'CANCELADO' AND id_turno <> ?
      `).get(id_paciente, fecha, hora, excludeTurnoId);
    }
    return db.prepare(`
      SELECT id_turno FROM turno
      WHERE id_paciente = ? AND fecha = ? AND hora = ? AND estado <> 'CANCELADO'
    `).get(id_paciente, fecha, hora);
  },

  // Turnos expirados para pase automático a AUSENTE (Q2 / D-30)
  // Aplica a turnos en PENDIENTE o CONFIRMADO cuando pasaron >= 30 minutos desde el inicio
  marcarTurnosAusentesAutomaticos(fechaHoraLimite) {
    const db = getDb();
    const turnosParaAusente = db.prepare(`
      SELECT id_turno, id_paciente, id_profesional, fecha, hora, estado
      FROM turno
      WHERE estado IN ('PENDIENTE', 'CONFIRMADO')
        AND (fecha || ' ' || hora) <= ?
    `).all(fechaHoraLimite);

    if (turnosParaAusente.length === 0) return [];

    const ids = turnosParaAusente.map(t => t.id_turno);
    const placeholders = ids.map(() => '?').join(',');

    db.prepare(`
      UPDATE turno
      SET estado = 'AUSENTE'
      WHERE id_turno IN (${placeholders})
    `).run(...ids);

    return turnosParaAusente;
  }
};
