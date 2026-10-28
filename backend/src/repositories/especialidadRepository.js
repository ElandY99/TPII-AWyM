import { getDb } from '../db/connection.js';
import { escapeLike } from '../core/text.js';

export const especialidadRepository = {
  findAll({ nombre, estado }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (nombre) {
      conditions.push("normalizar(nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(nombre));
    }

    if (estado !== undefined && estado !== 'todos') {
      conditions.push('estado = ?');
      params.push(Number(estado));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id_especialidad, nombre, descripcion, estado
      FROM especialidad
      ${where}
      ORDER BY nombre ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT id_especialidad, nombre, descripcion, estado
      FROM especialidad
      WHERE id_especialidad = ?
    `).get(id);
  },

  findByNombre(nombre, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare(`
        SELECT id_especialidad, nombre, estado
        FROM especialidad
        WHERE normalizar(nombre) = normalizar(?) AND id_especialidad <> ?
      `).get(nombre, excludeId);
    }
    return db.prepare(`
      SELECT id_especialidad, nombre, estado
      FROM especialidad
      WHERE normalizar(nombre) = normalizar(?)
    `).get(nombre);
  },

  create({ nombre, descripcion }) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO especialidad (nombre, descripcion, estado)
      VALUES (?, ?, 1)
    `).run(nombre, descripcion || null);

    return result.lastInsertRowid;
  },

  update(id, { nombre, descripcion }) {
    const db = getDb();
    db.prepare(`
      UPDATE especialidad
      SET nombre = ?, descripcion = ?
      WHERE id_especialidad = ?
    `).run(nombre, descripcion || null, id);
  },

  setEstado(id, estado) {
    const db = getDb();
    db.prepare(`
      UPDATE especialidad
      SET estado = ?
      WHERE id_especialidad = ?
    `).run(estado, id);
  },

  countActiveProfesionales(idEspecialidad) {
    const db = getDb();
    const row = db.prepare(`
      SELECT COUNT(*) as total
      FROM profesional
      WHERE id_especialidad = ? AND estado = 1
    `).get(idEspecialidad);
    return row.total;
  }
};
