import * as nav from '../core/nav.js';
import * as session from '../core/session.js';
import * as store from '../core/store.js';
import {
  $,
  anunciar,
  crear,
  estadoVacio,
  vaciar,
  zonaMensajes
} from '../core/ui.js';
import { fechaCorta, nombreCompleto } from '../core/format.js';
import { formatearTelefono, validarCampo } from '../core/validators.js';

const CAMPOS = ['dni', 'nombre', 'apellido', 'fechaNacimiento', 'telefono', 'correo', 'obraSocial'];

const formulario = $('#formulario-paciente');
const dialogo = $('#dialogo-paciente');
const listado = $('#listado');
const conteo = $('#conteo');
const filtro = $('#filtro');
const zonaListado = zonaMensajes('[data-zona-mensajes]');
const zonaFormulario = zonaMensajes('[data-zona-mensajes-form]');
const botonNuevo = $('#nuevo-paciente');

let textoFiltro = '';
let idResaltado = null;
let puedeAlta = false;

function tarjetaPaciente(paciente) {
  const cantidadTurnos = store.turnos({ pacienteId: paciente.id }).length;

  const acciones = [];
  if (puedeAlta) {
    acciones.push(
      crear('a', {
        class: 'boton boton--secundario boton--compacto',
        href: `turno-form.html?paciente=${encodeURIComponent(paciente.id)}`,
        text: 'Solicitar turno'
      })
    );
  }

  const tarjeta = crear('article', {
    class: `ficha${paciente.id === idResaltado ? ' tarjeta--nueva' : ''}`,
    dataset: { id: paciente.id }
  });

  tarjeta.append(
    crear('div', { class: 'ficha__cabecera' }, [
      crear('span', { class: 'avatar avatar--grande', 'aria-hidden': 'true', text: iniciales(paciente) }),
      crear('div', { class: 'ficha__identidad' }, [
        crear('h2', { class: 'ficha__nombre', text: nombreCompleto(paciente) }),
        crear('p', { class: 'ficha__dni' }, [
          crear('span', { class: 'sr-solo', text: 'Documento: ' }),
          crear('span', { text: `DNI ${paciente.dni}` })
        ])
      ])
    ]),
    crear('dl', { class: 'ficha__datos' }, [
      crear('div', { class: 'datos-linea' }, [
        crear('dt', { class: 'datos-linea__clave', text: 'Nacimiento' }),
        crear('dd', { class: 'datos-linea__valor', text: fechaCorta(paciente.fechaNacimiento) })
      ]),
      crear('div', { class: 'datos-linea' }, [
        crear('dt', { class: 'datos-linea__clave', text: 'Teléfono' }),
        crear('dd', { class: 'datos-linea__valor', text: formatearTelefono(paciente.telefono) })
      ]),
      crear('div', { class: 'datos-linea' }, [
        crear('dt', { class: 'datos-linea__clave', text: 'Correo' }),
        crear('dd', { class: 'datos-linea__valor', text: paciente.correo })
      ]),
      crear('div', { class: 'datos-linea' }, [
        crear('dt', { class: 'datos-linea__clave', text: 'Obra social' }),
        crear('dd', { class: 'datos-linea__valor', text: paciente.obraSocial })
      ])
    ]),
    crear('div', { class: 'ficha__pie' }, [
      crear('span', {
        class: 'ficha__turnos',
        text: `${cantidadTurnos} ${cantidadTurnos === 1 ? 'turno' : 'turnos'} registrado${cantidadTurnos === 1 ? '' : 's'}`
      }),
      crear('div', { class: 'ficha__acciones' }, acciones)
    ])
  );

  return tarjeta;
}

function iniciales(paciente) {
  return `${paciente.nombre.charAt(0)}${paciente.apellido.charAt(0)}`.toUpperCase();
}

function renderizar() {
  const pacientes = store.pacientes({ texto: textoFiltro });
  vaciar(listado);

  conteo.textContent = textoFiltro
    ? `${pacientes.length} de ${store.pacientes().length} pacientes coinciden con la búsqueda.`
    : `${pacientes.length} ${pacientes.length === 1 ? 'paciente' : 'pacientes'} en el sistema.`;

  if (pacientes.length === 0) {
    listado.append(
      estadoVacio(
        textoFiltro ? 'No encontramos pacientes con ese criterio' : 'Todavía no hay pacientes cargados',
        textoFiltro
          ? 'Probá con otro DNI, apellido o correo.'
          : 'Usá el botón «Nuevo paciente» para registrar el primero.'
      )
    );
    return;
  }

  for (const paciente of pacientes) {
    listado.append(tarjetaPaciente(paciente));
  }
}

function limpiarErrores() {
  zonaFormulario.limpiar();
  for (const campo of formulario.elements) {
    const nodo = document.getElementById(`${campo.id}-error`);
    if (nodo) {
      nodo.hidden = true;
      nodo.textContent = '';
    }
    campo.classList.remove('campo__control--invalido');
    campo.removeAttribute('aria-invalid');
  }
}

function mostrarError(campo, mensaje) {
  let nodo = document.getElementById(`${campo.id}-error`);
  if (!nodo) {
    nodo = crear('p', { class: 'campo__error', id: `${campo.id}-error` });
    nodo.setAttribute('role', 'alert');
    campo.closest('.campo').append(nodo);
  }
  nodo.textContent = mensaje;
  nodo.hidden = false;
  campo.setAttribute('aria-invalid', 'true');
  campo.setAttribute('aria-describedby', nodo.id);
  campo.classList.add('campo__control--invalido');
  campo.focus();
}

function valores() {
  return Object.fromEntries(
    CAMPOS.map((campo) => [campo, formulario.elements[campo].value])
  );
}

function abrirDialogo() {
  limpiarErrores();
  formulario.reset();
  zonaFormulario.limpiar();
  dialogo.showModal();
  formulario.elements.dni.focus();
}

function cerrarDialogo() {
  dialogo.close();
}

async function guardar(evento) {
  evento.preventDefault();
  limpiarErrores();

  const datos = valores();
  let foco = null;

  for (const campo of CAMPOS) {
    const mensaje = validarCampo(campo, datos[campo]);
    if (mensaje) {
      mostrarError(formulario.elements[campo], mensaje);
      foco ??= formulario.elements[campo];
    }
  }

  if (foco) {
    zonaFormulario.mostrar('Revisá los campos marcados antes de guardar.', 'error');
    return;
  }

  const boton = $('#guardar-paciente');
  boton.disabled = true;
  boton.textContent = 'Guardando…';

  try {
    const paciente = store.altaPaciente(datos);
    cerrarDialogo();
    textoFiltro = '';
    filtro.value = '';
    idResaltado = paciente.id;
    renderizar();

    const nodo = listado.querySelector(`[data-id="${paciente.id}"]`);
    nodo?.scrollIntoView({ block: 'center', behavior: 'smooth' });

    zonaListado.mostrar(
      `${nombreCompleto(paciente)} quedó registrado con el DNI ${paciente.dni}.`,
      'exito'
    );
    anunciar('Paciente registrado');
  } catch (fallo) {
    if (fallo.codigo === 'DNI_DUPLICADO') {
      mostrarError(formulario.elements.dni, fallo.message);
    }
    zonaFormulario.mostrar(fallo.message, 'error');
  } finally {
    boton.disabled = false;
    boton.textContent = 'Guardar paciente';
  }
}

botonNuevo.addEventListener('click', () => {
  if (puedeAlta) {
    abrirDialogo();
  } else {
    zonaListado.mostrar('Tu rol no tiene permiso para dar de alta pacientes.', 'error');
  }
});

$('#cerrar-dialogo').addEventListener('click', cerrarDialogo);
$('#cancelar-alta').addEventListener('click', cerrarDialogo);
formulario.addEventListener('submit', guardar);

dialogo.addEventListener('close', () => formulario.reset());

formulario.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') cerrarDialogo();
});

filtro.addEventListener('input', () => {
  textoFiltro = filtro.value;
  idResaltado = null;
  renderizar();
});

for (const campo of formulario.elements) {
  if (!campo.id) continue;
  campo.addEventListener('blur', () => {
    const mensaje = validarCampo(campo.id, campo.value);
    const nodo = document.getElementById(`${campo.id}-error`);
    if (nodo) {
      nodo.textContent = mensaje ?? '';
      nodo.hidden = !mensaje;
    }
    campo.classList.toggle('campo__control--invalido', Boolean(mensaje));
  });
}

(async function iniciar() {
  if (session.redirigirSiFalta()) return;
  nav.montar();
  nav.montarPie();

  try {
    await store.cargar();
    puedeAlta = session.puedeGestionar();
    if (!puedeAlta) {
      botonNuevo.disabled = true;
      botonNuevo.title = 'Tu rol no puede registrar pacientes';
      $('#ayuda-seccion').textContent =
        'Consulta de pacientes. El alta queda reservada a administración y recepción.';
    }
    renderizar();
  } catch (fallo) {
    zonaListado.mostrar(fallo.message, 'error');
  }
})();
