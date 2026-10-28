import { Router } from 'express';
import { especialidadController } from '../controllers/especialidadController.js';
import { validate } from '../middleware/validate.js';
import {
  especialidadIdParamSchema,
  especialidadCreateSchema,
  especialidadUpdateSchema,
  especialidadFilterSchema
} from '../schemas/especialidadSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const especialidadRouter = Router();

// Todas las rutas requieren estar autenticado
especialidadRouter.use(requireAuth);

// Lectura de especialidades permitida para ADMINISTRADOR y RECEPCIONISTA (D-07)
especialidadRouter.get(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ query: especialidadFilterSchema }),
  especialidadController.list
);

especialidadRouter.get(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ params: especialidadIdParamSchema }),
  especialidadController.getById
);

// Gestión (Crear, Modificar, Desactivar, Activar) exclusiva de ADMINISTRADOR (RF-04, RFB-18)
especialidadRouter.post(
  '/',
  requireRole('ADMINISTRADOR'),
  validate({ body: especialidadCreateSchema }),
  especialidadController.create
);

especialidadRouter.put(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: especialidadIdParamSchema, body: especialidadUpdateSchema }),
  especialidadController.update
);

especialidadRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: especialidadIdParamSchema }),
  especialidadController.deactivate
);

especialidadRouter.patch(
  '/:id/activar',
  requireRole('ADMINISTRADOR'),
  validate({ params: especialidadIdParamSchema }),
  especialidadController.activate
);
