const RE_DNI = /^\d{7,8}$/;
const RE_TELEFONO = /^\d{10,11}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const RE_TURNO_ID = /^TUR-\d+$/;
const RE_MOTIVO = /^[\s\S]{0,200}$/;

/** Formatea un teléfono argentino a 351-123-4567. */
export function formatearTelefono(valor) {
  const digitos = String(valor).replace(/\D/g, '');
  if (digitos.length === 10) {
    return `${digitos.slice(0, 3)}-${digitos.slice(3, 6)}-${digitos.slice(6)}`;
  }
  if (digitos.length === 11) {
    return `${digitos.slice(0, 3)}-${digitos.slice(3, 6)}-${digitos.slice(6)}`;
  }
  return String(valor);
}

export function soloDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

const REGLAS = {
  dni(valor) {
    if (!valor) return 'Ingresá tu DNI.';
    if (!RE_DNI.test(valor)) return 'El DNI debe tener 7 u 8 dígitos, sin letras.';
    return null;
  },

  nombre(valor) {
    if (!valor || !valor.trim()) return 'Ingresá el nombre.';
    if (valor.trim().length < 2) return 'El nombre es demasiado corto.';
    if (valor.trim().length > 40) return 'El nombre no puede superar los 40 caracteres.';
    if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(valor.trim())) {
      return 'El nombre solo admite letras, espacios y apóstrofos.';
    }
    return null;
  },

  apellido(valor) {
    if (!valor || !valor.trim()) return 'Ingresá el apellido.';
    if (valor.trim().length < 2) return 'El apellido es demasiado corto.';
    if (valor.trim().length > 40) return 'El apellido no puede superar los 40 caracteres.';
    if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(valor.trim())) {
      return 'El apellido solo admite letras, espacios y apóstrofos.';
    }
    return null;
  },

  fechaNacimiento(valor) {
    if (!valor) return 'Ingresá la fecha de nacimiento.';
    const fecha = new Date(`${valor}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return 'La fecha de nacimiento no es válida.';
    const hoy = new Date();
    if (fecha > hoy) return 'La fecha de nacimiento no puede ser futura.';
    const edad = hoy.getFullYear() - fecha.getFullYear();
    if (edad > 120) return 'Ingresá una fecha de nacimiento válida.';
    return null;
  },

  telefono(valor) {
    const digitos = soloDigitos(valor);
    if (!digitos) return 'Ingresá un teléfono.';
    if (!RE_TELEFONO.test(digitos)) {
      return 'El teléfono debe tener 10 u 11 dígitos, sin espacios ni símbolos.';
    }
    return null;
  },

  correo(valor) {
    if (!valor || !valor.trim()) return 'Ingresá un correo electrónico.';
    if (!RE_EMAIL.test(valor.trim())) return 'El formato del correo no es válido.';
    if (valor.trim().length > 120) return 'El correo es demasiado largo.';
    return null;
  },

  obraSocial(valor) {
    if (!valor || !valor.trim()) return 'Ingresá la obra social.';
    if (valor.trim().length > 60) return 'La obra social es demasiado larga.';
    return null;
  },

  contrasena(valor) {
    if (!valor) return 'Ingresá tu contraseña.';
    if (valor.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return null;
  },

  motivo(valor) {
    if (valor && !RE_MOTIVO.test(valor)) {
      return 'El motivo no puede superar los 200 caracteres.';
    }
    return null;
  },

  turnoId(valor) {
    if (!valor) return 'Falta identificar el turno.';
    if (!RE_TURNO_ID.test(valor)) return 'El identificador de turno no es válido.';
    return null;
  }
};

/** Devuelve el mensaje de error de un campo, o `null` si es válido. */
export function validarCampo(campo, valor) {
  const regla = REGLAS[campo];
  if (!regla) return null;
  return regla(typeof valor === 'string' ? valor.trim() : valor);
}

/** Valida un objeto completo y devuelve `{ campo: mensaje }` con los errores. */
export function validarFormulario(datos) {
  const errores = {};
  for (const [campo, valor] of Object.entries(datos)) {
    const error = validarCampo(campo, valor);
    if (error) errores[campo] = error;
  }
  return errores;
}

export const CAMPOS_REGLAS = Object.keys(REGLAS);
