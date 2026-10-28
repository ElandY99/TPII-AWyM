import { Router } from 'express';
import { pacienteController } from '../controllers/pacienteController.js';
import { validate } from '../middleware/validate.js';
import {
  pacienteIdParamSchema,
  pacienteCreateSchema,
  pacienteUpdateSchema,
  pacienteFilterSchema
} from '../schemas/pacienteSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const pacienteRouter = Router();

pacienteRouter.use(requireAuth);

// Lectura y Búsqueda: Administrador y Recepcionista (RF-03, HU-09)
pacienteRouter.get(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ query: pacienteFilterSchema }),
  pacienteController.list
);

pacienteRouter.get(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ params: pacienteIdParamSchema }),
  pacienteController.getById
);

// Alta y Modificación: Administrador y Recepcionista (CU-02, RF-03)
pacienteRouter.post(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ body: pacienteCreateSchema }),
  pacienteController.create
);

pacienteRouter.put(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ params: pacienteIdParamSchema, body: pacienteUpdateSchema }),
  pacienteController.update
);

// Desactivación y Reactivación: Solo Administrador (D-16)
pacienteRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: pacienteIdParamSchema }),
  pacienteController.deactivate
);

pacienteRouter.patch(
  '/:id/activar',
  requireRole('ADMINISTRADOR'),
  validate({ params: pacienteIdParamSchema }),
  pacienteController.activate
);
