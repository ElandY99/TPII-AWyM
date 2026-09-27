import { ETIQUETA_ESTADO } from './format.js';

export const $ = (selector, raiz = document) => raiz.querySelector(selector);
export const $$ = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));

export function crear(tag, atributos = {}, hijos = []) {
  const elemento = document.createElement(tag);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === 'class') elemento.className = valor;
    else if (clave === 'text') elemento.textContent = valor;
    else if (clave === 'dataset') Object.assign(elemento.dataset, valor);
    else if (clave.startsWith('on') && typeof valor === 'function') {
      elemento.addEventListener(clave.slice(2).toLowerCase(), valor);
    } else if (valor === true) elemento.setAttribute(clave, '');
    else elemento.setAttribute(clave, valor);
  }
  const lista = Array.isArray(hijos) ? hijos : [hijos];
  for (const hijo of lista) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    elemento.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return elemento;
}

export function vaciar(elemento) {
  while (elemento.firstChild) elemento.removeChild(elemento.firstChild);
  return elemento;
}

export function badgeEstado(estado) {
  return crear('span', {
    class: `badge badge--${estado.toLowerCase()}`,
    text: ETIQUETA_ESTADO[estado] ?? estado
  });
}

export function icono(nombre, etiqueta = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `icono icono--${nombre}`);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', TRAZADOS[nombre] ?? TRAZADOS.ayuda);
  svg.append(path);
  if (etiqueta) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', etiqueta);
  }
  return svg;
}

const TRAZADOS = {
  calendario:
    'M7 3v3m10-3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  agenda: 'M4 5h16v15H4zM4 9h16M8 3v4m8-4v4',
  pacientes:
    'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM21 19v-1a4 4 0 0 0-3-3.9',
  turno: 'M12 8v5l3 2M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z',
  panel: 'M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z',
  buscar: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm9 16-4.5-4.5',
  cerrar: 'M6 6l12 12M18 6 6 18',
  alerta: 'M12 3 2 20h20L12 3Zm0 6v5m0 3v.5',
  exito: 'M20 6 9 17l-5-5',
  info: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 5v.5m0 3V16',
  ayuda: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm-2 7a2 2 0 1 1 2.6 1.9c-.4.2-.6.6-.6 1V14m0 3v.5',
  salir: 'M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h9',
  reiniciar: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  reloj: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 4v5l3 2',
  buscarTurno: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm9 16-4.5-4.5M8 11h6',
  mapa: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  documento:
    'M7 3h7l5 5v13H7zM14 3v5h5M10 13h5M10 17h5',
  libro: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm2 0v14'
};

export function zonaMensajes(contenedor = '[data-zona-mensajes]') {
  const nodo = $(contenedor);
  return {
    nodo,
    mostrar(mensaje, tipo = 'info') {
      if (!nodo) return null;
      vaciar(nodo);
      const aviso = crear('div', {
        class: `alerta alerta--${tipo}`,
        role: tipo === 'error' ? 'alert' : 'status'
      });
      aviso.append(icono(tipo === 'error' ? 'alerta' : tipo === 'exito' ? 'exito' : 'info'));
      aviso.append(crear('p', { class: 'alerta__texto', text: mensaje }));
      const cerrar = crear('button', {
        class: 'alerta__cerrar',
        type: 'button',
        'aria-label': 'Cerrar aviso',
        text: '×',
        onclick: () => aviso.remove()
      });
      aviso.append(cerrar);
      nodo.append(aviso);
      return aviso;
    },
    limpiar() {
      if (nodo) vaciar(nodo);
    }
  };
}

export function mensajeEnLinea(campo, texto, tipo = 'error') {
  const id = `${campo.id}-error`;
  let nodo = document.getElementById(id);
  const contenedor = campo.closest('.campo') ?? campo.parentElement;

  if (!nodo) {
    nodo = crear('p', { class: 'campo__error', id });
    nodo.setAttribute('role', 'alert');
    contenedor.append(nodo);
  }

  nodo.textContent = texto;
  nodo.className = `campo__error campo__error--${tipo}`;
  nodo.hidden = !texto;

  campo.classList.toggle('campo__control--invalido', tipo === 'error');
  campo.classList.toggle('campo__control--valido', tipo === 'exito' && texto.length > 0);

  if (tipo === 'error' && texto) {
    campo.setAttribute('aria-invalid', 'true');
  } else {
    campo.removeAttribute('aria-invalid');
  }
  return nodo;
}

export function limpiarErrores(raiz) {
  $$('.campo__error', raiz).forEach((nodo) => {
    nodo.hidden = true;
    nodo.textContent = '';
  });
  $$('.campo__control--invalido, .campo__control--valido', raiz).forEach((nodo) => {
    nodo.classList.remove('campo__control--invalido', 'campo__control--valido');
    nodo.removeAttribute('aria-invalid');
  });
}

export function enfocarPrimerError(campos) {
  const primero = campos[0];
  if (primero) {
    primero.focus();
    primero.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

export function estadoVacio(mensaje, detalle = '') {
  return crear('div', { class: 'estado-vacio' }, [
    icono('buscar'),
    crear('p', { class: 'estado-vacio__mensaje', text: mensaje }),
    detalle ? crear('p', { class: 'estado-vacio__detalle', text: detalle }) : null
  ]);
}

let dialogoSecundario = null;

export function confirmar({ titulo, mensaje, confirmar: textoConfirmar = 'Confirmar', tono = 'primario' }) {
  return new Promise((resolve) => {
    const dialogo = crear('dialog', { class: 'dialogo' });
    const formulario = crear('form', { method: 'dialog', class: 'dialogo__form' });

    const tituloNodo = crear('h2', { class: 'dialogo__titulo', id: 'dialogo-titulo', text: titulo });
    formulario.append(crear('header', { class: 'dialogo__cabecera' }, [tituloNodo]));
    formulario.append(crear('p', { class: 'dialogo__mensaje', text: mensaje }));

    const acciones = crear('footer', { class: 'dialogo__acciones' });
    const cancelar = crear('button', {
      class: 'boton boton--secundario',
      type: 'button',
      text: 'Cancelar',
      onclick: () => {
        dialogo.close('cancelar');
      }
    });
    const aceptar = crear('button', {
      class: `boton boton--${tono}`,
      type: 'submit',
      value: 'confirmar',
      text: textoConfirmar
    });
    acciones.append(cancelar, aceptar);
    formulario.append(acciones);
    dialogo.append(formulario);

    dialogo.addEventListener('close', () => {
      resolve(dialogo.returnValue === 'confirmar');
      dialogo.remove();
    });

    dialogoSecundario?.remove();
    dialogoSecundario = dialogo;
    document.body.append(dialogo);
    dialogo.showModal();
    aceptar.focus();
  });
}

export function abrirDetalle(contenido) {
  const dialogo = crear('dialog', { class: 'dialogo' });
  const cabecera = crear('header', { class: 'dialogo__cabecera' }, [
    crear('h2', { class: 'dialogo__titulo', text: 'Detalle del turno' }),
    crear('button', {
      class: 'dialogo__cerrar',
      type: 'button',
      'aria-label': 'Cerrar',
      text: '×',
      onclick: () => dialogo.close()
    })
  ]);
  const cuerpo = crear('div', { class: 'dialogo__cuerpo' }, [contenido]);
  const acciones = crear('footer', { class: 'dialogo__acciones' }, [
    crear('button', {
      class: 'boton boton--secundario',
      type: 'button',
      text: 'Cerrar',
      onclick: () => dialogo.close()
    })
  ]);

  dialogo.append(cabecera, cuerpo, acciones);
  dialogo.addEventListener('close', () => dialogo.remove());
  document.body.append(dialogo);
  dialogo.showModal();
  return dialogo;
}

export function opcion(texto, valor, seleccionado = false) {
  return crear('option', { value: valor, text, selected: seleccionado || undefined });
}

export function llenarSelect(select, elementos, textoVacio) {
  vaciar(select);
  select.append(opcion(textoVacio, ''));
  for (const item of elementos) {
    select.append(opcion(item.texto, item.valor));
  }
  select.disabled = elementos.length === 0;
}

export function anunciar(mensaje) {
  const zona = crear('div', {
    class: 'sr-solo',
    role: 'status',
    'aria-live': 'polite',
    text: mensaje
  });
  document.body.append(zona);
  setTimeout(() => zona.remove(), 4000);
}
