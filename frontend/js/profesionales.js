/* =============================================================
   js/profesionales.js
   -------------------------------------------------------------
   Lógica de Gestión de Profesionales Médicos:
   - Visualización para ADMINISTRADOR y RECEPCIONISTA (solo lectura).
   - Edición de especialidad, matrícula y consultorio (liberación con null).
   - Editor de Disponibilidad Semanal (reemplazo completo con validación).
   - Modal de Baja Guiada con checklist de bloqueos (FE-PRO-04).
   - Reactivación con advertencia guiada (FE-PRO-05).
   ============================================================= */

(function () {
  'use strict';

  let currentAbortController = null;
  let activeEstado = '1';
  let cachedEspecialidades = [];

  const tableBody = document.getElementById('doctorsTable');
  const searchInput = document.getElementById('docSearch');
  const specialtySearchInput = document.getElementById('docSpecialtySearch');
  const actionsHeader = document.getElementById('docActionsHeader');
  const createDocHelp = document.getElementById('createDocHelp');

  /**
   * Carga el listado de profesionales médicos desde la API.
   */
  async function loadDoctors() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const nombre = searchInput.value.trim();
    const especialidad = specialtySearchInput.value.trim();

    const query = {
      nombre: nombre || undefined,
      especialidad: especialidad || undefined,
      estado: activeEstado !== 'todos' ? activeEstado : 'todos'
    };

    const isAdmin = window.AppSession.isAdmin();
    const colCount = isAdmin ? 7 : 6;

    tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row">Cargando profesionales...</td></tr>`;

    try {
      const res = await window.Api.profesionales.list(query, currentAbortController.signal);
      renderTable(res.data || []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar profesionales:', err);
      tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar profesionales')}</td></tr>`;
    }
  }

  /**
   * Renderiza las filas de la tabla de profesionales.
   */
  function renderTable(doctores) {
    const isAdmin = window.AppSession.isAdmin();
    const colCount = isAdmin ? 7 : 6;

    if (!doctores || doctores.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row">No se encontraron profesionales médicos.</td></tr>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    doctores.forEach((doc) => {
      const tr = document.createElement('tr');

      const consultorioLabel = doc.consultorio
        ? window.AppHelpers.esc(doc.consultorio)
        : '<span class="muted" style="font-style: italic;">Sin asignar</span>';

      tr.innerHTML = `
        <td><strong>${window.AppHelpers.esc(doc.apellido)}, ${window.AppHelpers.esc(doc.nombre)}</strong></td>
        <td>${window.AppHelpers.esc(doc.especialidad_nombre || '-')}</td>
        <td><code>${window.AppHelpers.esc(doc.matricula)}</code></td>
        <td>${consultorioLabel}</td>
        <td>${window.AppHelpers.esc(doc.usuario_correo || '-')}</td>
        <td>${window.AppHelpers.activeBadge(doc.estado)}</td>
        ${isAdmin ? '<td class="actions-cell"></td>' : ''}
      `;

      if (isAdmin) {
        const actionsCell = tr.querySelector('.actions-cell');

        // Botón Editar datos médicos
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-light btn-xs';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openEditDoctorModal(doc));
        actionsCell.appendChild(editBtn);

        // Botón Disponibilidad
        const dispBtn = document.createElement('button');
        dispBtn.type = 'button';
        dispBtn.className = 'btn btn-light btn-xs';
        dispBtn.textContent = 'Agenda';
        dispBtn.title = 'Editar disponibilidad semanal';
        dispBtn.addEventListener('click', () => openAvailabilityModal(doc));
        actionsCell.appendChild(dispBtn);

        // Desactivación guiada / Reactivación
        if (doc.estado === 1) {
          const deactBtn = document.createElement('button');
          deactBtn.type = 'button';
          deactBtn.className = 'btn btn-danger btn-xs';
          deactBtn.textContent = 'Baja';
          deactBtn.title = 'Baja lógica guiada del profesional';
          deactBtn.addEventListener('click', () => openDeactivateDoctorChecklist(doc));
          actionsCell.appendChild(deactBtn);
        } else {
          const actBtn = document.createElement('button');
          actBtn.type = 'button';
          actBtn.className = 'btn btn-light btn-xs';
          actBtn.style.color = 'var(--success)';
          actBtn.textContent = 'Reactivar';
          actBtn.addEventListener('click', () => handleActivateDoctor(doc));
          actionsCell.appendChild(actBtn);
        }
      }

      fragment.appendChild(tr);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
  }

  /**
   * Modal de Edición de Profesional (FE-PRO-02).
   */
  async function openEditDoctorModal(doc) {
    if (cachedEspecialidades.length === 0) {
      try {
        const res = await window.Api.especialidades.list({ estado: 1 });
        cachedEspecialidades = res.data || [];
      } catch (err) {
        console.error('Error al cargar especialidades:', err);
      }
    }

    const especialidadesOptions = cachedEspecialidades
      .map(
        (e) =>
          `<option value="${e.id_especialidad}" ${e.id_especialidad === doc.id_especialidad ? 'selected' : ''}>${window.AppHelpers.esc(e.nombre)}</option>`
      )
      .join('');

    const formHtml = `
      <form id="modalEditDoctorForm" novalidate>
        <p style="margin-top: 0;">Profesional: <strong>${window.AppHelpers.esc(doc.nombre)} ${window.AppHelpers.esc(doc.apellido)}</strong></p>
        <div class="field" style="margin-bottom: 12px;">
          <label for="edEspecialidad">Especialidad médica *</label>
          <select id="edEspecialidad" name="id_especialidad" required>
            ${especialidadesOptions}
          </select>
          <small class="error" id="edEspecialidadError"></small>
        </div>
        <div class="field" style="margin-bottom: 12px;">
          <label for="edMatricula">Matrícula (5 dígitos) *</label>
          <input id="edMatricula" name="matricula" value="${window.AppHelpers.esc(doc.matricula)}" maxlength="5" required>
          <small class="error" id="edMatriculaError"></small>
        </div>
        <div class="field" style="margin-bottom: 12px;">
          <label for="edConsultorio">Consultorio asignado (dejar vacío para liberar consultorio)</label>
          <input id="edConsultorio" name="consultorio" value="${window.AppHelpers.esc(doc.consultorio || '')}" maxlength="20" placeholder="Ej: 101 o vacío para liberar">
          <small class="error" id="edConsultorioError"></small>
        </div>
        <p class="muted" style="font-size: 0.84rem; margin: 0;">
          Para liberar el consultorio (requisito previo a una baja médica), borre el texto del campo consultorio.
        </p>
      </form>
    `;

    window.AppUI.modal({
      title: `Editar Profesional: ${doc.nombre} ${doc.apellido}`,
      size: 'md',
      content: formHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, close) => close() },
        {
          label: 'Guardar cambios',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const idEsp = Number(document.getElementById('edEspecialidad').value);
            const matricula = document.getElementById('edMatricula').value.trim();
            const consultorio = document.getElementById('edConsultorio').value.trim();

            const matError = document.getElementById('edMatriculaError');
            matError.textContent = '';

            if (!/^\d{5}$/.test(matricula)) {
              matError.textContent = 'La matrícula debe tener exactamente 5 dígitos numéricos.';
              return;
            }

            const payload = {
              id_especialidad: idEsp,
              matricula,
              consultorio: consultorio || null
            };

            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Guardando...');

            try {
              await window.Api.profesionales.update(doc.id_profesional, payload);
              window.AppUI.showToast('Profesional actualizado correctamente.', 'ok');
              close();
              loadDoctors();
            } catch (err) {
              if (err.campos?.matricula) {
                document.getElementById('edMatriculaError').textContent = err.campos.matricula;
              }
              if (err.campos?.consultorio) {
                document.getElementById('edConsultorioError').textContent = err.campos.consultorio;
              }
              window.AppUI.showToast(err.message || 'Error al actualizar el profesional.', 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });
  }

  /**
   * Modal Editor de Disponibilidad Semanal (FE-PRO-03).
   */
  async function openAvailabilityModal(doc) {
    let currentFranjas = [];
    try {
      const res = await window.Api.profesionales.getDisponibilidad(doc.id_profesional);
      currentFranjas = res.data || [];
    } catch (err) {
      console.error('Error al cargar disponibilidad:', err);
      window.AppUI.showToast('No se pudo cargar la disponibilidad actual.', 'bad');
      return;
    }

    const contentHtml = `
      <form id="modalAvailabilityForm" novalidate>
        <p style="margin-top: 0;">Disponibilidad semanal de atención para <strong>${window.AppHelpers.esc(doc.nombre)} ${window.AppHelpers.esc(doc.apellido)}</strong>:</p>
        <div id="avFranjasList" class="franjas-list" style="max-height: 360px; overflow-y: auto;"></div>
        <button type="button" class="btn btn-light btn-xs" id="avAddFranjaBtn" style="margin-top: 10px;">+ Agregar franja horaria</button>
        <small class="error" id="avError" style="display: block; margin-top: 8px;"></small>
        <p class="muted" style="font-size: 0.84rem; margin: 12px 0 0;">
          Nota: puede eliminar todas las franjas únicamente si está preparando la baja médica del profesional.
        </p>
      </form>
    `;

    const modal = window.AppUI.modal({
      title: `Disponibilidad semanal - ${doc.nombre} ${doc.apellido}`,
      size: 'lg',
      content: contentHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, close) => close() },
        {
          label: 'Guardar agenda',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const listEl = document.getElementById('avFranjasList');
            const errorEl = document.getElementById('avError');
            errorEl.textContent = '';

            const franjas = [];
            const rows = listEl.querySelectorAll('.franja-row');
            rows.forEach((r) => {
              const dia = r.querySelector('.franja-dia').value;
              const inicio = r.querySelector('.franja-inicio').value;
              const fin = r.querySelector('.franja-fin').value;
              franjas.push({ dia_semana: dia, hora_inicio: inicio, hora_fin: fin });
            });

            // Validar que inicio < fin y no se solapen dentro del mismo día
            for (const f of franjas) {
              if (f.hora_inicio >= f.hora_fin) {
                errorEl.textContent = `En ${f.dia_semana}, el horario de fin (${f.hora_fin}) debe ser posterior al de inicio (${f.hora_inicio}).`;
                return;
              }
            }

            // Validar solapamiento por día
            const porDia = {};
            for (const f of franjas) {
              porDia[f.dia_semana] = porDia[f.dia_semana] || [];
              porDia[f.dia_semana].push(f);
            }
            for (const [dia, lista] of Object.entries(porDia)) {
              lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
              for (let i = 0; i < lista.length - 1; i++) {
                if (lista[i].hora_fin > lista[i + 1].hora_inicio) {
                  errorEl.textContent = `Existe superposición horaria en el día ${dia}: ${lista[i].hora_inicio}-${lista[i].hora_fin} con ${lista[i + 1].hora_inicio}-${lista[i + 1].hora_fin}.`;
                  return;
                }
              }
            }

            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Guardando...');

            try {
              await window.Api.profesionales.updateDisponibilidad(doc.id_profesional, franjas);
              window.AppUI.showToast('Disponibilidad actualizada exitosamente.', 'ok');
              close();
              loadDoctors();
            } catch (err) {
              // Conflicto 409 con turnos futuros existentes fuera del nuevo horario
              errorEl.textContent = err.message;
              window.AppUI.showToast(err.message, 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });

    const franjasList = modal.dialog.querySelector('#avFranjasList');
    const addBtn = modal.dialog.querySelector('#avAddFranjaBtn');

    // Cargar franjas existentes o mensaje
    if (currentFranjas.length > 0) {
      currentFranjas.forEach((f) => {
        addFranjaRow(franjasList, f.dia_semana, f.hora_inicio, f.hora_fin);
      });
    }

    addBtn.addEventListener('click', () => {
      addFranjaRow(franjasList, 'LUNES', '08:00', '12:00');
    });
  }

  /**
   * Helper para generar filas de franjas horarias con intervalos de 30 min.
   */
  function addFranjaRow(container, defaultDia = 'LUNES', defaultInicio = '08:00', defaultFin = '12:00') {
    const row = document.createElement('div');
    row.className = 'franja-row';

    const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    const diasOptions = dias
      .map((d) => `<option value="${d}" ${d === defaultDia ? 'selected' : ''}>${d}</option>`)
      .join('');

    const horasInicio = [];
    const horasFin = [];
    for (let h = 8; h <= 20; h++) {
      const hh = String(h).padStart(2, '0');
      horasInicio.push(`${hh}:00`, `${hh}:30`);
    }
    for (let h = 8; h <= 21; h++) {
      const hh = String(h).padStart(2, '0');
      if (h === 8) {
        horasFin.push(`${hh}:30`);
      } else if (h === 21) {
        horasFin.push(`${hh}:00`);
      } else {
        horasFin.push(`${hh}:00`, `${hh}:30`);
      }
    }

    const inicioOpts = horasInicio
      .map((h) => `<option value="${h}" ${h === defaultInicio ? 'selected' : ''}>${h}</option>`)
      .join('');
    const finOpts = horasFin
      .map((h) => `<option value="${h}" ${h === defaultFin ? 'selected' : ''}>${h}</option>`)
      .join('');

    row.innerHTML = `
      <select class="franja-dia">${diasOptions}</select>
      <select class="franja-inicio">${inicioOpts}</select>
      <select class="franja-fin">${finOpts}</select>
      <button type="button" class="btn btn-light btn-xs franja-remove-btn" title="Eliminar franja" style="color: var(--danger); font-size: 1rem;">✕</button>
    `;

    row.querySelector('.franja-remove-btn').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  /**
   * Modal de Baja Médica Guiada con Checklist de Bloqueos (FE-PRO-04 / DUDA-23).
   */
  async function openDeactivateDoctorChecklist(doc) {
    // Consultar disponibilidad actual
    let franjas = [];
    try {
      const dispRes = await window.Api.profesionales.getDisponibilidad(doc.id_profesional);
      franjas = dispRes.data || [];
    } catch {
      franjas = [];
    }

    const isConsultorioLiberado = !doc.consultorio;
    const isAgendaVacia = franjas.length === 0;

    const contentHtml = `
      <div>
        <p style="margin-top: 0;">
          Para dar de baja al profesional <strong>${window.AppHelpers.esc(doc.nombre)} ${window.AppHelpers.esc(doc.apellido)}</strong>, el sistema exige cumplir las siguientes 3 condiciones de seguridad:
        </p>

        <div class="checklist-card">
          <!-- Paso 1: Consultorio liberado -->
          <div class="checklist-item ${isConsultorioLiberado ? 'ready' : 'blocked'}" id="checkStepConsultorio">
            <div>
              <span class="checklist-icon">${isConsultorioLiberado ? '✓' : '⚠️'}</span>
              <strong>1. Consultorio liberado:</strong> ${isConsultorioLiberado ? 'Consultorio liberado (sin asignar)' : `Asignado a: "${window.AppHelpers.esc(doc.consultorio)}"`}
            </div>
            ${
              !isConsultorioLiberado
                ? '<button type="button" class="btn btn-light btn-xs" id="btnActionLiberarCons">Liberar ahora</button>'
                : '<span style="font-size: 0.84rem; font-weight: 600;">Completado</span>'
            }
          </div>

          <!-- Paso 2: Agenda vacía -->
          <div class="checklist-item ${isAgendaVacia ? 'ready' : 'blocked'}" id="checkStepAgenda">
            <div>
              <span class="checklist-icon">${isAgendaVacia ? '✓' : '⚠️'}</span>
              <strong>2. Agenda de atención vacía:</strong> ${isAgendaVacia ? 'Sin franjas configuradas' : `Tiene ${franjas.length} franja(s) activa(s)`}
            </div>
            ${
              !isAgendaVacia
                ? '<button type="button" class="btn btn-light btn-xs" id="btnActionVaciarAgenda">Vaciar agenda</button>'
                : '<span style="font-size: 0.84rem; font-weight: 600;">Completado</span>'
            }
          </div>

          <!-- Paso 3: Turnos futuros -->
          <div class="checklist-item ready" id="checkStepTurnos">
            <div>
              <span class="checklist-icon">ℹ</span>
              <strong>3. Sin turnos futuros activos:</strong> Si posee turnos pendientes o confirmados, deberá cancelarlos o reprogramarlos.
            </div>
          </div>
        </div>

        <p class="muted" style="font-size: 0.84rem; margin-bottom: 0;">
          Al completarse la baja, también se desactivará la cuenta de usuario asociada y se cerrarán sus sesiones activas.
        </p>
      </div>
    `;

    const modal = window.AppUI.modal({
      title: `Baja Médica - Checklist de Bloqueos`,
      size: 'lg',
      content: contentHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, close) => close() },
        {
          label: 'Confirmar baja del profesional',
          className: 'btn btn-danger',
          onClick: async (e, close) => {
            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Procesando baja...');

            try {
              await window.Api.profesionales.deactivate(doc.id_profesional);
              window.AppUI.showToast('Profesional dado de baja exitosamente.', 'ok');
              close();
              loadDoctors();
            } catch (err) {
              window.AppUI.showToast(err.message || 'No se pudo dar de baja al profesional.', 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });

    // Acción rápida: Liberar consultorio
    const btnLibCons = modal.dialog.querySelector('#btnActionLiberarCons');
    if (btnLibCons) {
      btnLibCons.addEventListener('click', async () => {
        window.AppUI.setLoading(btnLibCons, true, 'Liberando...');
        try {
          await window.Api.profesionales.update(doc.id_profesional, {
            id_especialidad: doc.id_especialidad,
            matricula: doc.matricula,
            consultorio: null
          });
          window.AppUI.showToast('Consultorio liberado.', 'ok');
          modal.close();
          // Reabrir modal con estado actualizado
          const updatedDoc = { ...doc, consultorio: null };
          openDeactivateDoctorChecklist(updatedDoc);
        } catch (err) {
          window.AppUI.showToast(err.message, 'bad');
          window.AppUI.setLoading(btnLibCons, false);
        }
      });
    }

    // Acción rápida: Vaciar agenda
    const btnVacAgenda = modal.dialog.querySelector('#btnActionVaciarAgenda');
    if (btnVacAgenda) {
      btnVacAgenda.addEventListener('click', async () => {
        window.AppUI.setLoading(btnVacAgenda, true, 'Vaciando...');
        try {
          await window.Api.profesionales.updateDisponibilidad(doc.id_profesional, []);
          window.AppUI.showToast('Agenda de atención vaciada.', 'ok');
          modal.close();
          openDeactivateDoctorChecklist(doc);
        } catch (err) {
          window.AppUI.showToast(err.message, 'bad');
          window.AppUI.setLoading(btnVacAgenda, false);
        }
      });
    }
  }

  /**
   * Reactivar profesional con aviso guiado (FE-PRO-05).
   */
  async function handleActivateDoctor(doc) {
    const ok = await window.AppUI.confirm({
      title: 'Reactivar profesional',
      message: `¿Desea reactivar al Dr./Dra. ${doc.nombre} ${doc.apellido}? También se reactivará su usuario asociado.`,
      confirmText: 'Reactivar'
    });

    if (!ok) return;

    try {
      await window.Api.profesionales.activate(doc.id_profesional);
      window.AppUI.showToast('Profesional reactivado exitosamente.', 'ok');

      // Advertencia de consultorio y agenda vacíos (FE-PRO-05)
      window.AppUI.modal({
        title: 'Profesional reactivado',
        size: 'sm',
        content: `
          <p>El profesional <strong>${window.AppHelpers.esc(doc.nombre)} ${window.AppHelpers.esc(doc.apellido)}</strong> ha sido reactivado.</p>
          <p style="color: var(--warning-text); font-weight: 600;">
            ⚠️ Recuerde que el profesional queda actualmente <em>sin consultorio asignado</em> y <em>sin agenda de atención</em>. Asigne un consultorio y configure su disponibilidad para poder emitir turnos.
          </p>
        `,
        actions: [{ label: 'Entendido', className: 'btn btn-primary', onClick: (_, c) => c() }]
      });

      loadDoctors();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo reactivar al profesional.', 'bad');
    }
  }

  /**
   * Inicialización de eventos y adaptaciones por rol.
   */
  function initEvents(usuario) {
    const isAdmin = usuario.rol === 'ADMINISTRADOR';

    if (!isAdmin) {
      if (actionsHeader) actionsHeader.classList.add('hidden');
      if (createDocHelp) createDocHelp.classList.add('hidden');
    }

    const debouncedSearch = window.AppHelpers.debounce(() => loadDoctors(), 300);
    searchInput.addEventListener('input', debouncedSearch);
    specialtySearchInput.addEventListener('input', debouncedSearch);

    document.querySelectorAll('.pill-group .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-group .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeEstado = btn.dataset.estado;
        loadDoctors();
      });
    });
  }

  window.AppSession.ready.then((usuario) => {
    initEvents(usuario);
    loadDoctors();
  });
})();
