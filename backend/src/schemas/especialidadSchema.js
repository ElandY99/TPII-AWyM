import { z } from 'zod';

export const especialidadIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de especialidad inválido')
}).strict();

export const especialidadCreateSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(80, 'Máximo 80 caracteres'),
  descripcion: z.string().trim().max(255, 'Máximo 255 caracteres').optional().nullable()
}).strict();

export const especialidadUpdateSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(80, 'Máximo 80 caracteres'),
  descripcion: z.string().trim().max(255, 'Máximo 255 caracteres').optional().nullable()
}).strict();

export const especialidadFilterSchema = z.object({
  nombre: z.string().trim().optional(),
  estado: z.enum(['0', '1', 'todos']).optional()
}).strict();
