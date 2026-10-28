import { AppError } from './errors.js';

/**
 * Middleware central de manejo de errores de Express 5.
 */
export function errorHandler(err, req, res, next) {
  // Manejo de errores de AppError conocidos
  if (err instanceof AppError) {
    const response = { error: err.message };
    if (err.campos) {
      response.campos = err.campos;
    }
    return res.status(err.statusCode).json(response);
  }

  // Manejo de errores de restricciones de SQLite (better-sqlite3)
  if (err && typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
    if (err.message.includes('ux_turno_slot_profesional') || err.message.includes('ux_turno_slot_paciente')) {
      return res.status(409).json({
        error: 'El horario dejó de estar disponible. Seleccione otro.'
      });
    }
    if (err.message.includes('ux_profesional_consultorio_clave')) {
      return res.status(409).json({
        error: 'El consultorio ingresado ya se encuentra asignado a otro profesional.',
        campos: { consultorio: 'Ya asignado' }
      });
    }
    if (err.message.includes('uq_usuario_correo')) {
      return res.status(409).json({
        error: 'El correo electrónico ya se encuentra registrado.',
        campos: { correo: 'Ya registrado' }
      });
    }
    if (err.message.includes('uq_paciente_dni')) {
      return res.status(409).json({
        error: 'El DNI ingresado ya se encuentra registrado en el sistema.',
        campos: { dni: 'Ya registrado' }
      });
    }
    if (err.message.includes('uq_profesional_matricula')) {
      return res.status(409).json({
        error: 'La matrícula ya se encuentra registrada en el sistema.',
        campos: { matricula: 'Ya registrada' }
      });
    }
    if (err.message.includes('uq_especialidad_nombre')) {
      return res.status(409).json({
        error: 'El nombre de la especialidad ya se encuentra registrado.',
        campos: { nombre: 'Ya registrado' }
      });
    }

    return res.status(409).json({
      error: 'Restricción de integridad o unicidad no superada.'
    });
  }

  // Error inesperado: loggear detalle internamente, pero no exponer trazas al cliente (RNFB-06)
  console.error('[Error no controlado]', err);
  return res.status(500).json({
    error: 'Error interno del servidor. Comuníquese con el administrador.'
  });
}
