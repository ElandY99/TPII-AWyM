/* =============================================================
   js/common.js
   -------------------------------------------------------------
   Lógica central compartida de pantallas privadas:
   - Control asíncrono de sesión con /api/auth/me (AppSession.ready).
   - Protección H-01 para cuentas profesionales sin médico activo.
   - Generación dinámica de la navegación del Sidebar según rol.
   - Guard de acceso por pantalla.
   - Cierre de sesión real con cookie HttpOnly (POST /api/auth/logout).
   - Menú responsive hamburguesa.
   ============================================================= */

(function () {
  'use strict';

  // Configuración de rutas permitidas y navegación por rol
  const NAV_ITEMS = [
    {
      href: 'dashboard.html',
      label: 'Panel',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL']
    },
    {
      href: 'pacientes.html',
      label: 'Pacientes',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
    },
    {
      href: 'turno.html',
      label: 'Turnos',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL']
    },
    {
      href: 'agenda.html',
      label: 'Agenda',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL']
    },
    {
      href: 'profesionales.html',
      label: 'Profesionales',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
    },
    {
      href: 'especialidades.html',
      label: 'Especialidades',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
    },
    {
      href: 'usuarios.html',
      label: 'Usuarios',
      roles: ['ADMINISTRADOR']
    },
    {
      href: 'cuenta.html',
      label: 'Mi cuenta',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL']
    }
  ];

  let currentUser = null;
  let sessionReadyResolve;
  let sessionReadyReject;

  const sessionReadyPromise = new Promise((resolve, reject) => {
    sessionReadyResolve = resolve;
    sessionReadyReject = reject;
  });

  window.AppSession = {
    ready: sessionReadyPromise,
    getUser: () => currentUser,
    isAdmin: () => currentUser?.rol === 'ADMINISTRADOR',
    isRecep: () => currentUser?.rol === 'RECEPCIONISTA',
    isDoctor: () => currentUser?.rol === 'PROFESIONAL'
  };

  /**
   * Obtiene el nombre del archivo HTML actual (ej: "pacientes.html").
   */
  function getCurrentPageName() {
    const path = window.location.pathname;
    const segments = path.split('/');
    const file = segments.pop() || 'dashboard.html';
    return file === '' ? 'dashboard.html' : file;
  }

  /**
   * Renderiza el sidebar según el rol del usuario autenticado (DT-05).
   */
  function renderSidebar(usuario) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const currentPage = getCurrentPageName();
    sidebar.innerHTML = '';

    // Perfil de usuario en el menú
    const userCard = document.createElement('div');
    userCard.className = 'sidebar-user-card';
    const rolLegible =
      usuario.rol === 'ADMINISTRADOR'
        ? 'Administrador'
        : usuario.rol === 'RECEPCIONISTA'
        ? 'Recepcionista'
        : 'Profesional';

    userCard.innerHTML = `
      <div class="user-avatar" aria-hidden="true">${window.AppHelpers.esc(usuario.nombre.charAt(0))}${window.AppHelpers.esc(usuario.apellido.charAt(0))}</div>
      <div class="user-info">
        <span class="user-name">${window.AppHelpers.esc(usuario.nombre)} ${window.AppHelpers.esc(usuario.apellido)}</span>
        <span class="user-role">${window.AppHelpers.esc(rolLegible)}</span>
      </div>
    `;
    sidebar.appendChild(userCard);

    // Enlaces de navegación
    const navLinksContainer = document.createElement('div');
    navLinksContainer.className = 'sidebar-links';

    NAV_ITEMS.forEach((item) => {
      if (item.roles.includes(usuario.rol)) {
        const link = document.createElement('a');
        link.href = item.href;
        link.textContent = item.label;

        // Label adaptada para el rol profesional
        if (item.href === 'turno.html' && usuario.rol === 'PROFESIONAL') {
          link.textContent = 'Mis turnos';
        }

        if (currentPage === item.href) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }

        navLinksContainer.appendChild(link);
      }
    });

    sidebar.appendChild(navLinksContainer);

    // Botón de cerrar sesión
    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'nav-button logout-btn';
    logoutBtn.innerHTML = 'Cerrar sesión';
    logoutBtn.addEventListener('click', handleLogout);
    sidebar.appendChild(logoutBtn);
  }

  /**
   * Valida si el rol tiene acceso a la página actual.
   */
  function checkPageAccess(usuario) {
    const currentPage = getCurrentPageName();
    const item = NAV_ITEMS.find((nav) => nav.href === currentPage);

    if (item && !item.roles.includes(usuario.rol)) {
      if (window.AppUI && window.AppUI.showToast) {
        window.AppUI.showToast('No tiene permisos para acceder a esta pantalla.', 'bad');
      }
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 300);
      return false;
    }
    return true;
  }

  /**
   * Cierre de sesión centralizado (FE-NAV-03).
   */
  async function handleLogout() {
    try {
      if (window.Api && window.Api.auth) {
        await window.Api.auth.logout();
      }
    } catch (err) {
      console.warn('Error al cerrar sesión:', err);
    } finally {
      sessionStorage.removeItem('saludturnos_user');
      window.location.href = 'login.html';
    }
  }

  /**
   * Inicialización del shell privado.
   */
  async function initSession() {
    // Si la pantalla es index o login, no ejecutar guard privado
    const currentPage = getCurrentPageName();
    if (currentPage === 'index.html' || currentPage === 'login.html') {
      return;
    }

    try {
      if (!window.Api || !window.Api.auth) {
        throw new Error('El módulo api.js no fue cargado correctamente.');
      }

      const res = await window.Api.auth.me();
      currentUser = res.usuario;

      // H-01 Mitigación: Profesional con id_profesional null (cuenta médica inactiva)
      if (currentUser.rol === 'PROFESIONAL' && !currentUser.id_profesional) {
        sessionStorage.setItem(
          'saludturnos_motivo_logout',
          'Su cuenta médica se encuentra inactiva. Comuníquese con el administrador.'
        );
        try {
          await window.Api.auth.logout();
        } catch {
          // ignore
        }
        window.location.href = 'login.html';
        return;
      }

      // Validar acceso por rol
      const hasAccess = checkPageAccess(currentUser);
      if (!hasAccess) return;

      // Renderizar sidebar dinámico
      renderSidebar(currentUser);
      initMobileMenu();

      // Resolver promesa de sesión lista
      sessionReadyResolve(currentUser);
    } catch (err) {
      console.warn('Fallo en la validación de sesión:', err);
      sessionReadyReject(err);
      if (!currentPage.endsWith('login.html')) {
        window.location.href = 'login.html';
      }
    }
  }

  /**
   * Inicialización del menú hamburguesa responsive (FE-NAV-04).
   */
  function initMobileMenu() {
    const topbar = document.querySelector('.topbar');
    const appLayout = document.querySelector('.app-layout');
    const sidebar = document.querySelector('.sidebar');

    if (!topbar || !sidebar || !appLayout) return;

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

    menuBtn.onclick = function (e) {
      e.stopPropagation();
      toggleMenu();
    };

    sidebar.querySelectorAll('a, .nav-button').forEach((el) => {
      el.addEventListener('click', () => {
        if (appLayout.classList.contains('menu-open')) {
          toggleMenu();
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (
        appLayout.classList.contains('menu-open') &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)
      ) {
        toggleMenu();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && appLayout.classList.contains('menu-open')) {
        appLayout.classList.remove('menu-open');
        sidebar.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = '☰';
        document.body.style.overflow = '';
      }
    });
  }

  // Helpers compartidos
  window.AppHelpers = window.AppHelpers || {};
  Object.assign(window.AppHelpers, {
    patientName(patient) {
      if (!patient) return 'Paciente no disponible';
      return `${patient.nombre} ${patient.apellido}`;
    },
    doctorName(doctor) {
      if (!doctor) return 'Profesional no disponible';
      if (doctor.nombre && doctor.apellido) {
        return `${doctor.nombre} ${doctor.apellido}`;
      }
      return doctor.name || 'Profesional no disponible';
    }
  });

  // Ejecución al cargar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSession);
  } else {
    initSession();
  }
})();
