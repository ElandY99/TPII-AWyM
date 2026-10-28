/* =============================================================
   js/cuenta.js
   -------------------------------------------------------------
   Lógica de la pantalla Mi cuenta:
   - Visualización de datos de perfil.
   - Si es PROFESIONAL: matrícula, consultorio, especialidad y disponibilidad (A8).
   - Formulario de cambio de contraseña con validación de política estricta.
   ============================================================= */

(function () {
  'use strict';

  const form = document.getElementById('changePasswordForm');
  const saveBtn = document.getElementById('savePasswordBtn');

  /**
   * Carga y muestra los datos del perfil y del profesional (si corresponde).
   */
  async function loadProfile(usuario) {
    const profileLoading = document.getElementById('profileLoading');
    const profileContent = document.getElementById('profileContent');

    document.getElementById('userName').textContent = `${usuario.nombre} ${usuario.apellido}`;
    document.getElementById('userEmail').textContent = usuario.correo;

    const rolTexto =
      usuario.rol === 'ADMINISTRADOR'
        ? 'Administrador General'
        : usuario.rol === 'RECEPCIONISTA'
        ? 'Recepcionista'
        : 'Profesional Médico';
    document.getElementById('userRole').textContent = rolTexto;

    profileLoading.classList.add('hidden');
    profileContent.classList.remove('hidden');

    // Si es profesional médico, cargar datos médicos y agenda semanal (A8)
    if (usuario.rol === 'PROFESIONAL' && usuario.id_profesional) {
      const doctorBlock = document.getElementById('doctorProfileBlock');
      doctorBlock.classList.remove('hidden');

      try {
        const [profRes, dispRes] = await Promise.all([
          window.Api.profesionales.getById(usuario.id_profesional),
          window.Api.profesionales.getDisponibilidad(usuario.id_profesional)
        ]);

        const prof = profRes.data;
        document.getElementById('doctorSpecialty').textContent = prof.especialidad_nombre || '-';
        document.getElementById('doctorLicense').textContent = prof.matricula || '-';
        document.getElementById('doctorOffice').textContent = prof.consultorio || 'Sin consultorio asignado';

        renderAvailability(dispRes.data || []);
      } catch (err) {
        console.error('Error al cargar datos del profesional:', err);
        window.AppUI.showToast('No se pudieron cargar los datos profesionales completos.', 'bad');
      }
    }
  }

  /**
   * Renderiza la tabla de disponibilidad semanal de atención (A8).
   */
  function renderAvailability(franjas) {
    const tbody = document.getElementById('doctorAvailabilityTable');
    if (!tbody) return;

    if (!franjas || franjas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="empty-row">No registra franjas horarias configuradas.</td></tr>';
      return;
    }

    // Orden de los días de la semana
    const ordenDias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    const agrupado = {};

    franjas.forEach((f) => {
      agrupado[f.dia_semana] = agrupado[f.dia_semana] || [];
      agrupado[f.dia_semana].push(`${f.hora_inicio} a ${f.hora_fin}`);
    });

    let html = '';
    ordenDias.forEach((dia) => {
      if (agrupado[dia] && agrupado[dia].length > 0) {
        html += `
          <tr>
            <td><strong>${window.AppHelpers.esc(dia)}</strong></td>
            <td>${window.AppHelpers.esc(agrupado[dia].join(' | '))}</td>
          </tr>
        `;
      }
    });

    tbody.innerHTML = html || '<tr><td colspan="2" class="empty-row">Sin horarios activos.</td></tr>';
  }

  /**
   * Valida la política de seguridad de la nueva contraseña (FE-CTA-02).
   */
  function validatePasswordPolicy(password) {
    if (!password || password.length < 8) {
      return 'Debe tener al menos 8 caracteres.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Debe incluir al menos una letra mayúscula.';
    }
    if (!/[a-z]/.test(password)) {
      return 'Debe incluir al menos una letra minúscula.';
    }
    if (!/[#$@!%*?&]/.test(password)) {
      return 'Debe incluir al menos un símbolo del conjunto (# $ @ ! % * ? &).';
    }
    return null;
  }

  /**
   * Manejador del cambio de contraseña.
   */
  async function handleChangePassword(e) {
    e.preventDefault();

    const claveActualEl = document.getElementById('clave_actual');
    const claveNuevaEl = document.getElementById('clave_nueva');
    const claveConfirmEl = document.getElementById('clave_confirm');

    const clave_actual = claveActualEl.value;
    const clave_nueva = claveNuevaEl.value;
    const clave_confirm = claveConfirmEl.value;

    // Limpieza de errores previos
    window.AppUI.renderFieldErrors(form, {});

    let hasErrors = false;

    if (!clave_actual) {
      document.getElementById('clave_actualError').textContent = 'Debe ingresar su contraseña actual.';
      claveActualEl.classList.add('input-error');
      hasErrors = true;
    }

    const policyError = validatePasswordPolicy(clave_nueva);
    if (policyError) {
      document.getElementById('clave_nuevaError').textContent = policyError;
      claveNuevaEl.classList.add('input-error');
      hasErrors = true;
    }

    if (clave_nueva && clave_confirm !== clave_nueva) {
      document.getElementById('clave_confirmError').textContent = 'Las contraseñas no coinciden.';
      claveConfirmEl.classList.add('input-error');
      hasErrors = true;
    }

    if (hasErrors) return;

    window.AppUI.setLoading(saveBtn, true, 'Actualizando...');

    try {
      const res = await window.Api.auth.changePassword({ clave_actual, clave_nueva });
      window.AppUI.showToast(res.mensaje || 'Contraseña actualizada correctamente.', 'ok');
      form.reset();
    } catch (err) {
      if (err.status === 400) {
        window.AppUI.renderFieldErrors(form, err.campos);
      } else if (err.status === 401) {
        document.getElementById('clave_actualError').textContent = err.message || 'Contraseña actual incorrecta.';
        claveActualEl.classList.add('input-error');
      } else {
        window.AppUI.showToast(err.message || 'No se pudo actualizar la contraseña.', 'bad');
      }
    } finally {
      window.AppUI.setLoading(saveBtn, false);
    }
  }

  // Inicialización tras resolver la sesión
  window.AppSession.ready.then((usuario) => {
    loadProfile(usuario);
    if (form) {
      form.addEventListener('submit', handleChangePassword);
    }
  });
})();
