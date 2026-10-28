import { z } from 'zod';

export const pacienteIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de paciente inválido')
}).strict();

// DNI argentino (7 u 8 dígitos numéricos, D-18)
// Teléfono opcional (máx 12 dígitos numéricos, D-18)
// Correo obligatorio (D-17)
// Fecha nacimiento opcional (no futura y >= 1900-01-01, D-19)
// Obra social opcional (texto libre, D-19)
export const pacienteCreateSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe contener 7 u 8 dígitos numéricos sin puntos'),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  telefono: z.string().regex(/^\d{1,12}$/, 'El teléfono debe contener solo números y hasta 12 dígitos').optional().nullable(),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .refine(val => val >= '1900-01-01', 'La fecha de nacimiento no puede ser anterior al año 1900')
    .refine(val => {
      const hoy = new Date().toISOString().slice(0, 10);
      return val <= hoy;
    }, 'La fecha de nacimiento no puede ser una fecha futura')
    .optional().nullable(),
  obra_social: z.string().trim().max(100, 'Máximo 100 caracteres').optional().nullable()
}).strict();

export const pacienteUpdateSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe contener 7 u 8 dígitos numéricos sin puntos'),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  telefono: z.string().regex(/^\d{1,12}$/, 'El teléfono debe contener solo números y hasta 12 dígitos').optional().nullable(),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .refine(val => val >= '1900-01-01', 'La fecha de nacimiento no puede ser anterior al año 1900')
    .refine(val => {
      const hoy = new Date().toISOString().slice(0, 10);
      return val <= hoy;
    }, 'La fecha de nacimiento no puede ser una fecha futura')
    .optional().nullable(),
  obra_social: z.string().trim().max(100, 'Máximo 100 caracteres').optional().nullable()
}).strict();

export const pacienteFilterSchema = z.object({
  q: z.string().trim().optional(), // Búsqueda rápida unificada por DNI, nombre o apellido (TP2 front-end)
  dni: z.string().trim().optional(),
  nombre: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  correo: z.string().trim().optional(),
  estado: z.enum(['0', '1', 'todos']).optional()
}).strict();
