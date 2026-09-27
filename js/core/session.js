import * as store from './store.js';
import { ROLES, ETIQUETA_ROL } from './format.js';

const CLAVE = 'sgm.session.v1';

export class ErrorCredenciales extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = 'ErrorCredenciales';
    this.codigo = codigo;
  }
}

export const MENSAJE_GENERICO = 'Usuario o contraseña incorrectos.';

function leer() {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    sessionStorage.removeItem(CLAVE);
    return null;
  }
}

function escribir(sesion) {
  if (sesion) {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
  } else {
    sessionStorage.removeItem(CLAVE);
  }
}

export function actual() {
  return leer();
}

export function haySesion() {
  return leer() !== null;
}

export function esRol(...roles) {
  const sesion = leer();
  return sesion !== null && roles.includes(sesion.rol);
}

export function esAdmin() {
  return esRol(ROLES.ADMIN);
}

export function esRecepcion() {
  return esRol(ROLES.RECEPCION);
}

export function esProfesional() {
  return esRol(ROLES.PROFESIONAL);
}

export function esPaciente() {
  return esRol(ROLES.PACIENTE);
}

export function puedeGestionar() {
  return esAdmin() || esRecepcion();
}

export function etiquetaRol(sesion = leer()) {
  return sesion ? ETIQUETA_ROL[sesion.rol] ?? sesion.rol : '—';
}

export function iniciarSesion(correo, contrasena) {
  const usuario = store.usuarioPorCorreo(correo);
  const coincide = usuario !== null && usuario.password === contrasena;

  if (!coincide) {
    throw new ErrorCredenciales('CREDENCIALES', MENSAJE_GENERICO);
  }

  if (usuario.activo === false) {
    throw new ErrorCredenciales(
      'CUENTA_INACTIVA',
      'Acceso denegado. Comuníquese con el administrador del sistema.'
    );
  }

  const sesion = {
    usuarioId: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    profesionalId: usuario.profesionalId ?? null,
    pacienteId: usuario.pacienteId ?? null,
    iniciadaEn: new Date().toISOString()
  };

  escribir(sesion);
  return sesion;
}

export function cerrarSesion() {
  escribir(null);
}

export function redirigirSiFalta() {
  if (haySesion()) return false;
  const retorno = encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html');
  location.replace(`login.html?retorno=${retorno}`);
  return true;
}

export function destinoPostLogin() {
  const parametros = new URLSearchParams(location.search);
  const retorno = parametros.get('retorno');
  const permitidos = ['dashboard.html', 'pacientes.html', 'agenda.html', 'turno-form.html'];
  return permitidos.includes(retorno) ? retorno : 'dashboard.html';
}
