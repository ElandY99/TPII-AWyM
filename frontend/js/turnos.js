/* =============================================================
   js/turnos.js
   -------------------------------------------------------------
   Lógica integral de Turnos Médicos:
   - Solicitud de nuevo turno con selector de paciente reactivo (combobox).
   - Cálculo dinámico de horarios libres desde la API (/disponibles).
   - Filtros avanzados (fecha hoy por defecto, estados, paciente, médico).
   - Paginación en cliente de 20 registros por página.
   - Transiciones estrictas de estado según matriz de permisos (A1).
   - Modal de reprogramación (con inclusión de slot actual - FE-TUR-22).
   - Modal de observaciones de consulta en estado EN_CONSULTORIO (A2).
   - Refresco al enfocar la ventana y sondeo cada 60s (FE-GEN-10).
   ============================================================= */

(function () {
  'use strict';

  const PAGE_SIZE = 20;
  let currentPage = 1;
  let allLoadedTurnos = [];
  let currentAbortController = null;

  // Caché de datos para el formulario de alta
  let cachedDoctors = [];
  let cachedSpecialties = [];

  // Referencias DOM principales
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const toggleNewTurnBtn = document.getElementById('toggleNewTurnBtn');
  const turnFormCard = document.getElementById('turnFormCard');
  const cancelTurnBtn = document.getElementById('cancelTurnBtn');
  const submitTurnBtn = document.getElementById('submitTurnBtn');
  const refreshTurnsBtn = document.getElementById('refreshTurnsBtn');

  // Inputs del formulario de alta
  const turnForm = document.getElementById('turnForm');
  const patientSearchInput = document.getElementById('patientSearchInput');
  const patientSelect = document.getElementById('patientSelect');
  const patientDropdown = document.getElementById('patientDropdown');
  const specialtySelect = document.getElementById('specialtySelect');
  const doctorSelect = document.getElementById('doctorSelect');
  const turnDateInput = document.getElementById('turnDate');
  const turnTimeSelect = document.getElementById('turnTime');
  const motivoInput = document.getElementById('motivo');

  // Filtros de listado
  const filterDate = document.getElementById('filterDate');
  const filterAllDates = document.getElementById('filterAllDates');
  const filterStatus = document.getElementById('filterStatus');
  const filterPatient = document.getElementById('filterPatient');
  const filterDoctor = document.getElementById('filterDoctor');
  const filterDoctorField = document.getElementById('filterDoctorField');

  // Tabla y paginación
  const turnsTable = document.getElementById('turnsTable');
  const paginationInfo = document.getElementById('paginationInfo');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  /**
   * Carga el listado de turnos desde la API con filtros combinados.
   */
  async function loadTurnos() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const isAllDates = filterAllDates.checked;
    const dateVal = isAllDates ? undefined : filterDate.value || undefined;
    const statusVal = filterStatus.value;
    const patientVal = filterPatient.value.trim();
    const doctorVal = filterDoctor.value.trim();

    const query = {
      fecha: dateVal,
      estado: statusVal !== 'todos' ? statusVal : undefined,
      paciente: patientVal || undefined,
      profesional: window.AppSession.isDoctor() ? undefined : (doctorVal || undefined)
    };

    turnsTable.innerHTML = '<tr><td colspan="9" class="empty-row">Cargando turnos...</td></tr>';

    try {
      const res = await window.Api.turnos.list(query, currentAbortController.signal);
      allLoadedTurnos = res.data || [];
      currentPage = 1;
      renderCurrentPage();
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar turnos:', err);
      turnsTable.innerHTML = `<tr><td colspan="9" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar turnos')}</td></tr>`;
      updatePagination(0, 0, 0);
    }
  }

  /**
   * Renderiza la página actual de turnos (paginación de 20 filas).
   */
  function renderCurrentPage() {
    const total = allLoadedTurnos.length;
    if (total === 0) {
      turnsTable.innerHTML = '<tr><td colspan="9" class="empty-row">No se registraron turnos para los filtros seleccionados.</td></tr>';
      updatePagination(0, 0, 0);
      return;
    }

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, total);
    const pageItems = allLoadedTurnos.slice(startIdx, endIdx);

    const currentUser = window.AppSession.getUser();
    const isDoctor = window.AppSession.isDoctor();
    const isRecepOrAdmin = window.AppSession.isAdmin() || window.AppSession.isRecep();

    const fragment = document.createDocumentFragment();

    pageItems.forEach((t) => {
      const tr = document.createElement('tr');

      const pacienteInfo = `${window.AppHelpers.esc(t.paciente_apellido)}, ${window.AppHelpers.esc(t.paciente_nombre)} <br><small class="muted">DNI ${window.AppHelpers.esc(t.paciente_dni)}</small>`;
      const profesionalInfo = `${window.AppHelpers.esc(t.profesional_nombre)} ${window.AppHelpers.esc(t.profesional_apellido)}`;
      const motivoLabel = t.motivo_consulta ? window.AppHelpers.esc(t.motivo_consulta) : '<span class="muted">-</span>';

      tr.innerHTML = `
        <td><strong>${window.AppHelpers.formatDate(t.fecha)}</strong></td>
        <td><code>${window.AppHelpers.esc(t.hora)}</code></td>
        <td>${pacienteInfo}</td>
        <td>${profesionalInfo}</td>
        <td>${window.AppHelpers.esc(t.especialidad_nombre || '-')}</td>
        <td>${window.AppHelpers.esc(t.consultorio || '-')}</td>
        <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${window.AppHelpers.esc(t.motivo_consulta || '')}">${motivoLabel}</td>
        <td>${window.AppHelpers.statusBadge(t.estado)}</td>
        <td class="actions-cell"></td>
      `;

      const actionsCell = tr.querySelector('.actions-cell');
      renderRowActions(actionsCell, t, currentUser, isDoctor, isRecepOrAdmin);

      fragment.appendChild(tr);
    });

    turnsTable.innerHTML = '';
    turnsTable.appendChild(fragment);

    updatePagination(startIdx + 1, endIdx, total);
  }

  /**
   * Renderiza los botones de acción por turno según la matriz de estados A1 y A2.
   */
  function renderRowActions(container, t, user, isDoctor, isRecepOrAdmin) {
    const estado = t.estado;
    const hoyLocal = window.AppHelpers.todayLocal();

    // 1. ESTADO: PENDIENTE
    if (estado === 'PENDIENTE') {
      if (isRecepOrAdmin) {
        // Confirmar turno
        const confBtn = document.createElement('button');
        confBtn.type = 'button';
        confBtn.className = 'btn btn-light btn-xs';
        confBtn.style.color = 'var(--blue)';
        confBtn.textContent = 'Confirmar';
        confBtn.addEventListener('click', () => handleStatusChange(t.id_turno, 'CONFIRMADO'));
        container.appendChild(confBtn);

        // Reprogramar
        const reprogBtn = document.createElement('button');
        reprogBtn.type = 'button';
        reprogBtn.className = 'btn btn-light btn-xs';
        reprogBtn.textContent = 'Reprogramar';
        reprogBtn.addEventListener('click', () => openRescheduleModal(t));
        container.appendChild(reprogBtn);

        // Cancelar
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-danger btn-xs';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.addEventListener('click', () => handleCancelTurno(t.id_turno));
        container.appendChild(cancelBtn);
      }
    }

    // 2. ESTADO: CONFIRMADO
    else if (estado === 'CONFIRMADO') {
      if (isDoctor) {
        // Registrar llegada a consultorio (solo médico asignado, hoy y en franja horaria)
        const llegadaBtn = document.createElement('button');
        llegadaBtn.type = 'button';
        llegadaBtn.className = 'btn btn-primary btn-xs';
        llegadaBtn.textContent = 'Registrar llegada';

        const esHoy = t.fecha === hoyLocal;
        const enFranja = isTimeInSlot(t.hora);

        if (!esHoy || !enFranja) {
          llegadaBtn.disabled = true;
          llegadaBtn.title = 'La llegada solo puede registrarse para turnos de hoy durante su franja horaria (hora de inicio a +30 min).';
        } else {
          llegadaBtn.addEventListener('click', () => handleStatusChange(t.id_turno, 'EN_CONSULTORIO'));
        }
        container.appendChild(llegadaBtn);
      }

      if (isRecepOrAdmin) {
        // Marcar Ausente
        const ausBtn = document.createElement('button');
        ausBtn.type = 'button';
        ausBtn.className = 'btn btn-light btn-xs';
        ausBtn.style.color = '#7a5a18';
        ausBtn.textContent = 'Ausente';
        ausBtn.addEventListener('click', () => handleStatusChange(t.id_turno, 'AUSENTE'));
        container.appendChild(ausBtn);

        // Reprogramar
        const reprogBtn = document.createElement('button');
        reprogBtn.type = 'button';
        reprogBtn.className = 'btn btn-light btn-xs';
        reprogBtn.textContent = 'Reprogramar';
        reprogBtn.addEventListener('click', () => openRescheduleModal(t));
        container.appendChild(reprogBtn);

        // Cancelar
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-danger btn-xs';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.addEventListener('click', () => handleCancelTurno(t.id_turno));
        container.appendChild(cancelBtn);
      }
    }

    // 3. ESTADO: EN_CONSULTORIO
    else if (estado === 'EN_CONSULTORIO') {
      // Observaciones (Admin, Recep y el Médico asignado - A2)
      const obsBtn = document.createElement('button');
      obsBtn.type = 'button';
      obsBtn.className = 'btn btn-light btn-xs';
      obsBtn.textContent = t.observaciones ? 'Observaciones ✎' : '+ Observaciones';
      obsBtn.title = 'Registrar o editar observaciones clínicas';
      obsBtn.addEventListener('click', () => openObservationsModal(t));
      container.appendChild(obsBtn);

      // Marcar Asistido (solo PROFESIONAL - A1)
      if (isDoctor) {
        const asistBtn = document.createElement('button');
        asistBtn.type = 'button';
        asistBtn.className = 'btn btn-primary btn-xs';
        asistBtn.textContent = 'Atendido / Asistido';
        asistBtn.addEventListener('click', () => handleStatusChange(t.id_turno, 'ASISTIDO'));
        container.appendChild(asistBtn);
      }
    }

    // 4. ESTADOS FINALES (ASISTIDO, AUSENTE, CANCELADO)
    else {
      if (t.observaciones) {
        const verObsBtn = document.createElement('button');
        verObsBtn.type = 'button';
        verObsBtn.className = 'btn btn-light btn-xs';
        verObsBtn.textContent = 'Ver notas';
        verObsBtn.addEventListener('click', () => {
          window.AppUI.modal({
            title: `Observaciones - Turno #${t.id_turno}`,
            size: 'sm',
            content: `<p style="white-space: pre-wrap; margin: 0;">${window.AppHelpers.esc(t.observaciones)}</p>`,
            actions: [{ label: 'Cerrar', className: 'btn btn-light', onClick: (_, c) => c() }]
          });
        });
        container.appendChild(verObsBtn);
      }
    }
  }

  /**
   * Determina si la hora actual cae dentro de la franja [hora, hora + 30 min).
   */
  function isTimeInSlot(horaTurno) {
    const now = new Date();
    const currMin = now.getHours() * 60 + now.getMinutes();

    const [h, m] = horaTurno.split(':').map(Number);
    const turnoMin = h * 60 + m;

    return currMin >= turnoMin && currMin < turnoMin + 30;
  }

  /**
   * Cambia el estado de un turno mediante la API (PATCH /api/turnos/:id/estado).
   */
  async function handleStatusChange(id_turno, nuevoEstado) {
    try {
      await window.Api.turnos.changeStatus(id_turno, nuevoEstado);
      window.AppUI.showToast(`Estado actualizado a ${nuevoEstado}.`, 'ok');
      loadTurnos();
    } catch (err) {
      window.AppUI.showToast(err.message || 'Error al actualizar el estado del turno.', 'bad');
    }
  }

  /**
   * Cancela un turno con confirmación modal (DELETE /api/turnos/:id).
   */
  async function handleCancelTurno(id_turno) {
    const ok = await window.AppUI.confirm({
      title: 'Cancelar turno',
      message: '¿Está seguro de que desea cancelar este turno médico? El horario quedará liberado.',
      confirmText: 'Cancelar turno',
      isDanger: true
    });

    if (!ok) return;

    try {
      await window.Api.turnos.cancel(id_turno);
      window.AppUI.showToast('Turno cancelado correctamente.', 'ok');
      loadTurnos();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo cancelar el turno.', 'bad');
    }
  }

  /**
   * Modal de Edición de Observaciones (FE-TUR-23 / A2).
   */
  function openObservationsModal(t) {
    const formHtml = `
      <form id="modalObsForm" novalidate>
        <p style="margin-top: 0;">
          Paciente: <strong>${window.AppHelpers.esc(t.paciente_nombre)} ${window.AppHelpers.esc(t.paciente_apellido)}</strong> (${window.AppHelpers.esc(t.fecha)} ${window.AppHelpers.esc(t.hora)})
        </p>
        <div class="field">
          <label for="obsTextarea">Observaciones médicas / diagnóstico / indicaciones (máximo 500 caracteres):</label>
          <textarea id="obsTextarea" rows="5" maxlength="500" placeholder="Escriba las observaciones clínicas...">${window.AppHelpers.esc(t.observaciones || '')}</textarea>
          <small class="error" id="obsError"></small>
        </div>
      </form>
    `;

    window.AppUI.modal({
      title: 'Observaciones de Consulta',
      size: 'md',
      content: formHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, c) => c() },
        {
          label: 'Guardar observaciones',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const obsVal = document.getElementById('obsTextarea').value.trim();
            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Guardando...');

            try {
              await window.Api.turnos.update(t.id_turno, { observaciones: obsVal || null });
              window.AppUI.showToast('Observaciones guardadas exitosamente.', 'ok');
              close();
              loadTurnos();
            } catch (err) {
              window.AppUI.showToast(err.message || 'Error al guardar observaciones.', 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });
  }

  /**
   * Modal de Reprogramación de Turno (FE-TUR-22 / DUDA-21).
   */
  async function openRescheduleModal(t) {
    // Cargar médicos activos
    const docs = cachedDoctors.filter((d) => d.estado === 1);
    const doctorOptions = docs
      .map(
        (d) =>
          `<option value="${d.id_profesional}" ${d.id_profesional === t.id_profesional ? 'selected' : ''}>${window.AppHelpers.esc(d.apellido)}, ${window.AppHelpers.esc(d.nombre)} — Cons. ${window.AppHelpers.esc(d.consultorio || '-')}</option>`
      )
      .join('');

    const formHtml = `
      <form id="modalRescheduleForm" novalidate>
        <p style="margin-top: 0;">
          Paciente: <strong>${window.AppHelpers.esc(t.paciente_nombre)} ${window.AppHelpers.esc(t.paciente_apellido)}</strong> (DNI ${window.AppHelpers.esc(t.paciente_dni)})
        </p>
        <div class="grid-form" style="gap: 12px; margin-bottom: 12px;">
          <div class="field span-2">
            <label for="repDoctor">Profesional médico *</label>
            <select id="repDoctor" required>${doctorOptions}</select>
            <small class="error" id="repDoctorError"></small>
          </div>
          <div class="field">
            <label for="repDate">Nueva fecha *</label>
            <input type="date" id="repDate" value="${t.fecha}" min="${window.AppHelpers.todayLocal()}" required>
            <small class="error" id="repDateError"></small>
          </div>
          <div class="field">
            <label for="repTime">Nuevo horario *</label>
            <select id="repTime" required>
              <option value="">Cargando horarios...</option>
            </select>
            <small class="error" id="repTimeError"></small>
          </div>
          <div class="field span-2">
            <label for="repMotivo">Motivo de consulta</label>
            <textarea id="repMotivo" rows="2" maxlength="255">${window.AppHelpers.esc(t.motivo_consulta || '')}</textarea>
          </div>
        </div>
      </form>
    `;

    const modal = window.AppUI.modal({
      title: `Reprogramar Turno #${t.id_turno}`,
      size: 'md',
      content: formHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, c) => c() },
        {
          label: 'Confirmar reprogramación',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const docId = Number(document.getElementById('repDoctor').value);
            const fechaVal = document.getElementById('repDate').value;
            const horaVal = document.getElementById('repTime').value;
            const motivoVal = document.getElementById('repMotivo').value.trim();

            const timeError = document.getElementById('repTimeError');
            timeError.textContent = '';

            if (!horaVal) {
              timeError.textContent = 'Debe seleccionar un horario de atención.';
              return;
            }

            const payload = {};
            if (docId !== t.id_profesional) payload.id_profesional = docId;
            if (fechaVal !== t.fecha) payload.fecha = fechaVal;
            if (horaVal !== t.hora) payload.hora = horaVal;
            if (motivoVal !== (t.motivo_consulta || '')) payload.motivo_consulta = motivoVal || null;

            if (Object.keys(payload).length === 0) {
              window.AppUI.showToast('No se realizaron cambios en el turno.', 'info');
              close();
              return;
            }

            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Reprogramando...');

            try {
              await window.Api.turnos.update(t.id_turno, payload);
              window.AppUI.showToast('Turno reprogramado exitosamente.', 'ok');
              close();
              loadTurnos();
            } catch (err) {
              window.AppUI.showToast(err.message || 'Error al reprogramar el turno.', 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });

    const repDocSelect = modal.dialog.querySelector('#repDoctor');
    const repDateInput = modal.dialog.querySelector('#repDate');
    const repTimeSelect = modal.dialog.querySelector('#repTime');

    // Cargar horarios libres para la combinación seleccionada (incluyendo el actual si coincide médico y fecha - FE-TUR-22)
    async function loadRepSlots() {
      const docId = Number(repDocSelect.value);
      const fecha = repDateInput.value;

      if (!docId || !fecha) {
        repTimeSelect.innerHTML = '<option value="">Seleccione médico y fecha</option>';
        repTimeSelect.disabled = true;
        return;
      }

      repTimeSelect.innerHTML = '<option value="">Cargando horarios...</option>';
      repTimeSelect.disabled = true;

      try {
        const res = await window.Api.turnos.getDisponibles({ id_profesional: docId, fecha });
        const data = res.data || [];
        const horarios = (data[0] && data[0].horarios) ? [...data[0].horarios] : [];

        // FE-TUR-22: si médico y fecha no cambian, agregar manualmente el horario actual del turno
        if (docId === t.id_profesional && fecha === t.fecha && !horarios.includes(t.hora)) {
          horarios.push(t.hora);
          horarios.sort();
        }

        if (horarios.length === 0) {
          repTimeSelect.innerHTML = '<option value="">Sin horarios disponibles</option>';
          repTimeSelect.disabled = true;
          return;
        }

        repTimeSelect.innerHTML = horarios
          .map((h) => `<option value="${h}" ${h === t.hora ? 'selected' : ''}>${h}</option>`)
          .join('');
        repTimeSelect.disabled = false;
      } catch (err) {
        repTimeSelect.innerHTML = '<option value="">Error al obtener horarios</option>';
      }
    }

    repDocSelect.addEventListener('change', loadRepSlots);
    repDateInput.addEventListener('change', loadRepSlots);
    loadRepSlots();
  }

  /**
   * Actualiza los controles visuales de paginación.
   */
  function updatePagination(from, to, total) {
    paginationInfo.textContent = `Mostrando ${from} - ${to} de ${total} turnos`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = to >= total;
  }

  /* -------------------------------------------------------------
     LÓGICA DEL FORMULARIO DE ALTA DE TURNO (ADMIN/RECEP)
     ------------------------------------------------------------- */
  async function initCreateForm() {
    turnDateInput.min = window.AppHelpers.todayLocal();
    turnDateInput.value = window.AppHelpers.todayLocal();

    // Cargar especialidades y médicos
    try {
      const [espRes, docRes] = await Promise.all([
        window.Api.especialidades.list({ estado: 1 }),
        window.Api.profesionales.list({ estado: 1 })
      ]);

      cachedSpecialties = espRes.data || [];
      cachedDoctors = docRes.data || [];

      specialtySelect.innerHTML = '<option value="">Seleccione especialidad...</option>' +
        cachedSpecialties.map((e) => `<option value="${e.id_especialidad}">${window.AppHelpers.esc(e.nombre)}</option>`).join('');
    } catch (err) {
      console.error('Error al inicializar formulario de turnos:', err);
    }

    // Cascada especialidad -> profesionales
    specialtySelect.addEventListener('change', () => {
      const espId = Number(specialtySelect.value);
      if (!espId) {
        doctorSelect.innerHTML = '<option value="">Primero elija una especialidad</option>';
        doctorSelect.disabled = true;
        resetAvailableSlots();
        return;
      }

      const filteredDocs = cachedDoctors.filter((d) => d.id_especialidad === espId && d.consultorio);
      if (filteredDocs.length === 0) {
        doctorSelect.innerHTML = '<option value="">Sin médicos con consultorio en esta rama</option>';
        doctorSelect.disabled = true;
        resetAvailableSlots();
        return;
      }

      doctorSelect.innerHTML = '<option value="">Seleccione médico...</option>' +
        filteredDocs.map((d) => `<option value="${d.id_profesional}">${window.AppHelpers.esc(d.apellido)}, ${window.AppHelpers.esc(d.nombre)} — Cons. ${window.AppHelpers.esc(d.consultorio)}</option>`).join('');
      doctorSelect.disabled = false;
      resetAvailableSlots();
    });

    doctorSelect.addEventListener('change', fetchAvailableSlots);
    turnDateInput.addEventListener('change', fetchAvailableSlots);

    // Combobox de búsqueda de paciente (FE-TUR-01)
    initPatientCombobox();

    // Toggle de formulario
    toggleNewTurnBtn.addEventListener('click', () => {
      turnFormCard.classList.toggle('hidden');
      if (!turnFormCard.classList.contains('hidden')) {
        patientSearchInput.focus();
        turnFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    cancelTurnBtn.addEventListener('click', () => {
      turnFormCard.classList.add('hidden');
      turnForm.reset();
      patientSelect.value = '';
      patientSearchInput.value = '';
      resetAvailableSlots();
    });

    turnForm.addEventListener('submit', handleCreateTurnSubmit);
  }

  /**
   * Combobox reactivo de búsqueda de paciente (FE-TUR-01 / DUDA-20).
   */
  function initPatientCombobox() {
    let comboboxAbort = null;

    const handlePatientSearch = window.AppHelpers.debounce(async () => {
      const q = patientSearchInput.value.trim();
      if (!q) {
        patientDropdown.classList.add('hidden');
        patientSelect.value = '';
        return;
      }

      if (comboboxAbort) comboboxAbort.abort();
      comboboxAbort = new AbortController();

      try {
        const res = await window.Api.pacientes.list({ q, estado: 1 }, comboboxAbort.signal);
        const pacientes = res.data || [];

        if (pacientes.length === 0) {
          patientDropdown.innerHTML = '<div class="autocomplete-item" style="color: var(--muted); cursor: default;">Sin coincidencias</div>';
          patientDropdown.classList.remove('hidden');
          return;
        }

        patientDropdown.innerHTML = '';
        pacientes.forEach((p) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.innerHTML = `
            <strong>${window.AppHelpers.esc(p.apellido)}, ${window.AppHelpers.esc(p.nombre)}</strong>
            <span class="item-sub">DNI: ${window.AppHelpers.esc(p.dni)} · ${window.AppHelpers.esc(p.correo)}</span>
          `;
          item.addEventListener('click', () => {
            patientSelect.value = p.id_paciente;
            patientSearchInput.value = `${p.apellido}, ${p.nombre} (DNI ${p.dni})`;
            patientDropdown.classList.add('hidden');
            document.getElementById('id_pacienteError').textContent = '';
            specialtySelect.focus();
          });
          patientDropdown.appendChild(item);
        });

        patientDropdown.classList.remove('hidden');
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }, 250);

    patientSearchInput.addEventListener('input', handlePatientSearch);

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!patientSearchInput.contains(e.target) && !patientDropdown.contains(e.target)) {
        patientDropdown.classList.add('hidden');
      }
    });
  }

  /**
   * Reinicia el selector de horarios disponibles.
   */
  function resetAvailableSlots() {
    turnTimeSelect.innerHTML = '<option value="">Seleccione médico y fecha</option>';
    turnTimeSelect.disabled = true;
  }

  /**
   * Consulta horarios libres a /api/turnos/disponibles (FE-TUR-03).
   */
  async function fetchAvailableSlots() {
    const docId = Number(doctorSelect.value);
    const fecha = turnDateInput.value;

    if (!docId || !fecha) {
      resetAvailableSlots();
      return;
    }

    turnTimeSelect.innerHTML = '<option value="">Consultando disponibilidad...</option>';
    turnTimeSelect.disabled = true;

    try {
      const res = await window.Api.turnos.getDisponibles({ id_profesional: docId, fecha });
      const data = res.data || [];
      const horarios = (data[0] && data[0].horarios) ? data[0].horarios : [];

      if (horarios.length === 0) {
        turnTimeSelect.innerHTML = '<option value="">Sin turnos libres para esta fecha</option>';
        turnTimeSelect.disabled = true;
        return;
      }

      turnTimeSelect.innerHTML = '<option value="">Seleccione hora...</option>' +
        horarios.map((h) => `<option value="${h}">${h}</option>`).join('');
      turnTimeSelect.disabled = false;
    } catch (err) {
      turnTimeSelect.innerHTML = '<option value="">Error al obtener disponibilidad</option>';
    }
  }

  /**
   * Envío del formulario de alta de turno.
   */
  async function handleCreateTurnSubmit(e) {
    e.preventDefault();

    const id_paciente = Number(patientSelect.value);
    const id_profesional = Number(doctorSelect.value);
    const fecha = turnDateInput.value;
    const hora = turnTimeSelect.value;
    const motivo_consulta = motivoInput.value.trim() || null;

    // Validación cliente
    const errorMap = {};
    if (!id_paciente) errorMap.id_paciente = 'Debe seleccionar un paciente de la lista de búsqueda.';
    if (!id_profesional) errorMap.id_profesional = 'Debe seleccionar un profesional.';
    if (!fecha) errorMap.fecha = 'Fecha requerida.';
    if (!hora) errorMap.hora = 'Debe seleccionar un horario disponible.';

    window.AppUI.renderFieldErrors(turnForm, errorMap);
    if (Object.keys(errorMap).length > 0) return;

    window.AppUI.setLoading(submitTurnBtn, true, 'Confirmando...');

    try {
      await window.Api.turnos.create({
        id_paciente,
        id_profesional,
        fecha,
        hora,
        motivo_consulta
      });

      window.AppUI.showToast('Turno asignado exitosamente.', 'ok');
      turnFormCard.classList.add('hidden');
      turnForm.reset();
      patientSelect.value = '';
      patientSearchInput.value = '';
      resetAvailableSlots();

      loadTurnos();
    } catch (err) {
      if (err.status === 400 || err.status === 409) {
        window.AppUI.renderFieldErrors(turnForm, err.campos);
        window.AppUI.showToast(err.message, 'bad');
        // Recalcular horarios si hubo conflicto
        fetchAvailableSlots();
      } else {
        window.AppUI.showToast(err.message || 'Error al registrar turno.', 'bad');
      }
    } finally {
      window.AppUI.setLoading(submitTurnBtn, false);
    }
  }

  /**
   * Configura eventos de filtros, paginación y refresco periódico.
   */
  function initEvents(usuario) {
    const isDoctor = usuario.rol === 'PROFESIONAL';

    if (isDoctor) {
      if (pageTitle) pageTitle.textContent = 'Mis turnos médicos';
      if (pageSubtitle) pageSubtitle.textContent = 'Historial y consultas programadas bajo su atención.';
      if (toggleNewTurnBtn) toggleNewTurnBtn.classList.add('hidden');
      if (filterDoctorField) filterDoctorField.classList.add('hidden');
    } else {
      initCreateForm();
    }

    // Inicializar filtro de fecha con hoy local
    filterDate.value = window.AppHelpers.todayLocal();

    filterAllDates.addEventListener('change', () => {
      filterDate.disabled = filterAllDates.checked;
      loadTurnos();
    });

    filterDate.addEventListener('change', () => loadTurnos());
    filterStatus.addEventListener('change', () => loadTurnos());

    const debouncedFilter = window.AppHelpers.debounce(() => loadTurnos(), 300);
    filterPatient.addEventListener('input', debouncedFilter);
    filterDoctor.addEventListener('input', debouncedFilter);

    refreshTurnsBtn.addEventListener('click', () => loadTurnos());

    // Paginación
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCurrentPage();
      }
    });

    nextPageBtn.addEventListener('click', () => {
      if (currentPage * PAGE_SIZE < allLoadedTurnos.length) {
        currentPage++;
        renderCurrentPage();
      }
    });

    // FE-GEN-10: Refrescar al reenfocar la ventana y sondeo cada 60s
    window.addEventListener('focus', () => loadTurnos());
    setInterval(() => loadTurnos(), 60000);
  }

  window.AppSession.ready.then((usuario) => {
    initEvents(usuario);
    loadTurnos();
  });
})();
