import * as nav from '../core/nav.js';
import * as session from '../core/session.js';
import * as store from '../core/store.js';
import { $, anunciar, enfocarPrimerError, mensajeEnLinea, zonaMensajes } from '../core/ui.js';
import { validarCampo } from '../core/validators.js';

const formulario = $('#formulario-login');
const correo = $('#correo');
const contrasena = $('#contrasena');
const boton = $('#enviar');
const zona = zonaMensajes();

async function alEnviar(evento) {
  evento.preventDefault();

  const errores = {
    correo: validarCampo('correo', correo.value),
    contrasena: validarCampo('contrasena', contrasena.value)
  };

  mensajeEnLinea(correo, errores.correo);
  mensajeEnLinea(contrasena, errores.contrasena);
  zona.limpiar();

  const camposConError = [correo, contrasena].filter((campo) => errores[campo.id]);
  if (camposConError.length > 0) {
    zona.mostrar('Debés completar todos los campos obligatorios.', 'error');
    enfocarPrimerError(camposConError);
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Verificando…';

  try {
    await store.cargar();
    session.iniciarSesion(correo.value, contrasena.value);
    zona.mostrar('Sesión iniciada. Redirigiendo al panel principal…', 'exito');
    location.href = session.destinoPostLogin();
  } catch (fallo) {
    boton.disabled = false;
    boton.textContent = 'Entrar';
    zona.mostrar(fallo.message, 'error');
    contrasena.value = '';
    contrasena.focus();
    anunciar('No se pudo iniciar sesión');
  }
}

function alternarVisibilidad() {
  const visible = contrasena.type === 'password';
  contrasena.type = visible ? 'text' : 'password';
  botonVer.setAttribute('aria-pressed', String(visible));
  botonVer.setAttribute('aria-label', visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña');
  botonVer.textContent = visible ? 'Ocultar' : 'Ver';
  contrasena.focus();
}

const botonVer = $('#ver-contrasena');

formulario.addEventListener('submit', alEnviar);
botonVer.addEventListener('click', alternarVisibilidad);

for (const campo of [correo, contrasena]) {
  campo.addEventListener('blur', () => {
    mensajeEnLinea(campo, validarCampo(campo.id, campo.value));
  });
  campo.addEventListener('input', () => {
    if (campo.getAttribute('aria-invalid') === 'true') {
      mensajeEnLinea(campo, validarCampo(campo.id, campo.value));
    }
  });
}

nav.montar();
nav.montarPie();
