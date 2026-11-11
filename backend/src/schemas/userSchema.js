import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de usuario inválido')
}).strict();

export const profesionalIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de profesional inválido')
}).strict();

// Franja horaria para disponibilidad
export const franjaHorariaSchema = z.object({
  dia_semana: z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']),
  hora_inicio: z.string().regex(/^(0[8-9]|1[0-9]|20):(00|30)$/, 'Horario de inicio entre 08:00 y 20:30'),
  hora_fin: z.string().regex(/^(0[8-9]|1[0-9]|20|21):(00|30)$/, 'Horario de fin entre 08:30 y 21:00')
}).refine(data => data.hora_inicio < data.hora_fin, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['hora_fin']
});

// Datos de profesional requeridos si rol === 'PROFESIONAL' (Q4)
export const profesionalDataSchema = z.object({
  id_especialidad: z.number().int().positive('Debe seleccionar una especialidad válida'),
  matricula: z.string().regex(/^\d{5}$/, 'La matrícula debe tener exactamente 5 dígitos numéricos'),
  consultorio: z.string().trim().min(1, 'El consultorio es requerido').max(20, 'Máximo 20 caracteres')
}).strict();

// Datos de paciente si rol === 'PACIENTE'
export const pacienteDataSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos numéricos'),
  telefono: z.string().regex(/^\d{1,12}$/, 'El teléfono solo debe contener números (máximo 12)').optional().nullable(),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional().nullable(),
  obra_social: z.string().trim().max(100).optional().nullable()
}).strict();

// Creación de usuario (Q4: si es PROFESIONAL, se exige profesional y disponibilidad; si es PACIENTE, se exige ficha paciente)
export const userCreateSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  rol: z.enum(['RECEPCIONISTA', 'PROFESIONAL', 'PACIENTE'], {
    errorMap: () => ({ message: 'El rol debe ser RECEPCIONISTA, PROFESIONAL o PACIENTE' })
  }),
  profesional: profesionalDataSchema.optional(),
  disponibilidad: z.array(franjaHorariaSchema).optional(),
  paciente: pacienteDataSchema.optional()
}).strict().superRefine((data, ctx) => {
  if (data.rol === 'PROFESIONAL') {
    if (!data.profesional) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para el rol PROFESIONAL debe completar los datos del profesional',
        path: ['profesional']
      });
    }
    if (!data.disponibilidad || data.disponibilidad.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe configurar al menos una franja horaria de atención para el profesional',
        path: ['disponibilidad']
      });
    }
  }
  if (data.rol === 'PACIENTE') {
    if (!data.paciente || !data.paciente.dni) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para el rol PACIENTE debe ingresar los datos del paciente (DNI)',
        path: ['paciente']
      });
    }
  }
});

// Modificación de usuario (sin cambio de rol, según definición confirmada)
export const userUpdateSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase()
}).strict();

export const userFilterSchema = z.object({
  nombre: z.string().trim().optional(),
  apellido: z.string().trim().optional(),
  correo: z.string().trim().optional(),
  rol: z.enum(['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL', 'PACIENTE']).optional(),
  estado: z.enum(['0', '1', 'todos']).optional()
}).strict();

// Modificación de profesional (Administrador)
export const profesionalUpdateSchema = z.object({
  id_especialidad: z.number().int().positive('Especialidad inválida'),
  matricula: z.string().regex(/^\d{5}$/, 'La matrícula debe ser de 5 dígitos'),
  consultorio: z.string().trim().min(1, 'Consultorio requerido').max(20, 'Máximo 20 caracteres').nullable().optional()
}).strict();

export const profesionalFilterSchema = z.object({
  especialidad: z.string().trim().optional(),
  nombre: z.string().trim().optional(),
  estado: z.enum(['0', '1', 'todos']).optional()
}).strict();

// Configuración semanal de disponibilidad (reemplazo completo)
export const disponibilidadUpdateSchema = z.object({
  franjas: z.array(franjaHorariaSchema)
}).strict();
