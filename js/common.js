/* =============================================================
   common.js
   -------------------------------------------------------------
   Contiene lógica compartida por todas las pantallas privadas:
   - Verificar si existe una sesión iniciada.
   - Cerrar sesión.
   - Funciones auxiliares para mostrar nombres y estados.
   ============================================================= */

(function () {

  /* -----------------------------------------------------------
     CONTROL BÁSICO DE SESIÓN
     -----------------------------------------------------------
     Cuando el Login es correcto se guarda en sessionStorage una
     clave llamada saludturnos_user.

     sessionStorage se mantiene mientras la pestaña del navegador
     permanezca abierta.
  ----------------------------------------------------------- */
  const logged = sessionStorage.getItem('saludturnos_user');

  // Si no hay sesión, el usuario vuelve a la pantalla de Login.
  if (!logged) {
    window.location.href = 'login.html';
    return;
  }

  /* -----------------------------------------------------------
     CIERRE DE SESIÓN
     ----------------------------------------------------------- */
  const logoutBtn = document.getElementById('logoutBtn');

  // Se comprueba que el botón exista antes de agregar el evento.
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {

      // Se elimina la sesión actual.
      sessionStorage.removeItem('saludturnos_user');

      // Se redirige al Login.
      window.location.href = 'login.html';
    });
  }

  /* -----------------------------------------------------------
     MENÚ RESPONSIVE MÓVIL / TABLET
     -----------------------------------------------------------
     Permite abrir y cerrar el panel lateral (sidebar) en pantallas
     pequeñas mediante el botón de menú hamburguesa.
  ----------------------------------------------------------- */
  function initMobileMenu() {
    const topbar = document.querySelector('.topbar');
    const appLayout = document.querySelector('.app-layout');
    const sidebar = document.querySelector('.sidebar');

    if (!topbar || !sidebar || !appLayout) {
      return;
    }

    // Si el botón no existe en el HTML, se crea dinámicamente.
    let menuBtn = document.getElementById('mobileMenuBtn');
    if (!menuBtn) {
      menuBtn = document.createElement('button');
      menuBtn.id = 'mobileMenuBtn';
      menuBtn.className = 'mobile-menu-btn';
      menuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.innerHTML = '☰';
      topbar.appendChild(menuBtn);
    }

    function toggleMenu() {
      const isOpen = appLayout.classList.toggle('menu-open');
      sidebar.classList.toggle('open', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuBtn.innerHTML = isOpen ? '✕' : '☰';

      if (window.innerWidth <= 768) {
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }
    }

    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    // Cierra el menú al hacer clic en cualquier opción
    sidebar.querySelectorAll('a, .nav-button').forEach(function (element) {
      element.addEventListener('click', function () {
        if (appLayout.classList.contains('menu-open')) {
          toggleMenu();
        }
      });
    });

    // Cierra el menú al hacer clic fuera
    document.addEventListener('click', function (e) {
      if (appLayout.classList.contains('menu-open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        toggleMenu();
      }
    });

    // Restablece estado al agrandar la ventana
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768 && appLayout.classList.contains('menu-open')) {
        appLayout.classList.remove('menu-open');
        sidebar.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = '☰';
        document.body.style.overflow = '';
      }
    });
  }

  // Inicializa el menú cuando el DOM está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }

  /* -----------------------------------------------------------
     FUNCIONES AUXILIARES COMPARTIDAS
     -----------------------------------------------------------
     Se agrupan dentro de AppHelpers para reutilizarlas desde
     dashboard.js, turnos.js y agenda.js.
  ----------------------------------------------------------- */
  window.AppHelpers = window.AppHelpers || {};

  Object.assign(window.AppHelpers, {
    // Devuelve el nombre completo de un paciente.
    patientName(patient) {
      if (!patient) {
        return 'Paciente no disponible';
      }

      return `${patient.nombre} ${patient.apellido}`;
    },

    // Devuelve el nombre de un profesional.
    doctorName(doctor) {
      if (!doctor) {
        return 'Profesional no disponible';
      }

      return doctor.name;
    },

    /*
      Devuelve un fragmento HTML para representar visualmente
      el estado de un turno mediante una etiqueta (badge).
    */
    statusBadge(status) {
      const cssClass = status.toLowerCase().replaceAll(' ', '-');
      return `<span class="badge ${cssClass}">${status}</span>`;
    }
  });

})();
