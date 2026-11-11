import { Router } from 'express';
import { agendaController } from '../controllers/agendaController.js';
import { validate } from '../middleware/validate.js';
import { agendaQuerySchema } from '../schemas/agendaSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const agendaRouter = Router();
export const dashboardRouter = Router();

agendaRouter.use(requireAuth);
dashboardRouter.use(requireAuth);

// Agenda médica diaria o mensual (CU-04, D-38, Q9) - No accesible para PACIENTE (RFM-21)
agendaRouter.get(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'),
  validate({ query: agendaQuerySchema }),
  agendaController.getAgenda
);

// Panel principal / Dashboard (RFB-57, D-39, Q8)
dashboardRouter.get(
  '/',
  agendaController.getDashboard
);
