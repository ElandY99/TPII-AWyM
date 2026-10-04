/* =============================================================
   data.js
   -------------------------------------------------------------
   Este archivo cumple dos funciones principales:

   1) Define datos simulados para poder probar el Front-End.
   2) Proporciona funciones simples para leer y guardar información
      utilizando localStorage.

   IMPORTANTE:
   - No existe una base de datos real.
   - No existe un backend.
   - localStorage pertenece al navegador del usuario.
   - Los datos se mantienen mientras no se borre el almacenamiento
     del navegador.
   ============================================================= */

/*
  Se utiliza una función autoejecutable (IIFE).
  Esto evita dejar variables internas sueltas en el ámbito global.
*/
(function () {

  /* -----------------------------------------------------------
     DATOS INICIALES DEL SISTEMA
     -----------------------------------------------------------
     Estos datos se utilizan solamente la primera vez que se pide
     cada colección y todavía no existe información en localStorage.
  ----------------------------------------------------------- */
  const defaults = {

    // Usuario simulado para probar el Login.
    users: [
      {
        email: 'admin@saludturnos.com',
        password: '1234',
        role: 'Administrador'
      }
    ],

    // Especialidades disponibles.
    specialties: [
      { id: 1, name: 'Clínica médica' },
      { id: 2, name: 'Pediatría' },
      { id: 3, name: 'Cardiología' }
    ],

    // Profesionales y la especialidad a la que pertenece cada uno.
    doctors: [
      {
        id: 1,
        name: 'Dra. Laura Gómez',
        specialtyId: 1,
        office: '101'
      },
      {
        id: 2,
        name: 'Dr. Martín Pérez',
        specialtyId: 2,
        office: '102'
      },
      {
        id: 3,
        name: 'Dra. Carla Núñez',
        specialtyId: 3,
        office: '103'
      }
    ],

    // Pacientes de ejemplo.
    patients: [
      {
        id: 1,
        dni: '30111222',
        nombre: 'Ana',
        apellido: 'López',
        telefono: '3764-111111',
        correo: 'ana@email.com',
        estado: true
      },
      {
        id: 2,
        dni: '28777444',
        nombre: 'Luis',
        apellido: 'Díaz',
        telefono: '3765-222222',
        correo: 'luis@email.com',
        estado: true
      }
    ],

    // Turnos iniciales utilizados para mostrar contenido en Dashboard y Agenda.
    turns: [
      {
        id: 1,
        patientId: 1,
        doctorId: 1,
        date: '2026-10-06',
        time: '09:00',
        status: 'Confirmado',
        motivo: 'Control'
      },
      {
        id: 2,
        patientId: 2,
        doctorId: 2,
        date: '2026-10-06',
        time: '09:30',
        status: 'Pendiente',
        motivo: 'Consulta'
      }
    ],

    // Horarios posibles para la agenda.
    hours: [
      '08:30',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30'
    ]
  };

  /* -----------------------------------------------------------
     FUNCIÓN read(key)
     -----------------------------------------------------------
     Recibe el nombre de una colección, por ejemplo:
       AppData.read('patients')

     1) Busca en localStorage una clave llamada saludturnos_patients.
     2) Si existe, convierte el JSON a un objeto/arreglo JavaScript.
     3) Si no existe, guarda los datos iniciales y los devuelve.
  ----------------------------------------------------------- */
  function read(key) {
    const storageKey = 'saludturnos_' + key;
    const stored = localStorage.getItem(storageKey);

    // Si ya existen datos guardados, se devuelven esos datos.
    if (stored) {
      return JSON.parse(stored);
    }

    // Si todavía no existen, se guardan los valores por defecto.
    localStorage.setItem(storageKey, JSON.stringify(defaults[key]));

    /*
      Se devuelve una copia para evitar modificar accidentalmente
      el objeto defaults original.
    */
    return JSON.parse(JSON.stringify(defaults[key]));
  }

  /* -----------------------------------------------------------
     FUNCIÓN write(key, value)
     -----------------------------------------------------------
     Guarda una colección completa en localStorage.

     Ejemplo:
       AppData.write('patients', patients);
  ----------------------------------------------------------- */
  function write(key, value) {
    const storageKey = 'saludturnos_' + key;
    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  /*
    Se crea un único objeto global llamado AppData.
    Los demás archivos JavaScript pueden usarlo así:

      AppData.read('turns');
      AppData.write('turns', turns);
  */
  window.AppData = {
    defaults,
    read,
    write
  };

  /* -----------------------------------------------------------
     SISTEMA DE NOTIFICACIONES FLOTANTES (TOASTS) EN APPHELPERS
     -----------------------------------------------------------
     AppHelpers proporciona utilidades globales a la aplicación.
     Aquí se define `AppHelpers.showToast`, encargado de renderizar
     mensajitos flotantes en la esquina superior derecha.
  ----------------------------------------------------------- */
  window.AppHelpers = window.AppHelpers || {};

  /*  Muestra un mensaje emergente (Toast) en la esquina superior derecha.
  
  El texto explicativo de la notificación.
  El tipo de notificación: 'ok' / 'success' (verde), 'bad' / 'error' (rojo), o 'info' (azul).
  Tiempo en milisegundos antes de ocultar automáticamente (por defecto 5000ms / 5s).
  ----------------------------------------------------------- */

  window.AppHelpers.showToast = function (message, type = 'info', duration = 5000) {
    if (!message) return;

    // Crea o recupera el contenedor flotante #toastContainer en el DOM
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // Determina el estilo visual (ok / bad / info) e icono correspondiente
    const isOk = type === 'ok' || type === 'success';
    const isBad = type === 'bad' || type === 'error' || type === 'danger';
    const toastClass = isOk ? 'ok' : isBad ? 'bad' : 'info';
    const icon = isOk ? '✓' : isBad ? '✕' : 'ℹ';

    // Genera el elemento HTML de la notificación emergente
    const toast = document.createElement('div');
    toast.className = `toast ${toastClass}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
      <button class="toast-close" aria-label="Cerrar notificación">&times;</button>
    `;

    container.appendChild(toast);

    // Función encargada de animar la salida y remover el elemento del DOM
    let isClosing = false;
    function removeToast() {
      if (isClosing) return;
      isClosing = true;
      toast.classList.add('hide');
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 350);
    }

    // Permite al usuario cerrar la notificación manualmente antes de los 5s
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', removeToast);
    }

    // Temporizador automático de 5 segundos (5000ms) para ocultar la notificación
    setTimeout(removeToast, duration);
  };

  /**
   * Observador de mensajes de formulario (MutationObserver).
   * 
   * Detecta cuando scripts como turnos.js, pacientes.js o login.js escriben
   * en elementos como #turnMessage, #patientMessage o #loginMessage.
   * Oculta el elemento estático original y dispara automáticamente
   * la notificación flotante emergente con el mensaje y tipo correspondiente.
   */
  function initToastObserver() {
    const messageElements = document.querySelectorAll('.form-message, #turnMessage, #patientMessage, #loginMessage');

    messageElements.forEach(function (el) {
      // Oculta el mensaje estático para que la notificación sea 100% flotante
      el.style.display = 'none';

      // Observador de cambios en el texto o clases del elemento de mensaje
      const observer = new MutationObserver(function () {
        const text = el.textContent.trim();
        if (text) {
          const isOk = el.classList.contains('ok');
          const isBad = el.classList.contains('bad');
          const type = isOk ? 'ok' : isBad ? 'bad' : 'info';

          // Invoca la función flotante con el mensaje y tipo detectado
          window.AppHelpers.showToast(text, type, 5000);
        }
      });

      // Configura el observer para escuchar cambios de texto, hijos y atributos (clases)
      observer.observe(el, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    });
  }

  // Inicializa el observador automáticamente al cargar la página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToastObserver);
  } else {
    initToastObserver();
  }

})();
