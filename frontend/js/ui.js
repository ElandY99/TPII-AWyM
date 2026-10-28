/* =============================================================
   js/ui.js
   -------------------------------------------------------------
   Componentes visuales y helpers compartidos de Salud Turnos.
   - Sistema de notificaciones emergentes (Toasts).
   - Sistema de modales accesibles con focus trap y escape.
   - Diálogo de confirmación accesible (reemplaza window.confirm).
   - Sanitización contra XSS (AppHelpers.esc).
   - Manejo de fechas locales (AppHelpers.todayLocal, formatDate).
   - Badges y estados de turnos y entidades.
   - Debounce y prevención de doble submit.
   ============================================================= */

(function () {
  'use strict';

  window.AppHelpers = window.AppHelpers || {};
  window.AppUI = window.AppUI || {};

  /* -------------------------------------------------------------
     1. HELPERS DE SANITIZACIÓN Y FORMATO
     ------------------------------------------------------------- */

  /**
   * Escapa caracteres especiales de HTML para prevenir inyecciones XSS (DT-06).
   * @param {any} val
   * @returns {string}
   */
  function esc(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Devuelve la fecha de hoy en formato YYYY-MM-DD usando la zona local del navegador (DT-07).
   * Evita el desfasaje UTC después de las 21:00 hs en Argentina.
   * @returns {string}
   */
  function todayLocal() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatea una fecha YYYY-MM-DD a DD/MM/AAAA para visualización de usuario (FE-GEN-11).
   * @param {string} isoDate
   * @returns {string}
   */
  function formatDate(isoDate) {
    if (!isoDate || typeof isoDate !== 'string') return '-';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  /**
   * Formatea una fecha y hora ISO para visualización.
   * @param {string} isoDateTime
   * @returns {string}
   */
  function formatDateTime(isoDateTime) {
    if (!isoDateTime) return '-';
    // Formatos posibles: "YYYY-MM-DD HH:MM:SS" o ISO standard
    const [datePart, timePart] = isoDateTime.split(' ');
    if (datePart && timePart) {
      return `${formatDate(datePart)} ${timePart.slice(0, 5)}`;
    }
    return isoDateTime;
  }

  /**
   * Devuelve una función debounced para optimizar búsquedas en tiempo real (DT-11).
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* -------------------------------------------------------------
     2. ESTADOS Y BADGES DE TURNOS Y ENTIDADES (DT-10)
     ------------------------------------------------------------- */
  const ESTADOS_TURNO = {
    PENDIENTE: { label: 'Pendiente', css: 'pendiente' },
    CONFIRMADO: { label: 'Confirmado', css: 'confirmado' },
    EN_CONSULTORIO: { label: 'En Consultorio', css: 'en-consultorio' },
    ASISTIDO: { label: 'Asistido', css: 'asistido' },
    AUSENTE: { label: 'Ausente', css: 'ausente' },
    CANCELADO: { label: 'Cancelado', css: 'cancelado' }
  };

  /**
   * Genera el HTML de un badge para el estado de un turno.
   * @param {string} estado
   * @returns {string}
   */
  function statusBadge(estado) {
    if (!estado) return '<span class="badge">-</span>';
    const info = ESTADOS_TURNO[estado] || {
      label: estado,
      css: String(estado).toLowerCase().replace(/_/g, '-')
    };
    return `<span class="badge ${esc(info.css)}">${esc(info.label)}</span>`;
  }

  /**
   * Genera el HTML de un badge de activo / inactivo.
   * @param {number|boolean} estado
   * @returns {string}
   */
  function activeBadge(estado) {
    const isActivo = estado === 1 || estado === true || estado === '1';
    return isActivo
      ? '<span class="badge activo">Activo</span>'
      : '<span class="badge inactivo">Inactivo</span>';
  }

  /* -------------------------------------------------------------
     3. SISTEMA DE TOASTS FLOTANTES
     ------------------------------------------------------------- */
  function showToast(message, type = 'info', duration = 5000) {
    if (!message) return;

    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const isOk = type === 'ok' || type === 'success';
    const isBad = type === 'bad' || type === 'error' || type === 'danger';
    const toastClass = isOk ? 'ok' : isBad ? 'bad' : 'info';
    const icon = isOk ? '✓' : isBad ? '✕' : 'ℹ';

    const toast = document.createElement('div');
    toast.className = `toast ${toastClass}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${esc(message)}</span>
      <button class="toast-close" type="button" aria-label="Cerrar notificación">&times;</button>
    `;

    container.appendChild(toast);

    let isClosing = false;
    function removeToast() {
      if (isClosing) return;
      isClosing = true;
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 350);
    }

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) closeBtn.addEventListener('click', removeToast);

    setTimeout(removeToast, duration);
  }

  /* -------------------------------------------------------------
     4. SISTEMA DE MODALES ACCESIBLES (DT-12)
     ------------------------------------------------------------- */
  /**
   * Crea y abre un modal accesible con backdrop, focus trap y cierre con Escape.
   * @param {Object} config
   * @param {string} config.title
   * @param {string|HTMLElement} config.content
   * @param {Array<{ label: string, className?: string, onClick?: Function, type?: string }>} [config.actions]
   * @param {Function} [config.onClose]
   * @param {string} [config.size] 'sm' | 'md' | 'lg'
   * @returns {{ close: Function, element: HTMLElement }}
   */
  function openModal({ title, content, actions = [], onClose, size = 'md' }) {
    const prevActiveElement = document.activeElement;
    const modalId = `modal_${Date.now()}`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `${modalId}_title`);

    const dialog = document.createElement('div');
    dialog.className = `modal-dialog modal-${size}`;

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h2 id="${modalId}_title" class="modal-title">${esc(title)}</h2>
      <button type="button" class="modal-close-btn" aria-label="Cerrar ventana modal">&times;</button>
    `;

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    actions.forEach((act) => {
      const btn = document.createElement('button');
      btn.type = act.type || 'button';
      btn.className = act.className || 'btn btn-light';
      btn.textContent = act.label;
      btn.addEventListener('click', (e) => {
        if (act.onClick) {
          act.onClick(e, closeModal);
        } else {
          closeModal();
        }
      });
      footer.appendChild(btn);
    });

    dialog.appendChild(header);
    dialog.appendChild(body);
    if (actions.length > 0) {
      dialog.appendChild(footer);
    }
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    let isClosed = false;
    function closeModal() {
      if (isClosed) return;
      isClosed = true;
      document.removeEventListener('keydown', handleKeyDown);
      overlay.classList.add('modal-closing');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (prevActiveElement && typeof prevActiveElement.focus === 'function') {
          prevActiveElement.focus();
        }
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 200);
    }

    // Botón de cerrar del header
    const closeBtn = header.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', closeModal);

    // Clic fuera del diálogo (en overlay)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Manejo de foco (Focus Trap) y tecla Escape
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = dialog.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Enfocar primer elemento interactivo
    setTimeout(() => {
      const focusable = dialog.querySelector(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button.btn-primary, button:not([disabled])'
      );
      if (focusable) {
        focusable.focus();
      } else {
        closeBtn.focus();
      }
    }, 50);

    return {
      close: closeModal,
      element: overlay,
      dialog
    };
  }

  /**
   * Diálogo modal de confirmación accesible (reemplaza window.confirm).
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.message
   * @param {string} [options.confirmText]
   * @param {string} [options.cancelText]
   * @param {boolean} [options.isDanger]
   * @returns {Promise<boolean>}
   */
  function confirmDialog({
    title = '¿Está seguro?',
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDanger = false
  }) {
    return new Promise((resolve) => {
      openModal({
        title,
        size: 'sm',
        content: `<p class="confirm-message">${esc(message)}</p>`,
        actions: [
          {
            label: cancelText,
            className: 'btn btn-light',
            onClick: (_, close) => {
              resolve(false);
              close();
            }
          },
          {
            label: confirmText,
            className: isDanger ? 'btn btn-danger' : 'btn btn-primary',
            onClick: (_, close) => {
              resolve(true);
              close();
            }
          }
        ],
        onClose: () => resolve(false)
      });
    });
  }

  /* -------------------------------------------------------------
     5. PREVENCIÓN DE DOBLE ENVÍO Y ESTADOS DE CARGA (DT-09)
     ------------------------------------------------------------- */
  /**
   * Establece el estado de carga de un botón de formulario.
   * @param {HTMLButtonElement} buttonEl
   * @param {boolean} isLoading
   * @param {string} [loadingText]
   */
  function setLoading(buttonEl, isLoading, loadingText = 'Guardando...') {
    if (!buttonEl) return;
    if (isLoading) {
      buttonEl.dataset.originalText = buttonEl.textContent;
      buttonEl.disabled = true;
      buttonEl.innerHTML = `<span class="spinner-sm"></span> ${esc(loadingText)}`;
    } else {
      buttonEl.disabled = false;
      if (buttonEl.dataset.originalText) {
        buttonEl.textContent = buttonEl.dataset.originalText;
        delete buttonEl.dataset.originalText;
      }
    }
  }

  /**
   * Mapea un objeto de errores de campos ({ campo: 'error' }) a los elementos <small class="error">
   * y resalta los inputs asociados.
   * @param {HTMLFormElement} formEl
   * @param {Object} campos
   */
  function renderFieldErrors(formEl, campos = {}) {
    if (!formEl) return;

    // Limpia errores previos
    formEl.querySelectorAll('.error, small.error').forEach((el) => {
      el.textContent = '';
    });
    formEl.querySelectorAll('.input-error').forEach((el) => {
      el.classList.remove('input-error');
    });

    if (!campos || typeof campos !== 'object') return;

    for (const [campo, mensaje] of Object.entries(campos)) {
      // Intenta id con campo directo o primer segmento (ej: "profesional.matricula" -> "matricula" o "profesional_matricula")
      const candidateIds = [
        `${campo}Error`,
        `${campo.replace(/\./g, '_')}Error`,
        `${campo.split('.').pop()}Error`
      ];

      let errorEl = null;
      for (const id of candidateIds) {
        errorEl = formEl.querySelector(`#${id}`);
        if (errorEl) break;
      }

      if (errorEl) {
        errorEl.textContent = mensaje;
      }

      // Marcar input correspondiente
      const inputCandidates = [
        `[name="${campo}"]`,
        `#${campo}`,
        `#${campo.replace(/\./g, '_')}`,
        `#${campo.split('.').pop()}`
      ];
      let inputEl = null;
      for (const sel of inputCandidates) {
        inputEl = formEl.querySelector(sel);
        if (inputEl) break;
      }
      if (inputEl) {
        inputEl.classList.add('input-error');
      }
    }
  }

  // Exportar al ámbito global
  Object.assign(window.AppHelpers, {
    esc,
    todayLocal,
    formatDate,
    formatDateTime,
    debounce,
    statusBadge,
    activeBadge,
    showToast
  });

  Object.assign(window.AppUI, {
    showToast,
    modal: openModal,
    confirm: confirmDialog,
    setLoading,
    renderFieldErrors
  });
})();
