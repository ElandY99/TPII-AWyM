/* =============================================================
   js/login.js
   -------------------------------------------------------------
   Lógica de inicio de sesión real contra la API:
   - Redirección automática si ya existe sesión (FE-LOG-02).
   - Manejo de aviso de sesión expirada.
   - Envío de POST /api/auth/login { correo, clave }.
   - Mapeo de errores 400 (campos), 401 (genérico) y 403 (inactivo).
   - Autocompletado de usuarios demo de la semilla.
   ============================================================= */

(function () {
  'use strict';

  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('loginSubmitBtn');

  /* Iconos del toggle de contraseña */
  const PASSWORD_ICON = {
    hidden: '/images/eye-key-look-password-security-see-svgrepo-com.svg', // contraseña OCULTA
    visible: '/images/eye-password-see-view-svgrepo-com.svg'              // contraseña VISIBLE
  };

  /**
   * Limpia los errores previos del formulario.
   */
  function clearErrors() {
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    emailInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');

    loginMessage.textContent = '';
    loginMessage.className = 'form-message';
  }

  /**
   * Verifica si ya hay una sesión activa al cargar la página (FE-LOG-02).
   */
  async function checkExistingSession() {
    try {
      if (window.Api && window.Api.auth) {
        const res = await window.Api.auth.me();
        if (res && res.usuario) {
          window.location.href = 'dashboard.html';
          return;
        }
      }
    } catch {
      // Sin sesión, permanece en la pantalla
    }

    // Comprobar si fue redirigido con aviso de sesión cerrada/expirada
    const motivoLogout = sessionStorage.getItem('saludturnos_motivo_logout');
    if (motivoLogout) {
      sessionStorage.removeItem('saludturnos_motivo_logout');
      loginMessage.textContent = motivoLogout;
      loginMessage.className = 'form-message bad';
    }
  }

  /**
   * Manejador del envío del formulario de Login.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    clearErrors();

    const correo = emailInput.value.trim();
    const clave = passwordInput.value;

    let hasClientError = false;

    if (!correo) {
      document.getElementById('emailError').textContent = 'Debe ingresar el correo electrónico.';
      emailInput.classList.add('input-error');
      hasClientError = true;
    }

    if (!clave) {
      document.getElementById('passwordError').textContent = 'Debe ingresar la contraseña.';
      passwordInput.classList.add('input-error');
      hasClientError = true;
    }

    if (hasClientError) return;

    window.AppUI.setLoading(submitBtn, true, 'Ingresando...');

    try {
      await window.Api.auth.login({ correo, clave });

      // Éxito: redirección al Dashboard
      window.location.href = 'dashboard.html';
    } catch (err) {
      if (err.status === 400) {
        // Errores de validación de esquema
        window.AppUI.renderFieldErrors(loginForm, err.campos);
        if (err.message && Object.keys(err.campos).length === 0) {
          loginMessage.textContent = err.message;
          loginMessage.className = 'form-message bad';
        }
      } else if (err.status === 401) {
        // Credenciales incorrectas
        loginMessage.textContent = 'Usuario o contraseña incorrectos.';
        loginMessage.className = 'form-message bad';
        passwordInput.value = '';
        resetPasswordToggle();
        passwordInput.focus();
      } else if (err.status === 403) {
        // Cuenta inactiva
        loginMessage.textContent = err.message || 'La cuenta se encuentra inactiva.';
        loginMessage.className = 'form-message bad';
      } else {
        // Error de red o del servidor
        loginMessage.textContent = err.message || 'No se pudo conectar con el servidor.';
        loginMessage.className = 'form-message bad';
      }
    } finally {
      window.AppUI.setLoading(submitBtn, false);
    }
  }

  /**
   * Inicializa el toggle de visibilidad de la contraseña.
   * Cambia type password <-> text y actualiza el estado accesible del botón.
   */
  function initPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    if (!toggleBtn || !passwordInput) return;

    // Preload del segundo ícono para evitar parpadeo al cambiar
    const preload = new Image();
    preload.src = PASSWORD_ICON.visible;

    toggleBtn.addEventListener('click', () => {
      const willBeVisible = passwordInput.type === 'password';

      // 1. Cambiar el tipo del input
      passwordInput.type = willBeVisible ? 'text' : 'password';

      // 2. Estado visual del botón
      toggleBtn.classList.toggle('is-visible', willBeVisible);

      // 3. Accesibilidad (label + title)
      const label = willBeVisible ? 'Ocultar contraseña' : 'Mostrar contraseña';
      toggleBtn.setAttribute('aria-label', label);
      toggleBtn.setAttribute('title', label);

      // 4. Cambiar el ícono
      applyPasswordIcon(willBeVisible);

      // 5. Mantener foco y cursor al final
      passwordInput.focus();
      if (willBeVisible) {
        const len = passwordInput.value.length;
        try { passwordInput.setSelectionRange(len, len); } catch (_) { /* noop */ }
      }
    });
  }

  /**
   * Fuerza que la contraseña vuelva a estar oculta.
   * Se usa tras un 401 para no dejar el valor visible si el usuario reintenta.
   */
  function resetPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    if (!toggleBtn) return;
    passwordInput.type = 'password';
    toggleBtn.classList.remove('is-visible');
    toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
    toggleBtn.setAttribute('title', 'Mostrar contraseña');
  }

  /**
 * Aplica el ícono correcto al botón de toggle según la visibilidad.
 * @param {boolean} visible  true = contraseña visible
 */
  function applyPasswordIcon(visible) {
    const toggleBtn = document.getElementById('togglePassword');
    if (!toggleBtn) return;
    const img = toggleBtn.querySelector('img');
    if (!img) return;

    setTimeout(() => {
      img.src = visible ? PASSWORD_ICON.visible : PASSWORD_ICON.hidden;
    }, 100);
  }

  /**
   * Configura los botones de autofill para los 5 usuarios demo (A7).
   */
  function initDemoButtons() {
    document.querySelectorAll('.demo-user-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const email = btn.dataset.email;
        const pass = btn.dataset.pass;
        if (email && pass) {
          emailInput.value = email;
          passwordInput.value = pass;
          clearErrors();
          submitBtn.focus();
        }
      });
    });
  }

  // Inicialización
  if (loginForm) {
    loginForm.addEventListener('submit', handleSubmit);
  }
  initDemoButtons();
  initPasswordToggle();
  checkExistingSession();
})();
