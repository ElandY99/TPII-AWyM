import * as nav from '../core/nav.js';
import * as session from '../core/session.js';
import * as store from '../core/store.js';
import {
  $,
  anunciar,
  badgeEstado,
  crear,
  estadoVacio,
  icono,
  vaciar,
  zonaMensajes
} from '../core/ui.js';
import {
  ETIQUETA_ESTADO,
  ESTADOS,
  fechaLarga,
  fechaRelativa,
  hoyISO,
  nombreCompleto
} from '../core/format.js';

const contenedorIndicadores = $('#indicadores');
const contenedorAccesos = $('#accesos');
const contenedorProximos = $('#proximos');
const contenedorEstados = $('#estados');
const zona = zonaMensajes('[data-zona-mensajes]');

let sesion = null;

function saludo() {
  const hora = new Date().getHours();
  const momento = hora < 12 ? 'Buen día' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';
  return `${momento}, ${sesion.nombre.split(' ')[0]}`;
}

function tarjetaIndicador(valor, etiqueta, { tono = 'neutro', detalle = '' } = {}) {
  return crear('article', { class: `indicador indicador--${tono}` }, [
    crear('span', { class: 'indicador__valor', text: String(valor) }),
    crear('span', { class: 'indicador__etiqueta', text: etiqueta }),
    detalle ? crear('span', { class: 'indicador__detalle', text: detalle }) : null
  ]);
}

function tarjetaAcceso(href, iconoNombre, titulo, texto) {
  const enlace = crear('a', { class: 'tarjeta-accion', href });

  const cabecera = crear('div', { class: 'tarjeta__cabecera' });
  cabecera.append(crear('span', { class: 'tarjeta-accion__icono' }, [icono(iconoNombre)]));
  cabecera.append(crear('h3', { class: 'tarjeta-accion__titulo', text: titulo }));

  enlace.append(cabecera, crear('p', { class: 'tarjeta-accion__texto', text: texto }));
  return enlace;
}

function itemTurno(turno) {
  const boton = crear('button', {
    class: 'item-turno',
    type: 'button',
    onclick: () => {
      location.href = `agenda.html?profesional=${encodeURIComponent(turno.profesionalId)}&fecha=${turno.fecha}`;
    }
  });

  boton.append(
    crear('span', { class: 'item-turno__hora', text: turno.hora }),
    crear('span', { class: 'item-turno__datos' }, [
      crear('span', { class: 'item-turno__paciente', text: nombreCompleto(turno.paciente) }),
      crear('span', {
        class: 'item-turno__meta',
        text: `${nombreCompleto(turno.profesional)} · ${turno.especialidad?.nombre ?? '—'} · ${turno.profesional?.consultorio ?? '—'}`
      })
    ]),
    crear('span', { class: 'item-turno__fecha' }, [
      crear('span', { class: 'item-turno__meta', text: fechaRelativa(turno.fecha) }),
      badgeEstado(turno.estado)
    ])
  );

  return boton;
}

function filtrosDelRol() {
  if (sesion.rol === 'PROFESIONAL') {
    return { profesionalId: sesion.profesionalId };
  }
  if (sesion.rol === 'PACIENTE') {
    return { pacienteId: sesion.pacienteId };
  }
  return {};
}

function capacidadDeHoy() {
  return store
    .profesionales()
    .reduce((total, profesional) => total + store.agendaDe(profesional.id, hoyISO()).slots.length, 0);
}

function indicadoresAdmin() {
  const hoy = hoyISO();
  const reservasDelDia = store.turnosDeHoy();
  const vigentes = reservasDelDia.filter((t) => t.estado !== 'CANCELADO');
  const capacidad = capacidadDeHoy();
  const ocupacion = capacidad === 0 ? 0 : Math.round((vigentes.length / capacidad) * 100);
  const datos = store.indicadores();

  vaciar(contenedorIndicadores);
  contenedorIndicadores.append(
    tarjetaIndicador(vigentes.length, 'Turnos del día', {
      tono: 'alerta',
      detalle: fechaLarga(hoy)
    }),
    tarjetaIndicador(datos.porEstado.PENDIENTE, 'Pendientes de confirmar', { tono: 'alerta' }),
    tarjetaIndicador(`${ocupacion}%`, 'Ocupación de la agenda', {
      tono: ocupacion >= 80 ? 'exito' : 'neutro',
      detalle: `${capacidad} franjas disponibles hoy`
    }),
    tarjetaIndicador(datos.porEstado.ASISTIDO, 'Asistidos en total', { tono: 'exito' })
  );
}

function indicadoresRecepcion() {
  const datos = store.indicadores();
  const sinConfirmar = store.turnos({ estados: ['PENDIENTE'] });
  const total = store.pacientes().length;

  vaciar(contenedorIndicadores);
  contenedorIndicadores.append(
    tarjetaIndicador(sinConfirmar.length, 'Turnos por confirmar', {
      tono: 'alerta',
      detalle: 'Requieren contacto con el paciente'
    }),
    tarjetaIndicador(store.turnosDeHoy().length, 'Reservas de hoy', { tono: 'neutro' }),
    tarjetaIndicador(total, 'Pacientes activos', { tono: 'exito' }),
    tarjetaIndicador(datos.porEstado.CANCELADO, 'Cancelados', { tono: 'neutro' })
  );
}

function indicadoresProfesional() {
  const profesional = store.profesionalPorId(sesion.profesionalId);
  const agenda = store.agendaDe(sesion.profesionalId, hoyISO());
  const misTurnos = store.turnos({ profesionalId: sesion.profesionalId });
  const sinCerrar = misTurnos.filter(
    (t) => t.estado === 'PENDIENTE' || t.estado === 'CONFIRMADO' || t.estado === 'EN_CONSULTORIO'
  );

  vaciar(contenedorIndicadores);
  contenedorIndicadores.append(
    tarjetaIndicador(misTurnos.length, 'Turnos en mi agenda', {
      tono: 'neutro',
      detalle: profesional?.consultorio ?? '—'
    }),
    tarjetaIndicador(agenda.libres, 'Horarios libres hoy', { tono: 'exito' }),
    tarjetaIndicador(sinCerrar.length, 'Pendientes de atender', { tono: 'alerta' }),
    tarjetaIndicador(store.proximosTurnos(1, { profesionalId: sesion.profesionalId }).length, 'Próximo turno', {
      tono: 'neutro',
      detalle: proximoTexto(sesion.profesionalId)
    })
  );
}

function proximoTexto(profesionalId) {
  const proximo = store.proximosTurnos(1, { profesionalId })[0];
  return proximo ? `${proximo.hora} · ${fechaRelativa(proximo.fecha)}` : 'Sin turnos futuros';
}

function indicadoresPaciente() {
  const misTurnos = store.turnos({ pacienteId: sesion.pacienteId });
  const futuros = misTurnos.filter((t) => t.fecha >= hoyISO() && t.estado !== 'CANCELADO');
  const proximo = futuros[0];

  vaciar(contenedorIndicadores);
  contenedorIndicadores.append(
    tarjetaIndicador(futuros.length, 'Turnos reservados', {
      tono: 'neutro',
      detalle: 'Incluidos los de hoy'
    }),
    tarjetaIndicador(proximo ? proximo.hora : '—', 'Próximo horario', {
      tono: 'exito',
      detalle: proximo ? fechaLarga(proximo.fecha) : 'No tenés turnos programados'
    }),
    tarjetaIndicador(misTurnos.filter((t) => t.estado === 'ASISTIDO').length, 'Consultas atendidas', {
      tono: 'neutro'
    }),
    tarjetaIndicador(misTurnos.filter((t) => t.estado === 'CANCELADO').length, 'Turnos cancelados', {
      tono: 'neutro'
    })
  );
}

function pintarAccesos() {
  vaciar(contenedorAccesos);

  const accesos = {
    ADMIN: [
      ['agenda.html', 'agenda', 'Agenda general', 'Revisar la disponibilidad de todo el centro.'],
      ['turno-form.html', 'turno', 'Reservar turno', 'Registrar una atención en un horario libre.'],
      ['pacientes.html', 'pacientes', 'Pacientes', 'Consultar y dar de alta fichas de pacientes.']
    ],
    RECEPCION: [
      ['turno-form.html', 'turno', 'Reservar turno', 'Registrar una atención en un horario libre.'],
      ['agenda.html', 'agenda', 'Agenda del día', 'Ver los horarios libres y ocupados de hoy.'],
      ['pacientes.html', 'pacientes', 'Pacientes', 'Consultar y dar de alta fichas de pacientes.']
    ],
    PROFESIONAL: [
      ['agenda.html', 'agenda', 'Mi agenda', 'Ver mi disponibilidad y mis turnos por día.'],
      ['pacientes.html', 'pacientes', 'Pacientes', 'Consultar los datos de los pacientes atendidos.']
    ],
    PACIENTE: [
      ['agenda.html', 'agenda', 'Consultar agenda', 'Revisar la disponibilidad de los profesionales.'],
      ['pacientes.html', 'pacientes', 'Mis datos', 'Ver la información de mi ficha.']
    ]
  };

  for (const [href, icono, titulo, texto] of accesos[sesion.rol] ?? []) {
    contenedorAccesos.append(tarjetaAcceso(href, icono, titulo, texto));
  }
}

function pintarProximos() {
  vaciar(contenedorProximos);
  const lista = store.proximosTurnos(6, filtrosDelRol());

  const textos = {
    ADMIN: 'Los próximos turnos registrados en el centro.',
    RECEPCION: 'Turnos a los que hay que llamar para confirmar.',
    PROFESIONAL: 'Tu próxima cola de atención.',
    PACIENTE: 'Los turnos que tenés reservados.'
  };
  $('#ayuda-proximos').textContent = textos[sesion.rol] ?? '';

  if (lista.length === 0) {
    contenedorProximos.append(
      estadoVacio('No hay turnos programados por delante', 'Registrá uno desde Solicitar turno.')
    );
    return;
  }

  for (const turno of lista) {
    contenedorProximos.append(itemTurno(turno));
  }
}

function pintarEstados() {
  vaciar(contenedorEstados);
  const datos = store.indicadores(filtrosDelRol());
  const relevantes = ESTADOS.filter((estado) => datos.porEstado[estado] > 0);

  if (relevantes.length === 0) {
    contenedorEstados.append(
      estadoVacio('Todavía no hay turnos registrados', 'Los estados van a aparecer acá.')
    );
    return;
  }

  for (const estado of relevantes) {
    const porcentaje = datos.total === 0 ? 0 : Math.round((datos.porEstado[estado] / datos.total) * 100);
    contenedorEstados.append(
      crear('article', { class: 'reparto' }, [
        crear('div', { class: 'reparto__cabecera' }, [
          crear('span', { class: 'reparto__etiqueta', text: ETIQUETA_ESTADO[estado] }),
          crear('span', { class: 'reparto__cantidad', text: String(datos.porEstado[estado]) })
        ]),
        crear('div', {
          class: 'reparto__barra',
          role: 'img',
          'aria-label': `${datos.porEstado[estado]} de ${datos.total} turnos en estado ${ETIQUETA_ESTADO[estado]}`
        }, [crear('span', { class: `reparto__relleno reparto__relleno--${estado.toLowerCase()}`, style: `width: ${porcentaje}%` })]),
        crear('p', { class: 'reparto__detalle', text: `${porcentaje}% del total` })
      ])
    );
  }
}

function pintarEncabezado() {
  $('#saludo').textContent = saludo();
  const ayudas = {
    ADMIN: 'Indicadores generales de todo el centro de salud.',
    RECEPCION: 'Pendientes de hoy y estado de las reservas activas.',
    PROFESIONAL: 'Tu agenda, tus próximos pacientes y el estado de tus turnos.',
    PACIENTE: 'Consultá los turnos que tenés reservados.'
  };
  $('#ayuda-panel').textContent = ayudas[sesion.rol] ?? '';
  document.title = `Panel principal · ${nombreCompleto(sesion)} · TurnoMed`;
}

function renderizar() {
  pintarEncabezado();
  pintarAccesos();

  if (sesion.rol === 'ADMIN') indicadoresAdmin();
  else if (sesion.rol === 'RECEPCION') indicadoresRecepcion();
  else if (sesion.rol === 'PROFESIONAL') indicadoresProfesional();
  else indicadoresPaciente();

  pintarProximos();
  pintarEstados();
  anunciar('Panel actualizado');
}

(async function iniciar() {
  if (session.redirigirSiFalta()) return;
  nav.montar();
  nav.montarPie();
  sesion = session.actual();

  try {
    await store.cargar();
    renderizar();
  } catch (fallo) {
    zona.mostrar(fallo.message, 'error');
  }
})();
