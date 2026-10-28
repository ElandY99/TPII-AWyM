import { ValidationError } from '../core/errors.js';

/**
 * Middleware de validación con Zod para req.body, req.params y req.query.
 * Los datos validados y transformados se asignan a req.valid.
 * @param {{ body?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny }} schemas
 */
export function validate(schemas) {
  return (req, res, next) => {
    req.valid = req.valid || {};
    const fieldErrors = {};

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        Object.assign(fieldErrors, result.error.flatten().fieldErrors);
      } else {
        req.valid.params = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        Object.assign(fieldErrors, result.error.flatten().fieldErrors);
      } else {
        req.valid.query = result.data;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        Object.assign(fieldErrors, result.error.flatten().fieldErrors);
      } else {
        req.valid.body = result.data;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      // Normalizar mensajes para que sean strings directos
      const campos = {};
      for (const [campo, errs] of Object.entries(fieldErrors)) {
        campos[campo] = Array.isArray(errs) ? errs[0] : String(errs);
      }
      return next(new ValidationError('Datos de entrada inválidos', campos));
    }

    next();
  };
}
