import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[#$@!%*?&]/, 'Debe incluir al menos un carácter especial (#$@!%*?&)');

export const loginSchema = z.object({
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  clave: z.string().min(1, 'Debe ingresar la contraseña')
}).strict();

export const changePasswordSchema = z.object({
  clave_actual: z.string().min(1, 'Debe ingresar su contraseña actual'),
  clave_nueva: passwordSchema
}).strict();
