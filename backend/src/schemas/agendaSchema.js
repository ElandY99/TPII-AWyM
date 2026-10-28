import { z } from 'zod';

export const agendaQuerySchema = z.object({
  id_profesional: z.coerce.number().int().positive().optional(),
  id_especialidad: z.coerce.number().int().positive().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  mes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mes inválido (YYYY-MM)').optional()
}).refine(data => data.fecha || data.mes, {
  message: 'Debe especificar fecha (YYYY-MM-DD) o mes (YYYY-MM)',
  path: ['fecha']
});
