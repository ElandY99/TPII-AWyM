import { getDb } from '../db/connection.js';
import { escapeLike } from '../core/text.js';

export const userRepository = {
  findAll({ nombre, apellido, correo, rol, estado }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (nombre) {
      conditions.push("normalizar(nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(nombre));
    }
    if (apellido) {
      conditions.push("normalizar(apellido) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(apellido));
    }
    if (correo) {
      conditions.push("normalizar(correo) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(correo));
    }
    if (rol) {
      conditions.push('rol = ?');
      params.push(rol);
    }
    if (estado !== undefined && estado !== 'todos') {
      conditions.push('estado = ?');
      params.push(Number(estado));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id_usuario, nombre, apellido, correo, rol, estado, fecha_creacion
      FROM usuario
      ${where}
      ORDER BY id_usuario ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.rol, u.estado, u.fecha_creacion,
             p.id_profesional, p.matricula, p.consultorio, p.id_especialidad
      FROM usuario u
      LEFT JOIN profesional p ON p.id_usuario = u.id_usuario
      WHERE u.id_usuario = ?
    `).get(id);
  },

  findByCorreo(correo, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare(`
        SELECT id_usuario, correo, rol, estado
        FROM usuario
        WHERE normalizar(correo) = normalizar(?) AND id_usuario <> ?
      `).get(correo, excludeId);
    }
    return db.prepare(`
      SELECT id_usuario, correo, rol, estado
      FROM usuario
      WHERE normalizar(correo) = normalizar(?)
    `).get(correo);
  },

  create({ nombre, apellido, correo, clave_hash, rol }) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO usuario (nombre, apellido, correo, clave_hash, rol, estado)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(nombre, apellido, correo, clave_hash, rol);

    return result.lastInsertRowid;
  },

  update(id, { nombre, apellido, correo }) {
    const db = getDb();
    db.prepare(`
      UPDATE usuario
      SET nombre = ?, apellido = ?, correo = ?
      WHERE id_usuario = ?
    `).run(nombre, apellido, correo, id);
  },

  setEstado(id, estado) {
    const db = getDb();
    db.prepare(`
      UPDATE usuario
      SET estado = ?
      WHERE id_usuario = ?
    `).run(estado, id);
  },

  updateClave(id, clave_hash) {
    const db = getDb();
    db.prepare(`
      UPDATE usuario
      SET clave_hash = ?
      WHERE id_usuario = ?
    `).run(clave_hash, id);
  },

  deleteSessions(id_usuario) {
    const db = getDb();
    db.prepare('DELETE FROM sesion WHERE id_usuario = ?').run(id_usuario);
  }
};
