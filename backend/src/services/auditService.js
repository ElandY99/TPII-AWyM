import { getDb } from '../db/connection.js';

/**
 * Servicio centralizado de auditoría y trazabilidad (D-41).
 */
export const auditService = {
  /**
   * Registra una acción de auditoría en la base de datos dentro de la transacción activa.
   * @param {object} param0
   * @param {number|null} [param0.id_usuario] Usuario que ejecuta o null si es el SISTEMA
   * @param {string} param0.accion CREAR, MODIFICAR, CAMBIAR_ESTADO, etc.
   * @param {string} param0.entidad USUARIO, PACIENTE, TURNO, etc.
   * @param {number|null} [param0.id_entidad] ID del registro afectado
   * @param {object|null} [param0.antes] Estado previo (se eliminan campos sensibles como clave_hash)
   * @param {object|null} [param0.despues] Estado posterior
   */
  log({ id_usuario = null, accion, entidad, id_entidad = null, antes = null, despues = null }) {
    try {
      const db = getDb();

      // Sanitizar datos para no registrar nunca hashes de contraseñas (RNFB-01)
      const sanitize = (data) => {
        if (!data || typeof data !== 'object') return data;
        const copy = { ...data };
        delete copy.clave_hash;
        delete copy.clave;
        delete copy.clave_nueva;
        delete copy.clave_actual;
        return copy;
      };

      const antesJson = antes ? JSON.stringify(sanitize(antes)) : null;
      const despuesJson = despues ? JSON.stringify(sanitize(despues)) : null;

      db.prepare(`
        INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, datos_antes, datos_despues)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id_usuario, accion, entidad, id_entidad, antesJson, despuesJson);
    } catch (err) {
      console.error('[Auditoría Error]', err);
    }
  }
};
