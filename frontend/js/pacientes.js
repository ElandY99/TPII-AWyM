/* =============================================================
   js/pacientes.js
   -------------------------------------------------------------
   Lógica de Gestión de Pacientes conectada a la API:
   - Búsqueda en tiempo real con debounce y AbortController.
   - Filtro por estado: Activos (default), Inactivos, Todos.
   - Alta (POST) y Edición (PUT) con validaciones cliente/servidor.
   - Desactivación y Reactivación protegida (solo ADMIN) con confirmación.
   ============================================================= */

(function () {
  'use strict';

  let currentAbortController = null;
  let activeEstado = '1'; // Default: Activos (FE-PAC-02)

  // Referencias DOM
  const tableBody = document.getElementById('patientsTable');
  const searchInput = document.getElementById('patientSearch');
  const toggleFormBtn = document.getElementById('toggleFormBtn');
  const formCard = document.getElementById('patientFormCard');
  const formTitle = document.getElementById('patientFormTitle');
  const patientForm = document.getElementById('patientForm');
  const cancelBtn = document.getElementById('cancelPatientBtn');
  const saveBtn = document.getElementById('savePatientBtn');

  // Inputs del formulario
  const patientIdInput = document.getElementById('patientId');
  const dniInput = document.getElementById('dni');
  const correoInput = document.getElementById('correo');
  const nombreInput = document.getElementById('nombre');
  const apellidoInput = document.getElementById('apellido');
  const telefonoInput = document.getElementById('telefono');
  const fechaNacInput = document.getElementById('fecha_nacimiento');
  const obraSocialInput = document.getElementById('obra_social');

  /**
   * Carga el listado de pacientes desde la API con filtros y cancelación de peticiones previas.
   */
  async function loadPatients() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const q = searchInput.value.trim();
    const query = {
      q: q || undefined,
      estado: activeEstado !== 'todos' ? activeEstado : 'todos'
    };

    tableBody.innerHTML = '<tr><td colspan="8" class="empty-row">Cargando pacientes...</td></tr>';

    try {
      const res = await window.Api.pacientes.list(query, currentAbortController.signal);
      renderTable(res.data || []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar pacientes:', err);
      tableBody.innerHTML = `<tr><td colspan="8" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar pacientes')}</td></tr>`;
    }
  }

  /**
   * Renderiza las filas de la tabla de pacientes con sus acciones según el rol.
   */
  function renderTable(pacientes) {
    if (!pacientes || pacientes.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="empty-row">No se encontraron pacientes para los criterios seleccionados.</td></tr>';
      return;
    }

    const isAdmin = window.AppSession.isAdmin();
    const fragment = document.createDocumentFragment();

    pacientes.forEach((p) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td><strong>${window.AppHelpers.esc(p.dni)}</strong></td>
        <td>${window.AppHelpers.esc(p.apellido)}, ${window.AppHelpers.esc(p.nombre)}</td>
        <td>${window.AppHelpers.esc(p.telefono || '-')}</td>
        <td>${window.AppHelpers.esc(p.correo)}</td>
        <td>${window.AppHelpers.formatDate(p.fecha_nacimiento)}</td>
        <td>${window.AppHelpers.esc(p.obra_social || '-')}</td>
        <td>${window.AppHelpers.activeBadge(p.estado)}</td>
        <td class="actions-cell"></td>
      `;

      const actionsCell = tr.querySelector('.actions-cell');

      // Botón Editar (Admin y Recep)
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-light btn-xs';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => openEditForm(p));
      actionsCell.appendChild(editBtn);

      // Botones de Desactivar / Reactivar (Solo ADMIN)
      if (isAdmin) {
        if (p.estado === 1) {
          const deactBtn = document.createElement('button');
          deactBtn.type = 'button';
          deactBtn.className = 'btn btn-danger btn-xs';
          deactBtn.textContent = 'Desactivar';
          deactBtn.addEventListener('click', () => handleDeactivate(p));
          actionsCell.appendChild(deactBtn);
        } else {
          const actBtn = document.createElement('button');
          actBtn.type = 'button';
          actBtn.className = 'btn btn-light btn-xs';
          actBtn.style.color = 'var(--success)';
          actBtn.textContent = 'Reactivar';
          actBtn.addEventListener('click', () => handleActivate(p));
          actionsCell.appendChild(actBtn);
        }
      }

      fragment.appendChild(tr);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
  }

  /**
   * Abre el formulario en modo creación.
   */
  function openCreateForm() {
    formTitle.textContent = 'Registrar nuevo paciente';
    patientIdInput.value = '';
    patientForm.reset();
    window.AppUI.renderFieldErrors(patientForm, {});
    formCard.classList.remove('hidden');
    dniInput.focus();
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Abre el formulario en modo edición.
   */
  function openEditForm(p) {
    formTitle.textContent = `Editar paciente: ${p.nombre} ${p.apellido}`;
    patientIdInput.value = p.id_paciente;
    dniInput.value = p.dni || '';
    correoInput.value = p.correo || '';
    nombreInput.value = p.nombre || '';
    apellidoInput.value = p.apellido || '';
    telefonoInput.value = p.telefono || '';
    fechaNacInput.value = p.fecha_nacimiento || '';
    obraSocialInput.value = p.obra_social || '';

    window.AppUI.renderFieldErrors(patientForm, {});
    formCard.classList.remove('hidden');
    nombreInput.focus();
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Cierra el formulario y limpia campos.
   */
  function closeForm() {
    formCard.classList.add('hidden');
    patientForm.reset();
    patientIdInput.value = '';
    window.AppUI.renderFieldErrors(patientForm, {});
  }

  /**
   * Validaciones del formulario en cliente previo al envío.
   */
  function validateForm() {
    const campos = {};
    const dni = dniInput.value.trim();
    const correo = correoInput.value.trim();
    const nombre = nombreInput.value.trim();
    const apellido = apellidoInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const fechaNac = fechaNacInput.value.trim();
    const obraSocial = obraSocialInput.value.trim();

    if (!/^\d{7,8}$/.test(dni)) {
      campos.dni = 'El DNI debe contener 7 u 8 dígitos numéricos sin puntos.';
    }

    if (!nombre || nombre.length < 2 || nombre.length > 50) {
      campos.nombre = 'El nombre debe tener entre 2 y 50 caracteres.';
    }

    if (!apellido || apellido.length < 2 || apellido.length > 50) {
      campos.apellido = 'El apellido debe tener entre 2 y 50 caracteres.';
    }

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      campos.correo = 'Formato de correo electrónico inválido.';
    }

    // Teléfono: solo dígitos numéricos hasta 12 (A3)
    if (telefono && !/^\d{1,12}$/.test(telefono)) {
      campos.telefono = 'El teléfono debe contener solo números y hasta 12 dígitos.';
    }

    if (fechaNac) {
      if (fechaNac < '1900-01-01') {
        campos.fecha_nacimiento = 'La fecha de nacimiento no puede ser anterior al año 1900.';
      } else if (fechaNac > window.AppHelpers.todayLocal()) {
        campos.fecha_nacimiento = 'La fecha de nacimiento no puede ser una fecha futura.';
      }
    }

    if (obraSocial && obraSocial.length > 100) {
      campos.obra_social = 'Máximo 100 caracteres.';
    }

    return {
      isValid: Object.keys(campos).length === 0,
      campos,
      data: {
        dni,
        nombre,
        apellido,
        correo: correo.toLowerCase(),
        telefono: telefono || null,
        fecha_nacimiento: fechaNac || null,
        obra_social: obraSocial || null
      }
    };
  }

  /**
   * Manejador del submit de alta o edición.
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    const { isValid, campos, data } = validateForm();
    if (!isValid) {
      window.AppUI.renderFieldErrors(patientForm, campos);
      return;
    }

    const isEdit = Boolean(patientIdInput.value);
    const id = Number(patientIdInput.value);

    window.AppUI.setLoading(saveBtn, true, 'Guardando...');

    try {
      if (isEdit) {
        await window.Api.pacientes.update(id, data);
        window.AppUI.showToast('Paciente actualizado correctamente.', 'ok');
      } else {
        await window.Api.pacientes.create(data);
        window.AppUI.showToast('Paciente registrado correctamente.', 'ok');
      }

      closeForm();
      loadPatients();
    } catch (err) {
      if (err.status === 400 || err.status === 409) {
        window.AppUI.renderFieldErrors(patientForm, err.campos);
        window.AppUI.showToast(err.message, 'bad');
      } else {
        window.AppUI.showToast(err.message || 'Error al guardar el paciente.', 'bad');
      }
    } finally {
      window.AppUI.setLoading(saveBtn, false);
    }
  }

  /**
   * Desactivar paciente (solo Administrador).
   */
  async function handleDeactivate(p) {
    const ok = await window.AppUI.confirm({
      title: 'Desactivar paciente',
      message: `¿Está seguro de que desea desactivar a ${p.nombre} ${p.apellido} (DNI ${p.dni})?`,
      confirmText: 'Desactivar',
      isDanger: true
    });

    if (!ok) return;

    try {
      await window.Api.pacientes.deactivate(p.id_paciente);
      window.AppUI.showToast('Paciente desactivado correctamente.', 'ok');
      loadPatients();
    } catch (err) {
      // 409: turnos futuros activos u otros bloqueos
      window.AppUI.showToast(err.message || 'No se pudo desactivar al paciente.', 'bad');
    }
  }

  /**
   * Reactivar paciente (solo Administrador).
   */
  async function handleActivate(p) {
    const ok = await window.AppUI.confirm({
      title: 'Reactivar paciente',
      message: `¿Desea reactivar a ${p.nombre} ${p.apellido} (DNI ${p.dni})?`,
      confirmText: 'Reactivar'
    });

    if (!ok) return;

    try {
      await window.Api.pacientes.activate(p.id_paciente);
      window.AppUI.showToast('Paciente reactivado correctamente.', 'ok');
      loadPatients();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo reactivar al paciente.', 'bad');
    }
  }

  /**
   * Configuración de eventos de UI y filtros.
   */
  function initEvents() {
    // Búsqueda rápida con debounce
    searchInput.addEventListener(
      'input',
      window.AppHelpers.debounce(() => {
        loadPatients();
      }, 300)
    );

    // Filtros de estado por pills
    document.querySelectorAll('.pill-group .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-group .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeEstado = btn.dataset.estado;
        loadPatients();
      });
    });

    toggleFormBtn.addEventListener('click', () => {
      if (formCard.classList.contains('hidden')) {
        openCreateForm();
      } else {
        closeForm();
      }
    });

    cancelBtn.addEventListener('click', closeForm);
    patientForm.addEventListener('submit', handleFormSubmit);
  }

  // Inicialización tras resolver la sesión
  window.AppSession.ready.then(() => {
    initEvents();
    loadPatients();
  });
})();
