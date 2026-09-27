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
import {
  ETIQUETA_ESTADO,
  fechaLarga,
  hoyISO,
  nombreCompleto,
  nombreDia,
  sumarDias
} from '../core/format.js';
import { formatearTelefono, validarCampo } from '../core/validators.js';

const formulario = $('#formulario-turno');
const campoBuscar = $('#buscar-paciente');
const contenedorResultados = $('#resultados');
const panelElegido = $('#paciente-elegido');
const inputPaciente = $('#pacienteId');
const bloqueProfesional = $('#bloque-profesional');
const bloqueHorario = $('#bloque-horario');
const selectEspecialidad = $('#especialidad');
const selectProfesional = $('#profesional');
const inputFecha = $('#fecha');
const selectHora = $('#hora');
const inputMotivo = $('#motivo');
const zonaDisponibilidad = $('#disponibilidad');
const botonGuardar = $('#guardar-turno');
const zona = zonaMensajes('[data-zona-mensajes]');
const dialogo = $('#dialogo-confirmacion');

let pacienteElegido = null;
let especialidadSeleccionada = null;

function actualizarPasos() {
  const estados = [
    Boolean(pacienteElegido),
    Boolean(profesionalElegido()),
    Boolean(selectHora.value)
  ];

  estados.forEach((completo, indice) => {
    const paso = $(`#paso-${indice + 1}`);
    paso.classList.toggle('paso--completo', completo);
  });
}

function profesionalElegido() {
  if (!selectProfesional.value) return null;
  return store.profesionalPorId(selectProfesional.value);
}

function habilitarBloque(bloque, habilitado) {
  bloque.disabled = !habilitado;
  for (const control of bloque.querySelectorAll('select, input, textarea')) {
    control.disabled = !habilitado;
  }
}

function llenarSelect(select, elementos, textoVacio) {
  vaciar(select);
  select.append(crear('option', { value: '', text: textoVacio }));
  for (const item of elementos) {
    select.append(crear('option', { value: item.valor, text: item.texto }));
  }
  select.disabled = elementos.length === 0;
}

function pintarResultados() {
  const texto = campoBuscar.value.trim();
  vaciar(contenedorResultados);
  zonaDisponibilidad.hidden = true;

  if (texto.length < 2) {
    contenedorResultados.hidden = true;
    return;
  }

  const encontrados = store.buscarPacientes(texto, 8);
  contenedorResultados.hidden = false;

  if (encontrados.length === 0) {
    contenedorResultados.append(
      estadoVacio(
        'No se encontraron pacientes',
        'Verificá el DNI o el apellido. Si el paciente no está registrado, dálo de alta primero.'
      )
    );
    return;
  }

  for (const paciente of encontrados) {
    const opcion = crear('button', {
      class: 'resultado',
      type: 'button',
      role: 'option',
      'aria-selected': 'false',
      onclick: () => elegirPaciente(paciente)
    });
    opcion.append(
      crear('span', { class: 'resultado__avatar', 'aria-hidden': 'true', text: iniciales(paciente) }),
      crear('span', { class: 'resultado__datos' }, [
        crear('span', { class: 'resultado__nombre', text: nombreCompleto(paciente) }),
        crear('span', { class: 'resultado__meta', text: `DNI ${paciente.dni} · ${paciente.obraSocial}` })
      ])
    );
    contenedorResultados.append(opcion);
  }
}

function iniciales(paciente) {
  return `${paciente.nombre.charAt(0)}${paciente.apellido.charAt(0)}`.toUpperCase();
}

function elegirPaciente(paciente) {
  pacienteElegido = paciente;
  inputPaciente.value = paciente.id;

  $('#avatar-eleccion').textContent = iniciales(paciente);
  $('#nombre-eleccion').textContent = nombreCompleto(paciente);
  $('#meta-eleccion').textContent =
    `DNI ${paciente.dni} · ${paciente.obraSocial} · ${formatearTelefono(paciente.telefono)}`;

  panelElegido.hidden = false;
  campoBuscar.value = '';
  contenedorResultados.hidden = true;
  vaciar(contenedorResultados);

  habilitarBloque(bloqueProfesional, true);
  if (!selectEspecialidad.options.length) {
    llenarSelect(
      selectEspecialidad,
      store.especialidades().map((e) => ({ valor: e.id, texto: e.nombre })),
      'Elegí una especialidad'
    );
  }
  selectEspecialidad.focus();
  actualizarPasos();
}

function limpiarPaciente() {
  pacienteElegido = null;
  inputPaciente.value = '';
  panelElegido.hidden = true;
  campoBuscar.value = '';
  habilitarBloque(bloqueProfesional, false);
  habilitarBloque(bloqueHorario, false);
  actualizarPasos();
  campoBuscar.focus();
}

function alCambiarEspecialidad() {
  const especialidadId = selectEspecialidad.value;
  especialidadSeleccionada = especialidadId;

  const profesionales = especialidadId
    ? store.profesionalesPorEspecialidad(especialidadId)
    : [];

  llenarSelect(
    selectProfesional,
    profesionales.map((p) => ({
      valor: p.id,
      texto: `${nombreCompleto(p)} · ${p.consultorio}`
    })),
    'Elegí un profesional'
  );

  limpiarHorario();
  actualizarPasos();
}

function limpiarHorario() {
  llenarSelect(selectHora, [], 'Elegí una fecha');
  zonaDisponibilidad.hidden = true;
  vaciar(zonaDisponibilidad);
  habilitarBloque(bloqueHorario, Boolean(selectProfesional.value));
  actualizarBotonGuardar();
}

function pintarDisponibilidad(profesional, fecha) {
  vaciar(zonaDisponibilidad);
  zonaDisponibilidad.hidden = false;

  const agenda = store.agendaDe(profesional.id, fecha);

  if (!agenda.configurada) {
    zonaDisponibilidad.append(
      estadoVacio(
        'Ese día el profesional no atiende',
        `${nombreDia(fecha)} no forma parte de su disponibilidad configurada. Probá con otra fecha.`
      )
    );
    return;
  }

  zonaDisponibilidad.append(
    crear('p', {
      class: 'disponibilidad__resumen',
      text: `${agenda.libres} horarios libres de ${agenda.slots.length} en ${nombreDia(fecha, true)}.`
    })
  );

  const lista = crear('ul', { class: 'disponibilidad__lista' });
  for (const slot of agenda.slots.slice(0, 24)) {
    lista.append(
      crear('li', {
        class: `disponibilidad__slot disponibilidad__slot--${slot.libre ? 'libre' : 'ocupado'}`,
        text: slot.hora,
        title: slot.libre ? 'Libre' : 'Ocupado'
      })
    );
  }
  zonaDisponibilidad.append(lista);
}

function alCambiarProfesional() {
  if (!selectProfesional.value) {
    limpiarHorario();
    return;
  }

  limpiarHorario();
  habilitarBloque(bloqueHorario, true);

  const profesional = profesionalElegido();
  $('#ayuda-profesional').textContent = store.tieneAgenda(profesional.id)
    ? `${profesional.consultorio} · atiende según la disponibilidad configurada de su agenda.`
    : `${profesional.consultorio} · este profesional todavía no tiene agenda configurada.`;

  if (!inputFecha.value) inputFecha.value = proximaFechaConAgenda(profesional);
  pintarHorarios();
}

function proximaFechaConAgenda(profesional) {
  for (let i = 0; i < 15; i += 1) {
    const fecha = sumarDias(hoyISO(), i);
    if (store.slotsDe(profesional.id, fecha).length > 0) return fecha;
  }
  return hoyISO();
}

function pintarHorarios() {
  const profesional = profesionalElegido();
  vaciar(selectHora);
  zonaDisponibilidad.hidden = true;
  vaciar(zonaDisponibilidad);

  if (!profesional || !inputFecha.value) {
    llenarSelect(selectHora, [], 'Elegí una fecha');
    actualizarBotonGuardar();
    return;
  }

  const libres = store.horariosLibres(profesional.id, inputFecha.value);

  if (libres.length === 0) {
    if (!store.tieneAgenda(profesional.id)) {
      llenarSelect(selectHora, [], 'El profesional no tiene agenda');
    } else if (store.slotsDe(profesional.id, inputFecha.value).length === 0) {
      llenarSelect(selectHora, [], 'El profesional no atiende ese día');
    } else {
      llenarSelect(selectHora, [], 'No quedan horarios libres');
    }
  } else {
    llenarSelect(
      selectHora,
      libres.map((hora) => ({ valor: hora, texto: hora })),
      'Elegí un horario'
    );
  }

  pintarDisponibilidad(profesional, inputFecha.value);
  actualizarBotonGuardar();
}

function actualizarBotonGuardar() {
  const completo =
    Boolean(pacienteElegido) &&
    Boolean(selectProfesional.value) &&
    Boolean(inputFecha.value) &&
    Boolean(selectHora.value) &&
    !validarCampo('motivo', inputMotivo.value);

  botonGuardar.disabled = !completo;
  actualizarPasos();
}

function datosDelFormulario() {
  return {
    pacienteId: inputPaciente.value,
    profesionalId: selectProfesional.value,
    fecha: inputFecha.value,
    hora: selectHora.value,
    motivo: inputMotivo.value.trim(),
    estado: 'PENDIENTE'
  };
}

function pintarConfirmacion(turno) {
  const lineas = [
    ['Paciente', nombreCompleto(turno.paciente)],
    ['DNI', turno.paciente?.dni ?? '—'],
    ['Profesional', nombreCompleto(turno.profesional)],
    ['Especialidad', turno.especialidad?.nombre ?? '—'],
    ['Consultorio', turno.profesional?.consultorio ?? '—'],
    ['Fecha', fechaLarga(turno.fecha)],
    ['Hora', `${turno.hora} · ${turno.duracionMin} min`],
    ['Estado', ETIQUETA_ESTADO[turno.estado] ?? turno.estado]
  ];

  $('#confirmacion-texto').textContent =
    `El turno se reservó con estado ${ETIQUETA_ESTADO[turno.estado]}. ` +
    'Ya aparece en la agenda del profesional.';

  const lista = $('#confirmacion-datos');
  vaciar(lista);
  for (const [clave, valor] of lineas) {
    lista.append(
      crear('div', { class: 'datos-linea' }, [
        crear('dt', { class: 'datos-linea__clave', text: clave }),
        crear('dd', { class: 'datos-linea__valor', text: valor })
      ])
    );
  }

  dialogo.showModal();
}

async function guardar(evento) {
  evento.preventDefault();
  zona.limpiar();

  const problema = validarCampo('motivo', inputMotivo.value);
  if (problema) {
    zona.mostrar(problema, 'error');
    inputMotivo.focus();
    return;
  }

  botonGuardar.disabled = true;
  botonGuardar.textContent = 'Guardando…';

  try {
    const turno = store.crearTurno(datosDelFormulario());
    pintarConfirmacion(turno);
    anunciar('Turno confirmado');
  } catch (fallo) {
    zona.mostrar(fallo.message, 'error');
    if (fallo.detalle?.campo === 'hora') {
      pintarHorarios();
    }
  } finally {
    botonGuardar.disabled = false;
    botonGuardar.textContent = 'Confirmar turno';
    actualizarBotonGuardar();
  }
}

function reiniciarFormulario() {
  formulario.reset();
  limpiarPaciente();
  llenarSelect(
    selectEspecialidad,
    store.especialidades().map((e) => ({ valor: e.id, texto: e.nombre })),
    'Elegí una especialidad'
  );
  especialidadSeleccionada = null;
  vaciar(zonaDisponibilidad);
  zonaDisponibilidad.hidden = true;
  zona.limpiar();
}

campoBuscar.addEventListener('input', pintarResultados);
$('#cambiar-paciente').addEventListener('click', limpiarPaciente);
selectEspecialidad.addEventListener('change', alCambiarEspecialidad);
selectProfesional.addEventListener('change', alCambiarProfesional);
inputFecha.addEventListener('change', pintarHorarios);
selectHora.addEventListener('change', actualizarBotonGuardar);
inputMotivo.addEventListener('input', actualizarBotonGuardar);
formulario.addEventListener('submit', guardar);

$('#seguir-solicitando').addEventListener('click', () => {
  dialogo.close();
  reiniciarFormulario();
  campoBuscar.focus();
});

(async function iniciar() {
  if (session.redirigirSiFalta()) return;
  nav.montar();
  nav.montarPie();

  if (!session.puedeGestionar()) {
    zona.mostrar(
      'Tu rol no tiene permiso para solicitar turnos. Ingresá con una cuenta de administración o recepción.',
      'error'
    );
    botonGuardar.disabled = true;
    $('#bloque-paciente').disabled = true;
    for (const control of $('#bloque-paciente').querySelectorAll('input, button')) {
      control.disabled = true;
    }
  }

  try {
    await store.cargar();

    const parametros = new URLSearchParams(location.search);
    const pacienteId = parametros.get('paciente');

    if (pacienteId) {
      const paciente = store.pacientePorId(pacienteId);
      if (paciente) {
        elegirPaciente(paciente);
        document.querySelector('#bloque-profesional').scrollIntoView({
          block: 'center',
          behavior: 'smooth'
        });
      }
    }
  } catch (fallo) {
    zona.mostrar(fallo.message, 'error');
  }
})();
