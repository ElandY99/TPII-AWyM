import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';
import { verifyPassword, hashPassword } from '../core/passwords.js';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../core/errors.js';
import { auditService } from './auditService.js';

export const authService = {
  /**
   * Inicia sesión validando credenciales y genera identificador de sesión.
   * Cierra automáticamente sesiones anteriores del mismo usuario (sesión única D-09).
   */
  async login(correo, clave) {
    const db = getDb();
    const user = db.prepare(`
      SELECT id_usuario, nombre, apellido, correo, clave_hash, rol, estado
      FROM usuario
      WHERE correo = ? COLLATE NOCASE
    `).get(correo);

    if (!user) {
      // Prevenir timing attack validando un hash dummy
      await verifyPassword('dummy', 'scrypt$16384$8$1$00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
      auditService.log({
        accion: 'LOGIN_FALLIDO',
        entidad: 'USUARIO',
        despues: { correo, motivo: 'Usuario no encontrado' }
      });
      throw new UnauthorizedError('Usuario o contraseña incorrectos');
    }

    const isValid = await verifyPassword(clave, user.clave_hash);
    if (!isValid) {
      auditService.log({
        id_usuario: user.id_usuario,
        accion: 'LOGIN_FALLIDO',
        entidad: 'USUARIO',
        id_entidad: user.id_usuario,
        despues: { correo, motivo: 'Contraseña incorrecta' }
      });
      throw new UnauthorizedError('Usuario o contraseña incorrectos');
    }

    if (!user.estado) {
      auditService.log({
        id_usuario: user.id_usuario,
        accion: 'LOGIN_RECHAZADO',
        entidad: 'USUARIO',
        id_entidad: user.id_usuario,
        despues: { motivo: 'Cuenta inactiva' }
      });
      throw new ForbiddenError('Acceso denegado. Comuníquese con el administrador del sistema');
    }

    // Generar token de sesión seguro
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Transacción: eliminar sesiones previas del usuario y registrar la nueva
    const createSession = db.transaction(() => {
      db.prepare('DELETE FROM sesion WHERE id_usuario = ?').run(user.id_usuario);
      db.prepare(`
        INSERT INTO sesion (id_sesion, id_usuario, fecha_creacion, ultima_actividad)
        VALUES (?, ?, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))
      `).run(tokenHash, user.id_usuario);

      auditService.log({
        id_usuario: user.id_usuario,
        accion: 'LOGIN',
        entidad: 'USUARIO',
        id_entidad: user.id_usuario,
        despues: { correo: user.correo, rol: user.rol }
      });
    });

    createSession();

    // Obtener si es profesional
    const profesional = db.prepare('SELECT id_profesional FROM profesional WHERE id_usuario = ? AND estado = 1').get(user.id_usuario);

    return {
      token,
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
        id_profesional: profesional ? profesional.id_profesional : null
      }
    };
  },

  /**
   * Cierra la sesión activa del usuario.
   */
  logout(token, id_usuario) {
    if (!token) return;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const db = getDb();

    db.prepare('DELETE FROM sesion WHERE id_sesion = ?').run(tokenHash);

    if (id_usuario) {
      auditService.log({
        id_usuario,
        accion: 'LOGOUT',
        entidad: 'USUARIO',
        id_entidad: id_usuario
      });
    }
  },

  /**
   * Permite al usuario autenticado cambiar su propia contraseña.
   */
  async changePassword(id_usuario, claveActual, claveNueva) {
    const db = getDb();
    const user = db.prepare('SELECT clave_hash FROM usuario WHERE id_usuario = ?').get(id_usuario);
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    const isValid = await verifyPassword(claveActual, user.clave_hash);
    if (!isValid) {
      throw new ValidationError('La contraseña actual no es correcta', {
        clave_actual: 'Contraseña actual incorrecta'
      });
    }

    const newHash = await hashPassword(claveNueva);
    db.prepare('UPDATE usuario SET clave_hash = ? WHERE id_usuario = ?').run(newHash, id_usuario);

    auditService.log({
      id_usuario,
      accion: 'CAMBIO_CLAVE',
      entidad: 'USUARIO',
      id_entidad: id_usuario
    });
  }
};
