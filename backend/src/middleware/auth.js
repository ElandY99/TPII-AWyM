import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';
import { parseCookies } from '../core/cookies.js';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../core/errors.js';

/**
 * Middleware que verifica la sesión activa del usuario a través de cookie HttpOnly.
 * Vincula a req.user los datos esenciales del usuario autenticado.
 */
export function requireAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[config.cookieName];

  if (!token) {
    return next(new UnauthorizedError('Sesión no iniciada o inválida'));
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const db = getDb();

  const row = db.prepare(`
    SELECT 
      s.id_sesion,
      u.id_usuario,
      u.nombre,
      u.apellido,
      u.correo,
      u.rol,
      u.estado,
      p.id_profesional
    FROM sesion s
    JOIN usuario u ON s.id_usuario = u.id_usuario
    LEFT JOIN profesional p ON p.id_usuario = u.id_usuario AND p.estado = 1
    WHERE s.id_sesion = ?
  `).get(tokenHash);

  if (!row || !row.estado) {
    // Si la sesión no existe o el usuario está inactivo, rechazar
    return next(new UnauthorizedError('Sesión no válida o usuario inactivo'));
  }

  // Actualizar última actividad
  try {
    db.prepare(`
      UPDATE sesion 
      SET ultima_actividad = DATETIME('now', 'localtime') 
      WHERE id_sesion = ?
    `).run(tokenHash);
  } catch {
    // Ignorar fallo no crítico de actualización de timestamp
  }

  req.user = {
    id: row.id_usuario,
    nombre: row.nombre,
    apellido: row.apellido,
    correo: row.correo,
    rol: row.rol,
    id_profesional: row.id_profesional || null
  };

  next();
}
