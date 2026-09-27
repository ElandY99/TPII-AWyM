import * as nav from '../core/nav.js';
import * as session from '../core/session.js';
import * as store from '../core/store.js';
import {
  $,
  anunciar,
  badgeEstado,
  confirmar,
  crear,
  estadoVacio,
  vaciar,
  zonaMensajes
} from '../core/ui.js';
import {
  ETIQUETA_ESTADO,
  fechaLarga,
  fechaRelativa,
  hoyISO,
  nombreCompleto,
  nombreDia
} from '../core/format.js';

const selectEspecialidad = $('#especialidad');
const selectProfesional = $('#profesional');
const inputFecha = $('#fecha');
const selectVista = $('#vista');
const contenedorAgenda = $('#agenda');
const resumen = $('#resumen');
const zona = zonaMensajes('[data-zona-mensajes]');
const botonSolicitar = $('#solicitar');

let sesion = null;
let profesionalForzado = null;

const etiqueta = (estado) => ETIQUETA_ESTADO[estado] ?? estado;

function opcionesProfesionales(especialidadId) {
  const lista = especialidadId
    ? store.profesionalesPorEspecialidad(especialidadId)
    : store.profesionales();
  return lista.map((p) => ({
    valor: p.id,
    texto: `${nombreCompleto(p)} · ${p.consultorio}`
  }));
}

function llenarSelect(select, elementos, textoVacio) {
  vaciar(select);
  select.append(crear('option', { value: '', text: textoVacio }));
  for (const item of elementos) {
    select.append(crear('option', { value: item.valor, text: item.texto }));
  }
  select.disabled = elementos.length === 0;
}

function pintarFiltros() {
  if (sesion?.rol !== 'PROFESIONAL') {
    llenarSelect(
      selectEspecialidad,
      store.especialidades().map((e) => ({ valor: e.id, texto: e.nombre })),
      'Todas las especialidades'
    );
    llenarSelect(selectProfesional, opcionesProfesionales(''), 'Todos los profesionales');
  }
  if (!inputFecha.value) inputFecha.value = hoyISO();
}

function aplicarRestriccionesDeRol() {
  if (sesion?.rol !== 'PROFESIONAL') return;

  profesionalForzado = sesion.profesionalId;
  const profesional = store.profesionalPorId(profesionalForzado);

  llenarSelect(
    selectEspecialidad,
    store.especialidades().map((e) => ({ valor: e.id, texto: e.nombre })),
    'Todas las especialidades'
  );
  selectEspecialidad.value = profesional?.especialidadId ?? '';

  llenarSelect(
    selectProfesional,
    opcionesProfesionales(profesional?.especialidadId),
    'Sin profesionales'
  );
  selectProfesional.value = profesionalForzado;

  selectEspecialidad.disabled = true;
  selectProfesional.disabled = true;
  botonSolicitar.hidden = true;
  $('#ayuda-agenda').textContent =
    'Como profesional, consultás únicamente tu propia agenda. La especialidad y el profesional están fijados.';
}

function profesionalElegido() {
  if (profesionalForzado) return store.profesionalPorId(profesionalForzado);
  if (!selectProfesional.value) return null;
  return store.profesionalPorId(selectProfesional.value);
}

function tarjetaSlot(slot) {
  if (slot.libre) {
    return crear('div', { class: 'slot slot--libre' }, [
      crear('span', { class: 'slot__hora', text: slot.hora }),
      crear('span', { class: 'slot__estado', text: 'Libre' })
    ]);
  }

  const turno = slot.turno;
  const boton = crear('button', {
    class: 'slot slot--ocupado',
    type: 'button',
    'aria-label':
      `Turno de las ${slot.hora} con ${nombreCompleto(turno.paciente)}, ` +
      `${etiqueta(turno.estado)}. Ver detalle.`,
    onclick: () => mostrarDetalle(turno.id)
  });

  boton.append(
    crear('span', { class: 'slot__hora', text: slot.hora }),
    crear('span', { class: 'slot__paciente', text: nombreCompleto(turno.paciente) }),
    crear('span', { class: 'slot__pie' }, [
      crear('span', { class: 'slot__motivo', text: turno.motivo || 'Sin motivo informado' }),
      badgeEstado(turno.estado)
    ])
  );

  return boton;
}

function bloqueDia(datos) {
  const cancelados = store
    .turnos({ profesionalId: datos.profesionalId, desde: datos.fecha, hasta: datos.fecha })
    .filter((t) => t.estado === 'CANCELADO');

  const cabecera = crear('header', { class: 'dia__cabecera' }, [
    crear('div', { class: 'dia__identidad' }, [
      crear('h3', { class: 'dia__titulo', text: nombreDia(datos.fecha, true) }),
      crear('p', {
        class: 'dia__fecha',
        text: `${fechaLarga(datos.fecha)} · ${fechaRelativa(datos.fecha)}`
      })
    ]),
    crear('div', { class: 'dia__conteo' }, [
      crear('span', { class: 'dia__libres', text: `${datos.libres} libres` }),
      crear('span', { class: 'dia__ocupados', text: `${datos.ocupados} ocupados` })
    ])
  ]);

  const cuerpo = crear('div', { class: 'dia__slots' });

  if (datos.slots.length === 0) {
    cuerpo.append(
      crear('p', {
        class: 'dia__sin-horarios',
        text: 'No se registran horarios de atención para este día.'
      })
    );
  } else {
    for (const slot of datos.slots) {
      cuerpo.append(tarjetaSlot(slot));
    }
  }

  if (cancelados.length > 0) {
    const lista = crear('ul', { class: 'dia__cancelados' });
    for (const turno of cancelados) {
      lista.append(
        crear('li', { class: 'dia__cancelado' }, [
          crear('span', { text: `${turno.hora} · ${nombreCompleto(turno.paciente)}` }),
          badgeEstado('CANCELADO')
        ])
      );
    }
    cuerpo.append(
      crear('details', { class: 'dia__detalle-cancelados' }, [
        crear('summary', { text: `Turnos cancelados (${cancelados.length})` }),
        lista
      ])
    );
  }

  return crear(
    'section',
    { class: `dia${datos.fecha === hoyISO() ? ' dia--hoy' : ''}` },
    [cabecera, cuerpo]
  );
}

function botonesDeEstado(turno, cerrar) {
  const permitidos = store
    .transicionesPermitidas(turno.estado)
    .filter((destino) => destino !== 'ASISTIDO' && destino !== 'AUSENTE');

  return permitidos.map((destino) =>
    crear('button', {
      class: `boton boton--compacto boton--${destino === 'CANCELADO' ? 'peligro' : 'primario'}`,
      type: 'button',
      text: `Marcar como ${etiqueta(destino)}`,
      onclick: async (evento) => {
        const boton = evento.currentTarget;
        boton.disabled = true;
        try {
          if (destino === 'CANCELADO') {
            const aceptado = await confirmar({
              titulo: 'Cancelar el turno',
              mensaje:
                `Se cancelará el turno de ${nombreCompleto(turno.paciente)} ` +
                `del ${fechaLarga(turno.fecha)} a las ${turno.hora}. Esta acción no se puede revertir.`,
              confirmar: 'Sí, cancelar',
              tono: 'peligro'
            });
            if (!aceptado) return;
          }
          store.cambiarEstado(turno.id, destino);
          cerrar();
          renderizar();
          zona.mostrar(`El turno quedó en estado ${etiqueta(destino)}.`, 'exito');
        } catch (fallo) {
          zona.mostrar(fallo.message, 'error');
        } finally {
          boton.disabled = false;
        }
      }
    })
  );
}

function mostrarDetalle(turnoId) {
  const turno = store.turnoPorId(turnoId);
  if (!turno) return;

  const lineas = [
    ['Paciente', nombreCompleto(turno.paciente)],
    ['DNI', turno.paciente?.dni ?? '—'],
    ['Profesional', nombreCompleto(turno.profesional)],
    ['Especialidad', turno.especialidad?.nombre ?? '—'],
    ['Consultorio', turno.profesional?.consultorio ?? '—'],
    ['Fecha', fechaLarga(turno.fecha)],
    ['Hora', `${turno.hora} · ${turno.duracionMin} min`],
    ['Estado', etiqueta(turno.estado)],
    ['Motivo', turno.motivo || 'Sin motivo informado']
  ];

  const lista = crear('dl', { class: 'lista-definicion' });
  for (const [clave, valor] of lineas) {
    lista.append(
      crear('div', { class: 'datos-linea' }, [
        crear('dt', { class: 'datos-linea__clave', text: clave }),
        crear('dd', { class: 'datos-linea__valor', text: valor })
      ])
    );
  }

  const dialogo = crear('dialog', { class: 'dialogo' });
  const cerrar = () => dialogo.close();

  const cuerpo = crear('div', { class: 'dialogo__cuerpo' }, [lista]);

  const puedeOperar =
    sesion?.rol === 'PROFESIONAL' && sesion.profesionalId === turno.profesionalId;

  if (puedeOperar) {
    const acciones = botonesDeEstado(turno, cerrar);
    if (acciones.length > 0) {
      cuerpo.append(crear('div', { class: 'detalle__acciones' }, acciones));
    }
  }

  dialogo.append(
    crear('header', { class: 'dialogo__cabecera' }, [
      crear('h2', { class: 'dialogo__titulo', text: 'Detalle del turno' }),
      crear('button', {
        class: 'dialogo__cerrar',
        type: 'button',
        'aria-label': 'Cerrar',
        text: '×',
        onclick: cerrar
      })
    ]),
    cuerpo,
    crear('footer', { class: 'dialogo__acciones' }, [
      crear('button', {
        class: 'boton boton--secundario',
        type: 'button',
        text: 'Cerrar',
        onclick: cerrar
      })
    ])
  );

  dialogo.addEventListener('close', () => dialogo.remove());
  document.body.append(dialogo);
  dialogo.showModal();
}

function renderizar() {
  const profesional = profesionalElegido();
  vaciar(contenedorAgenda);
  vaciar(resumen);

  if (!profesional) {
    resumen.textContent = 'Elegí un profesional para ver su agenda.';
    contenedorAgenda.append(
      estadoVacio(
        'Seleccioná un profesional',
        'Podés filtrar primero por especialidad para acortar la búsqueda.'
      )
    );
    return;
  }

  if (!store.tieneAgenda(profesional.id)) {
    resumen.textContent = `${nombreCompleto(profesional)} no tiene agenda configurada.`;
    contenedorAgenda.append(
      estadoVacio(
        'Este profesional no tiene horarios de atención',
        'La disponibilidad se define por día de la semana y franja horaria.'
      )
    );
    return;
  }

  const fechas =
    selectVista.value === 'semana' ? store.semanaDe(inputFecha.value) : [inputFecha.value];

  const conGrilla = [];
  const sinGrilla = [];

  for (const fecha of fechas) {
    const agenda = store.agendaDe(profesional.id, fecha);
    (agenda.configurada ? conGrilla : sinGrilla).push(agenda);
  }

  const libres = conGrilla.reduce((total, a) => total + a.libres, 0);
  const ocupados = conGrilla.reduce((total, a) => total + a.ocupados, 0);

  resumen.textContent =
    `${nombreCompleto(profesional)} · ${profesional.consultorio} — ` +
    `${libres} horarios libres y ${ocupados} ocupados en el período elegido.`;

  if (conGrilla.length === 0) {
    contenedorAgenda.append(
      estadoVacio(
        'No se registran horarios de atención para el período seleccionado',
        'Probá con otra fecha o con la vista semanal.'
      )
    );
    return;
  }

  for (const datos of conGrilla) {
    contenedorAgenda.append(bloqueDia(datos));
  }

  if (sinGrilla.length > 0) {
    contenedorAgenda.append(
      crear('details', { class: 'agenda__nota' }, [
        crear('summary', {
          text: `Sin atención ${sinGrilla.length === 1 ? '1 día' : `${sinGrilla.length} días`} del período`
        }),
        crear(
          'ul',
          { class: 'agenda__nota-lista' },
          sinGrilla.map((a) =>
            crear('li', { text: `${nombreDia(a.fecha)} ${fechaRelativa(a.fecha)}` })
          )
        )
      ])
    );
  }
}

selectEspecialidad.addEventListener('change', () => {
  if (selectEspecialidad.disabled) return;
  llenarSelect(
    selectProfesional,
    opcionesProfesionales(selectEspecialidad.value),
    'Todos los profesionales'
  );
  renderizar();
});

selectProfesional.addEventListener('change', renderizar);
inputFecha.addEventListener('change', () => {
  if (!inputFecha.value) inputFecha.value = hoyISO();
  renderizar();
});

selectVista.addEventListener('change', () => {
  renderizar();
  anunciar('Período actualizado');
});

$('#hoy').addEventListener('click', () => {
  inputFecha.value = hoyISO();
  renderizar();
});

$('#limpiar').addEventListener('click', () => {
  if (sesion?.rol !== 'PROFESIONAL') {
    selectEspecialidad.value = '';
    llenarSelect(selectProfesional, opcionesProfesionales(''), 'Todos los profesionales');
  }
  selectVista.value = 'dia';
  inputFecha.value = hoyISO();
  zona.limpiar();
  renderizar();
});

(async function iniciar() {
  if (session.redirigirSiFalta()) return;
  nav.montar();
  nav.montarPie();
  sesion = session.actual();

  try {
    await store.cargar();
    pintarFiltros();
    aplicarRestriccionesDeRol();
    renderizar();
  } catch (fallo) {
    zona.mostrar(fallo.message, 'error');
  }
})();
