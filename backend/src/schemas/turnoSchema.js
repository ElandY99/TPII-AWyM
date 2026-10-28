import { z } from 'zod';

export const turnoIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de turno inválido')
}).strict();

export const turnoCreateSchema = z.object({
  id_paciente: z.number().int().positive('Debe seleccionar un paciente'),
  id_profesional: z.number().int().positive('Debe seleccionar un profesional'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  hora: z.string().regex(/^(0[8-9]|1[0-9]|20):(00|30)$/, 'Horario inválido (debe ser entre 08:00 y 20:30 cada 30 min)'),
  motivo_consulta: z.string().trim().max(255, 'Máximo 255 caracteres').optional().nullable(),
  observaciones: z.string().trim().max(500, 'Máximo 500 caracteres').optional().nullable()
}).strict();

// Modificación de turno (Q11: reprogramar o editar observaciones)
export const turnoUpdateSchema = z.object({
  id_profesional: z.number().int().positive('Profesional inválido').optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  hora: z.string().regex(/^(0[8-9]|1[0-9]|20):(00|30)$/, 'Horario inválido').optional(),
  motivo_consulta: z.string().trim().max(255).optional().nullable(),
  observaciones: z.string().trim().max(500).optional().nullable()
}).strict();

// Cambio de estado (Q1: transición estricta)
export const turnoCambioEstadoSchema = z.object({
  estado: z.enum(['CONFIRMADO', 'EN_CONSULTORIO', 'ASISTIDO', 'AUSENTE', 'CANCELADO'])
}).strict();

export const turnoFilterSchema = z.object({
  fecha: z.string().trim().optional(),
  hora: z.string().trim().optional(),
  paciente: z.string().trim().optional(), // Filtro por nombre o DNI
  profesional: z.string().trim().optional(),
  estado: z.enum(['PENDIENTE', 'CONFIRMADO', 'EN_CONSULTORIO', 'ASISTIDO', 'AUSENTE', 'CANCELADO', 'todos']).optional()
}).strict();

export const turnosDisponiblesQuerySchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha requerida (YYYY-MM-DD)'),
  id_profesional: z.coerce.number().int().positive().optional(),
  id_especialidad: z.coerce.number().int().positive().optional()
}).refine(data => data.id_profesional || data.id_especialidad, {
  message: 'Debe especificar id_profesional o id_especialidad',
  path: ['id_profesional']
});
