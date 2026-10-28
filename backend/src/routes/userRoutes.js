import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';
import {
  userIdParamSchema,
  userCreateSchema,
  userUpdateSchema,
  userFilterSchema,
  profesionalIdParamSchema,
  profesionalUpdateSchema,
  profesionalFilterSchema,
  disponibilidadUpdateSchema
} from '../schemas/userSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const userRouter = Router();
export const profesionalRouter = Router();

// Todas requieren estar autenticado
userRouter.use(requireAuth);
profesionalRouter.use(requireAuth);

// -----------------------------------------------------------------------------
// RUTAS /api/usuarios (Exclusivas de ADMINISTRADOR, RF-02, RFB-13)
// -----------------------------------------------------------------------------
userRouter.get(
  '/',
  requireRole('ADMINISTRADOR'),
  validate({ query: userFilterSchema }),
  userController.listUsers
);

userRouter.get(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema }),
  userController.getUserById
);

userRouter.post(
  '/',
  requireRole('ADMINISTRADOR'),
  validate({ body: userCreateSchema }),
  userController.createUser
);

userRouter.put(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema, body: userUpdateSchema }),
  userController.updateUser
);

userRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema }),
  userController.deactivateUser
);

userRouter.patch(
  '/:id/activar',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema }),
  userController.activateUser
);

userRouter.post(
  '/:id/clave',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema }),
  userController.resetPassword
);

// -----------------------------------------------------------------------------
// RUTAS /api/profesionales
// -----------------------------------------------------------------------------
// Lectura: Administrador, Recepcionista, y Profesional (este último solo a sí mismo)
profesionalRouter.get(
  '/',
  validate({ query: profesionalFilterSchema }),
  userController.listProfesionales
);

profesionalRouter.get(
  '/:id',
  validate({ params: profesionalIdParamSchema }),
  userController.getProfesionalById
);

// Modificación y baja lógica: Administrador (RF-05, RF-13)
profesionalRouter.put(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: profesionalIdParamSchema, body: profesionalUpdateSchema }),
  userController.updateProfesional
);

profesionalRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: profesionalIdParamSchema }),
  userController.deactivateProfesional
);

profesionalRouter.patch(
  '/:id/activar',
  requireRole('ADMINISTRADOR'),
  validate({ params: profesionalIdParamSchema }),
  userController.activateProfesional
);

// Disponibilidad
profesionalRouter.get(
  '/:id/disponibilidad',
  validate({ params: profesionalIdParamSchema }),
  userController.getDisponibilidad
);

profesionalRouter.put(
  '/:id/disponibilidad',
  requireRole('ADMINISTRADOR'),
  validate({ params: profesionalIdParamSchema, body: disponibilidadUpdateSchema }),
  userController.updateDisponibilidad
);
