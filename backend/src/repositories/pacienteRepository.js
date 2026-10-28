import { getDb } from '../db/connection.js';
import { escapeLike } from '../core/text.js';

export const pacienteRepository = {
  findAll({ q, dni, nombre, telefono, correo, estado }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    // Búsqueda en tiempo real (coincidencia parcial en DNI, nombre o apellido)
    if (q) {
      conditions.push(`(
        dni LIKE '%' || ? || '%' ESCAPE '\\' OR
        normalizar(nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\' OR
        normalizar(apellido) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'
      )`);
      const escapedQ = escapeLike(q);
      params.push(escapedQ, escapedQ, escapedQ);
    }

    if (dni) {
      conditions.push("dni LIKE '%' || ? || '%' ESCAPE '\\'");
      params.push(escapeLike(dni));
    }
    if (nombre) {
      conditions.push("(normalizar(nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\' OR normalizar(apellido) LIKE '%' || normalizar(?) || '%' ESCAPE '\\')");
      params.push(escapeLike(nombre), escapeLike(nombre));
    }
    if (telefono) {
      conditions.push("telefono LIKE '%' || ? || '%' ESCAPE '\\'");
      params.push(escapeLike(telefono));
    }
    if (correo) {
      conditions.push("normalizar(correo) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(correo));
    }
    if (estado !== undefined && estado !== 'todos') {
      conditions.push('estado = ?');
      params.push(Number(estado));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado
      FROM paciente
      ${where}
      ORDER BY apellido ASC, nombre ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado
      FROM paciente
      WHERE id_paciente = ?
    `).get(id);
  },

  findByDni(dni, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare('SELECT id_paciente, dni, estado FROM paciente WHERE dni = ? AND id_paciente <> ?').get(dni, excludeId);
    }
    return db.prepare('SELECT id_paciente, dni, estado FROM paciente WHERE dni = ?').get(dni);
  },

  create({ dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social }) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO paciente (dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      dni,
      nombre,
      apellido,
      telefono || null,
      correo,
      fecha_nacimiento || null,
      obra_social || null
    );

    return result.lastInsertRowid;
  },

  update(id, { dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social }) {
    const db = getDb();
    db.prepare(`
      UPDATE paciente
      SET dni = ?, nombre = ?, apellido = ?, telefono = ?, correo = ?, fecha_nacimiento = ?, obra_social = ?
      WHERE id_paciente = ?
    `).run(
      dni,
      nombre,
      apellido,
      telefono || null,
      correo,
      fecha_nacimiento || null,
      obra_social || null,
      id
    );
  },

  setEstado(id, estado) {
    const db = getDb();
    db.prepare('UPDATE paciente SET estado = ? WHERE id_paciente = ?').run(estado, id);
  },

  countActiveFutureTurnos(id_paciente, fechaActual) {
    const db = getDb();
    const row = db.prepare(`
      SELECT COUNT(*) as total
      FROM turno
      WHERE id_paciente = ?
        AND fecha >= ?
        AND estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_CONSULTORIO')
    `).get(id_paciente, fechaActual);
    return row.total;
  }
};
