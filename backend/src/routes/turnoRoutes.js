import { Router } from 'express';
import { turnoController } from '../controllers/turnoController.js';
import { validate } from '../middleware/validate.js';
import {
  turnoIdParamSchema,
  turnoCreateSchema,
  turnoUpdateSchema,
  turnoCambioEstadoSchema,
  turnoFilterSchema,
  turnosDisponiblesQuerySchema
} from '../schemas/turnoSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const turnoRouter = Router();

turnoRouter.use(requireAuth);

// Horarios disponibles (RF-06, CU-03)
turnoRouter.get(
  '/disponibles',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ query: turnosDisponiblesQuerySchema }),
  turnoController.getDisponibles
);

// Listado de turnos con filtros (RF-12, CU-04, HU-15)
turnoRouter.get(
  '/',
  validate({ query: turnoFilterSchema }),
  turnoController.list
);

turnoRouter.get(
  '/:id',
  validate({ params: turnoIdParamSchema }),
  turnoController.getById
);

// Alta de turno (CU-03, RF-08): Administrador y Recepcionista
turnoRouter.post(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ body: turnoCreateSchema }),
  turnoController.create
);

// Modificación de turno (RF-09, Q11): Administrador, Recepcionista y Profesional (observaciones)
turnoRouter.put(
  '/:id',
  validate({ params: turnoIdParamSchema, body: turnoUpdateSchema }),
  turnoController.update
);

// Cambio de estado (RF-11, Q1): Administrador, Recepcionista y Profesional
turnoRouter.patch(
  '/:id/estado',
  validate({ params: turnoIdParamSchema, body: turnoCambioEstadoSchema }),
  turnoController.cambiarEstado
);

// Cancelación de turno (RF-10, Q1, D-04): Administrador y Recepcionista
turnoRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ params: turnoIdParamSchema }),
  turnoController.cancelar
);
