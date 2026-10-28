/**
 * Jerarquía de errores del dominio para el backend de Salud Turnos.
 */

export class AppError extends Error {
  /**
   * @param {string} message Mensaje para el usuario
   * @param {number} statusCode Código HTTP (400, 401, 403, 404, 409, 500)
   * @param {Record<string, string|string[]>} [campos] Mapa opcional de errores por campo
   */
  constructor(message, statusCode = 400, campos = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.campos = campos;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos', campos = {}) {
    super(message, 400, campos);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso no autorizado para este rol') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso', campos = undefined) {
    super(message, 409, campos);
  }
}
