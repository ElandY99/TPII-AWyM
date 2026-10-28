import { ForbiddenError, UnauthorizedError } from '../core/errors.js';

/**
 * Middleware de autorización por rol.
 * Si el usuario es ADMINISTRADOR, tiene permiso irrestricto (superusuario D-05).
 * @param  {...string} rolesPermitidos Roles que pueden acceder
 */
export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuario no autenticado'));
    }

    if (req.user.rol === 'ADMINISTRADOR') {
      return next();
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(new ForbiddenError('No posee los permisos necesarios para realizar esta acción'));
    }

    next();
  };
}
