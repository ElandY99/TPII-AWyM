import { getDb } from '../db/connection.js';
import { escapeLike, claveConsultorio } from '../core/text.js';

export const profesionalRepository = {
  findAll({ especialidad, nombre, estado }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (especialidad) {
      conditions.push("normalizar(e.nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(especialidad));
    }
    if (nombre) {
      conditions.push("(normalizar(p.nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\' OR normalizar(p.apellido) LIKE '%' || normalizar(?) || '%' ESCAPE '\\')");
      params.push(escapeLike(nombre), escapeLike(nombre));
    }
    if (estado !== undefined && estado !== 'todos') {
      conditions.push('p.estado = ?');
      params.push(Number(estado));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT p.id_profesional, p.id_especialidad, p.id_usuario, p.matricula,
             p.nombre, p.apellido, p.consultorio, p.estado,
             e.nombre AS especialidad_nombre,
             u.correo AS usuario_correo
      FROM profesional p
      JOIN especialidad e ON p.id_especialidad = e.id_especialidad
      LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
      ${where}
      ORDER BY p.apellido ASC, p.nombre ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT p.id_profesional, p.id_especialidad, p.id_usuario, p.matricula,
             p.nombre, p.apellido, p.consultorio, p.estado,
             e.nombre AS especialidad_nombre,
             u.correo AS usuario_correo
      FROM profesional p
      JOIN especialidad e ON p.id_especialidad = e.id_especialidad
      LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
      WHERE p.id_profesional = ?
    `).get(id);
  },

  findByMatricula(matricula, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare(`
        SELECT id_profesional, matricula FROM profesional WHERE matricula = ? AND id_profesional <> ?
      `).get(matricula, excludeId);
    }
    return db.prepare('SELECT id_profesional, matricula FROM profesional WHERE matricula = ?').get(matricula);
  },

  findByConsultorio(consultorio, excludeId = null) {
    const key = claveConsultorio(consultorio);
    if (!key) return null;
    const db = getDb();
    if (excludeId) {
      return db.prepare(`
        SELECT id_profesional, consultorio FROM profesional 
        WHERE consultorio_clave = ? AND id_profesional <> ? AND estado = 1
      `).get(key, excludeId);
    }
    return db.prepare(`
      SELECT id_profesional, consultorio FROM profesional 
      WHERE consultorio_clave = ? AND estado = 1
    `).get(key);
  },

  create({ id_especialidad, id_usuario, matricula, nombre, apellido, consultorio }) {
    const db = getDb();
    const key = claveConsultorio(consultorio);
    const result = db.prepare(`
      INSERT INTO profesional (id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, key);

    return result.lastInsertRowid;
  },

  update(id, { id_especialidad, matricula, consultorio }) {
    const db = getDb();
    const key = claveConsultorio(consultorio);
    db.prepare(`
      UPDATE profesional
      SET id_especialidad = ?, matricula = ?, consultorio = ?, consultorio_clave = ?
      WHERE id_profesional = ?
    `).run(id_especialidad, matricula, consultorio || null, key, id);
  },

  setEstado(id, estado) {
    const db = getDb();
    db.prepare('UPDATE profesional SET estado = ? WHERE id_profesional = ?').run(estado, id);
  },

  // Turnos futuros activos (PENDIENTE, CONFIRMADO, EN_CONSULTORIO)
  countActiveFutureTurnos(id_profesional, fechaActual) {
    const db = getDb();
    const row = db.prepare(`
      SELECT COUNT(*) as total
      FROM turno
      WHERE id_profesional = ?
        AND fecha >= ?
        AND estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_CONSULTORIO')
    `).get(id_profesional, fechaActual);
    return row.total;
  },

  // Disponibilidad
  getDisponibilidad(id_profesional) {
    const db = getDb();
    return db.prepare(`
      SELECT id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado
      FROM disponibilidad
      WHERE id_profesional = ? AND estado = 1
      ORDER BY 
        CASE dia_semana
          WHEN 'LUNES' THEN 1
          WHEN 'MARTES' THEN 2
          WHEN 'MIERCOLES' THEN 3
          WHEN 'JUEVES' THEN 4
          WHEN 'VIERNES' THEN 5
          WHEN 'SABADO' THEN 6
          WHEN 'DOMINGO' THEN 7
        END,
        hora_inicio ASC
    `).all(id_profesional);
  },

  setDisponibilidad(id_profesional, franjas) {
    const db = getDb();
    // Eliminar franjas actuales y reinsertar
    db.prepare('DELETE FROM disponibilidad WHERE id_profesional = ?').run(id_profesional);
    const insert = db.prepare(`
      INSERT INTO disponibilidad (id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado)
      VALUES (?, ?, ?, ?, 30, 1)
    `);

    for (const f of franjas) {
      insert.run(id_profesional, f.dia_semana, f.hora_inicio, f.hora_fin);
    }
  },

  clearDisponibilidad(id_profesional) {
    const db = getDb();
    db.prepare('DELETE FROM disponibilidad WHERE id_profesional = ?').run(id_profesional);
  }
};
