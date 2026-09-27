import * as session from './session.js';
import * as seed from './seed.js';
import { $, crear, icono, vaciar } from './ui.js';
import { ETIQUETA_ROL, iniciales, nombreCompleto } from './format.js';

const PAGINAS = {
  dashboard: { href: 'dashboard.html', texto: 'Panel Principal', icono: 'panel' },
  agenda: { href: 'agenda.html', texto: 'Agenda de Turnos', icono: 'agenda' },
  turno: { href: 'turno-form.html', texto: 'Solicitar Turno', icono: 'turno' },
  pacientes: { href: 'pacientes.html', texto: 'Pacientes', icono: 'pacientes' }
};

const VISIBLES_POR_ROL = {
  ADMIN: ['dashboard', 'agenda', 'turno', 'pacientes'],
  RECEPCION: ['dashboard', 'agenda', 'turno', 'pacientes'],
  PROFESIONAL: ['dashboard', 'agenda'],
  PACIENTE: ['dashboard']
};

function enlacesPermitidos(rol) {
  return VISIBLES_POR_ROL[rol] ?? [];
}

function itemActual() {
  const archivo = location.pathname.split('/').pop() || 'index.html';
  return archivo.replace('.html', '');
}

function itemNavegacion(clave, pagina, activa) {
  const enlace = crear('a', {
    class: `nav__enlace${activa ? ' nav__enlace--activo' : ''}`,
    href: pagina.href,
    'aria-current': activa ? 'page' : null
  });
  enlace.append(icono(pagina.icono), crear('span', { text: pagina.texto }));
  return enlace;
}

function marca(sesion) {
  const bloque = crear('a', { class: 'marca', href: 'index.html', 'aria-label': 'TurnoMed, ir al inicio' });
  bloque.append(
    crear('span', { class: 'marca__logo', 'aria-hidden': 'true', text: '+' }),
    crear('span', { class: 'marca__texto' }, [
      crear('strong', { class: 'marca__nombre', text: 'TurnoMed' }),
      crear('span', { class: 'marca__bajada', text: 'Gestión de turnos médicos' })
    ])
  );
  if (!sesion) {
    bloque.append(
      crear('span', { class: 'marca__sesion' }, [
        crear('span', { class: 'marca__rol', text: 'Sesión no iniciada' })
      ])
    );
  }
  return bloque;
}

function panelUsuario(sesion) {
  if (!sesion) {
    return crear('div', { class: 'usuario' }, [
      crear('a', {
        class: 'boton boton--primario boton--compacto',
        href: 'login.html',
        text: 'Iniciar sesión'
      })
    ]);
  }

  const bloque = crear('div', { class: 'usuario' });
  const boton = crear('button', {
    class: 'usuario__boton',
    type: 'button',
    'aria-expanded': 'false',
    'aria-haspopup': 'true',
    'aria-controls': 'menu-usuario'
  });
  boton.append(
    crear('span', { class: 'avatar', 'aria-hidden': 'true', text: iniciales(sesion) }),
    crear('span', { class: 'usuario__datos' }, [
      crear('span', { class: 'usuario__nombre', text: nombreCompleto(sesion) || sesion.nombre }),
      crear('span', { class: 'usuario__rol', text: ETIQUETA_ROL[sesion.rol] ?? sesion.rol })
    ]),
    icono('menu', 'Opciones de sesión')
  );

  const menu = crear('div', { class: 'menu-usuario', id: 'menu-usuario', hidden: true });
  menu.append(
    crear('p', { class: 'menu-usuario__correo', text: sesion.correo }),
    crear('button', {
      class: 'menu-usuario__item',
      type: 'button',
      text: 'Restablecer datos de prueba',
      onclick: async (evento) => {
        const botonActual = evento.currentTarget;
        botonActual.disabled = true;
        await seed.restablecer();
        location.reload();
      }
    }),
    crear('button', {
      class: 'menu-usuario__item menu-usuario__item--salir',
      type: 'button',
      text: 'Cerrar sesión',
      onclick: () => {
        session.cerrarSesion();
        location.href = 'index.html';
      }
    })
  );

  boton.addEventListener('click', () => {
    const abierto = boton.getAttribute('aria-expanded') === 'true';
    boton.setAttribute('aria-expanded', String(!abierto));
    menu.hidden = abierto;
  });

  document.addEventListener('click', (evento) => {
    if (!bloque.contains(evento.target)) {
      menu.hidden = true;
      boton.setAttribute('aria-expanded', 'false');
    }
  });

  bloque.append(boton, menu);
  return bloque;
}

function botonMenu() {
  return crear('button', {
    class: 'nav__alternar',
    type: 'button',
    'aria-label': 'Abrir el menú de navegación',
    'aria-expanded': 'false',
    'aria-controls': 'nav-lista',
    onclick: (evento) => alternarMenu(evento.currentTarget)
  }, [icono('menu', 'Menú')]);
}

function alternarMenu(boton, forzar) {
  const lista = $('#nav-lista');
  if (!lista) return;
  const nav = lista.closest('.nav');
  const abierto = forzar ?? !nav.classList.contains('nav--abierto');
  nav.classList.toggle('nav--abierto', abierto);
  boton.setAttribute('aria-expanded', String(abierto));
}

export function montar(contenedor) {
  const raiz = contenedor ?? $('#app-header');
  if (!raiz) return null;

  const sesion = session.actual();
  const activa = itemActual();
  const permitidos = enlacesPermitidos(sesion?.rol);

  vaciar(raiz);
  raiz.className = 'header';

  const enlaceSalto = crear('a', { class: 'salto-contenido', href: '#contenido', text: 'Ir al contenido' });

  const cabecera = crear('div', { class: 'header__interno' });

  const nav = crear('nav', { class: 'nav', 'aria-label': 'Navegación principal' });
  const lista = crear('ul', { class: 'nav__lista', id: 'nav-lista' });

  if (sesion) {
    for (const clave of permitidos) {
      const pagina = PAGINAS[clave];
      if (!pagina) continue;
      lista.append(
        crear('li', { class: 'nav__item' }, [itemNavegacion(clave, pagina, activa === clave)])
      );
    }
  }

  nav.append(botonMenu(), lista);
  cabecera.append(marca(sesion), nav, panelUsuario(sesion));
  raiz.append(enlaceSalto, cabecera);

  raiz.addEventListener('click', (evento) => {
    if (evento.target.closest('.nav__enlace')) alternarMenu($('.nav__alternar', raiz), false);
  });

  return raiz;
}

export function montarPie(contenedor) {
  const raiz = contenedor ?? $('#app-footer');
  if (!raiz) return null;

  vaciar(raiz);
  raiz.className = 'footer__interno';
  raiz.append(
    crear('p', {
      class: 'footer__texto',
      text: 'TurnoMed · Sistema de Gestión de Turnos Médicos · Datos simulados, sin servidor de aplicación.'
    }),
    crear('p', {
      class: 'footer__creditos',
      text: 'Elpeza, Benitez y Susñar — Aplicaciones Web y Móvil 2026'
    })
  );
  return raiz;
}
