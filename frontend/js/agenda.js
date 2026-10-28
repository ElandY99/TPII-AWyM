/* =============================================================
   js/agenda.js
   -------------------------------------------------------------
   Lógica de la Agenda Médica:
   - Vista Diaria (por fecha) y Mensual (por mes, agrupada por día - DUDA-12a).
   - Filtros de especialidad y profesional (ocultos para rol PROFESIONAL).
   - Horarios LIBRE vs OCUPADO (con diferenciación de vencidos - FE-AGE-08).
   - Clic en slot LIBRE -> Redirige a solicitar turno pre-cargado.
   - Clic en slot OCUPADO -> Modal de detalle y acciones directas (A10).
   ============================================================= */

(function () {
  'use strict';

  let currentMode = 'daily'; // 'daily' | 'monthly'
  let currentAbortController = null;
  let cachedDoctors = [];

  // Referencias DOM
  const btnModeDaily = document.getElementById('btnModeDaily');
  const btnModeMonthly = document.getElementById('btnModeMonthly');
  const agendaDateInput = document.getElementById('agendaDate');
  const agendaDateLabel = document.getElementById('agendaDateLabel');
  const agendaSpecialty = document.getElementById('agendaSpecialty');
  const agendaDoctor = document.getElementById('agendaDoctor');
  const specialtyField = document.getElementById('agendaSpecialtyField');
  const doctorField = document.getElementById('agendaDoctorField');
  const agendaGrid = document.getElementById('agendaGrid');
  const refreshBtn = document.getElementById('refreshAgendaBtn');

  /**
   * Carga la grilla de agenda desde la API.
   */
  async function loadAgenda() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const isDoctor = window.AppSession.isDoctor();
    const query = {};

    if (currentMode === 'daily') {
      query.fecha = agendaDateInput.value || window.AppHelpers.todayLocal();
    } else {
      query.mes = agendaDateInput.value || window.AppHelpers.todayLocal().slice(0, 7);
    }

    if (!isDoctor) {
      const docId = Number(agendaDoctor.value);
      const espId = Number(agendaSpecialty.value);
      if (docId) query.id_profesional = docId;
      if (espId) query.id_especialidad = espId;
    }

    agendaGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 24px 0;">Cargando agenda médica...</p>';

    try {
      const res = await window.Api.agenda.get(query, currentAbortController.signal);
      renderAgenda(res.data || []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar agenda:', err);
      agendaGrid.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 24px 0;">${window.AppHelpers.esc(err.message || 'Error al cargar la agenda')}</p>`;
    }
  }

  /**
   * Renderiza los profesionales y sus franjas/días.
   */
  function renderAgenda(profesionales) {
    if (!profesionales || profesionales.length === 0) {
      agendaGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 30px 0;">No se registraron agendas médicas para los filtros seleccionados.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    const isRecepOrAdmin = window.AppSession.isAdmin() || window.AppSession.isRecep();
    const hoyLocal = window.AppHelpers.todayLocal();
    const now = new Date();
    const currMin = now.getHours() * 60 + now.getMinutes();

    profesionales.forEach((doc) => {
      const card = document.createElement('section');
      card.className = 'panel-card';
      card.style.marginBottom = '20px';

      const consultorioText = doc.consultorio ? `Consultorio ${window.AppHelpers.esc(doc.consultorio)}` : 'Sin consultorio fijo';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="margin: 0; color: var(--navy-dark); font-size: 1.15rem;">
              Dr./Dra. ${window.AppHelpers.esc(doc.profesional)}
            </h3>
            <span class="muted" style="font-size: 0.88rem;">
              ${window.AppHelpers.esc(doc.especialidad)} · ${consultorioText}
            </span>
          </div>
          <span class="badge" style="background: #edf4fa; color: var(--blue);">
            ${doc.tiene_agenda ? 'Agenda Activa' : 'Sin Agenda'}
          </span>
        </div>
        <div class="doctor-days-container"></div>
      `;

      const daysContainer = card.querySelector('.doctor-days-container');

      if (!doc.tiene_agenda) {
        daysContainer.innerHTML = `
          <div style="padding: 16px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 6px; color: #7a5a18; font-size: 0.92rem;">
            ⚠️ ${window.AppHelpers.esc(doc.mensaje || 'El profesional no posee agenda de atención activa configurada.')}
          </div>
        `;
        fragment.appendChild(card);
        return;
      }

      if (!doc.dias || doc.dias.length === 0) {
        daysContainer.innerHTML = '<p class="muted" style="font-style: italic; margin: 8px 0;">No se registran días de atención para el período seleccionado.</p>';
        fragment.appendChild(card);
        return;
      }

      // Renderizar días
      doc.dias.forEach((dia) => {
        const daySection = document.createElement('div');
        daySection.style.marginBottom = '18px';

        daySection.innerHTML = `
          <h4 style="margin: 0 0 10px; color: var(--navy-dark); font-size: 0.96rem; border-left: 3px solid var(--blue); padding-left: 8px;">
            ${window.AppHelpers.esc(dia.dia_semana)} ${window.AppHelpers.formatDate(dia.fecha)}
          </h4>
          <div class="agenda-slots-list" style="display: grid; gap: 8px;"></div>
        `;

        const slotsList = daySection.querySelector('.agenda-slots-list');

        dia.slots.forEach((slot) => {
          const slotRow = document.createElement('div');
          slotRow.className = 'agenda-slot';

          const [h, m] = slot.hora.split(':').map(Number);
          const slotMin = h * 60 + m;
          const esHoy = dia.fecha === hoyLocal;
          const yaPaso = esHoy && slotMin < currMin;

          if (slot.estado === 'LIBRE') {
            slotRow.classList.add('free');
            if (yaPaso) {
              slotRow.style.opacity = '0.5';
              slotRow.style.cursor = 'not-allowed';
              slotRow.title = 'Horario vencido en el día de hoy';
            }

            slotRow.innerHTML = `
              <strong>${window.AppHelpers.esc(slot.hora)}</strong>
              <span style="color: var(--success); font-weight: 600;">DISPONIBLE</span>
              ${
                isRecepOrAdmin && !yaPaso
                  ? '<button type="button" class="btn btn-secondary btn-xs">Reservar turno</button>'
                  : '<span class="muted" style="font-size: 0.84rem;">Libre</span>'
              }
            `;

            if (isRecepOrAdmin && !yaPaso) {
              slotRow.style.cursor = 'pointer';
              slotRow.addEventListener('click', () => {
                window.location.href = `turno.html?id_profesional=${doc.id_profesional}&fecha=${dia.fecha}&hora=${slot.hora}`;
              });
            }
          } else {
            // Estado OCUPADO
            slotRow.classList.add('busy');
            slotRow.style.cursor = 'pointer';

            const turno = slot.turno || {};
            const pacienteNombre = turno.paciente ? window.AppHelpers.esc(turno.paciente) : 'Paciente asignado';
            const motivoText = turno.motivo ? ` · Motivo: "${window.AppHelpers.esc(turno.motivo)}"` : '';

            slotRow.innerHTML = `
              <strong>${window.AppHelpers.esc(slot.hora)}</strong>
              <div>
                <span><strong>${pacienteNombre}</strong> (DNI ${window.AppHelpers.esc(turno.paciente_dni || '-')})</span>
                <small class="muted" style="display: block;">${motivoText}</small>
              </div>
              <div>${window.AppHelpers.statusBadge(turno.estado)}</div>
            `;

            // Clic en slot OCUPADO -> Modal de Detalle y Acciones del Turno (A10)
            slotRow.addEventListener('click', () => {
              openTurnoDetailModal(turno.id_turno, doc, dia, slot);
            });
          }

          slotsList.appendChild(slotRow);
        });

        daysContainer.appendChild(daySection);
      });

      fragment.appendChild(card);
    });

    agendaGrid.innerHTML = '';
    agendaGrid.appendChild(fragment);
  }

  /**
   * Modal de Detalle y Acciones del Turno abierto directamente desde la Agenda (A10).
   */
  async function openTurnoDetailModal(id_turno, doc, dia, slot) {
    let turnoDetalle = null;
    try {
      const res = await window.Api.turnos.getById(id_turno);
      turnoDetalle = res.data || res;
    } catch (err) {
      console.warn('Cargando con datos de slot...', err);
      turnoDetalle = slot.turno;
    }

    const t = turnoDetalle;
    const isDoctor = window.AppSession.isDoctor();
    const isRecepOrAdmin = window.AppSession.isAdmin() || window.AppSession.isRecep();
    const hoyLocal = window.AppHelpers.todayLocal();

    const [h, m] = slot.hora.split(':').map(Number);
    const slotMin = h * 60 + m;
    const now = new Date();
    const currMin = now.getHours() * 60 + now.getMinutes();
    const enFranja = dia.fecha === hoyLocal && currMin >= slotMin && currMin < slotMin + 30;

    const contentHtml = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; color: var(--navy-dark);">Turno #${t.id_turno || id_turno}</h3>
            <span class="muted" style="font-size: 0.88rem;">${window.AppHelpers.formatDate(t.fecha || dia.fecha)} a las ${window.AppHelpers.esc(t.hora || slot.hora)} hs</span>
          </div>
          <div>${window.AppHelpers.statusBadge(t.estado)}</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid var(--line); border-radius: 6px; padding: 14px; margin-bottom: 16px;">
          <p style="margin: 0 0 6px;"><strong>Paciente:</strong> ${window.AppHelpers.esc(t.paciente_nombre || t.paciente)} (DNI ${window.AppHelpers.esc(t.paciente_dni || '-')})</p>
          <p style="margin: 0 0 6px;"><strong>Profesional:</strong> Dr./Dra. ${window.AppHelpers.esc(doc.profesional)} (${window.AppHelpers.esc(doc.especialidad)} - Cons. ${window.AppHelpers.esc(doc.consultorio || '-')})</p>
          <p style="margin: 0 0 6px;"><strong>Motivo:</strong> ${window.AppHelpers.esc(t.motivo_consulta || t.motivo || 'No especificado')}</p>
          ${t.observaciones ? `<p style="margin: 0;"><strong>Observaciones:</strong> <em>${window.AppHelpers.esc(t.observaciones)}</em></p>` : ''}
        </div>
      </div>
    `;

    // Acciones dinámicas según el estado
    const actions = [
      { label: 'Cerrar', className: 'btn btn-light', onClick: (_, c) => c() }
    ];

    if (t.estado === 'PENDIENTE' && isRecepOrAdmin) {
      actions.push({
        label: 'Confirmar turno',
        className: 'btn btn-primary',
        onClick: async (_, close) => {
          try {
            await window.Api.turnos.changeStatus(id_turno, 'CONFIRMADO');
            window.AppUI.showToast('Turno confirmado correctamente.', 'ok');
            close();
            loadAgenda();
          } catch (err) {
            window.AppUI.showToast(err.message, 'bad');
          }
        }
      });
      actions.push({
        label: 'Cancelar turno',
        className: 'btn btn-danger',
        onClick: async (_, close) => {
          const ok = await window.AppUI.confirm({
            title: 'Cancelar turno',
            message: '¿Desea cancelar este turno médico?',
            isDanger: true
          });
          if (!ok) return;
          try {
            await window.Api.turnos.cancel(id_turno);
            window.AppUI.showToast('Turno cancelado.', 'ok');
            close();
            loadAgenda();
          } catch (err) {
            window.AppUI.showToast(err.message, 'bad');
          }
        }
      });
    } else if (t.estado === 'CONFIRMADO') {
      if (isDoctor && enFranja) {
        actions.push({
          label: 'Registrar llegada (En consultorio)',
          className: 'btn btn-primary',
          onClick: async (_, close) => {
            try {
              await window.Api.turnos.changeStatus(id_turno, 'EN_CONSULTORIO');
              window.AppUI.showToast('Llegada registrada.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        });
      }
      if (isRecepOrAdmin) {
        actions.push({
          label: 'Marcar Ausente',
          className: 'btn btn-light',
          onClick: async (_, close) => {
            try {
              await window.Api.turnos.changeStatus(id_turno, 'AUSENTE');
              window.AppUI.showToast('Turno marcado como Ausente.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        });
        actions.push({
          label: 'Cancelar turno',
          className: 'btn btn-danger',
          onClick: async (_, close) => {
            const ok = await window.AppUI.confirm({
              title: 'Cancelar turno',
              message: '¿Desea cancelar este turno médico?',
              isDanger: true
            });
            if (!ok) return;
            try {
              await window.Api.turnos.cancel(id_turno);
              window.AppUI.showToast('Turno cancelado.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        });
      }
    } else if (t.estado === 'EN_CONSULTORIO') {
      actions.push({
        label: 'Observaciones ✎',
        className: 'btn btn-light',
        onClick: (_, close) => {
          close();
          openObservacionesModalAgenda(id_turno, t.observaciones);
        }
      });
      if (isDoctor) {
        actions.push({
          label: 'Marcar Asistido',
          className: 'btn btn-primary',
          onClick: async (_, close) => {
            try {
              await window.Api.turnos.changeStatus(id_turno, 'ASISTIDO');
              window.AppUI.showToast('Turno finalizado como Asistido.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        });
      }
    }

    window.AppUI.modal({
      title: `Detalle del Turno`,
      size: 'md',
      content: contentHtml,
      actions
    });
  }

  /**
   * Modal auxiliar de observaciones desde la agenda.
   */
  function openObservacionesModalAgenda(id_turno, currentObs = '') {
    window.AppUI.modal({
      title: 'Observaciones Médicas',
      size: 'md',
      content: `
        <div class="field">
          <label for="agendaObsText">Observaciones de consulta:</label>
          <textarea id="agendaObsText" rows="5" maxlength="500">${window.AppHelpers.esc(currentObs || '')}</textarea>
        </div>
      `,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, c) => c() },
        {
          label: 'Guardar',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const val = document.getElementById('agendaObsText').value.trim();
            try {
              await window.Api.turnos.update(id_turno, { observaciones: val || null });
              window.AppUI.showToast('Observaciones guardadas.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        }
      ]
    });
  }

  /**
   * Alterna entre modo diario y mensual (DUDA-12a).
   */
  function setMode(mode) {
    currentMode = mode;
    if (mode === 'daily') {
      btnModeDaily.classList.add('active');
      btnModeMonthly.classList.remove('active');
      agendaDateLabel.textContent = 'Fecha de atención';
      agendaDateInput.type = 'date';
      agendaDateInput.value = window.AppHelpers.todayLocal();
    } else {
      btnModeMonthly.classList.add('active');
      btnModeDaily.classList.remove('active');
      agendaDateLabel.textContent = 'Mes de atención';
      agendaDateInput.type = 'month';
      agendaDateInput.value = window.AppHelpers.todayLocal().slice(0, 7);
    }
    loadAgenda();
  }

  /**
   * Inicializa la interfaz y filtros.
   */
  async function initEvents(usuario) {
    const isDoctor = usuario.rol === 'PROFESIONAL';

    if (isDoctor) {
      if (specialtyField) specialtyField.classList.add('hidden');
      if (doctorField) doctorField.classList.add('hidden');
    } else {
      // Cargar selectores de especialidad y médico
      try {
        const [espRes, docRes] = await Promise.all([
          window.Api.especialidades.list({ estado: 1 }),
          window.Api.profesionales.list({ estado: 1 })
        ]);

        const especialidades = espRes.data || [];
        cachedDoctors = docRes.data || [];

        agendaSpecialty.innerHTML = '<option value="">Todas las especialidades</option>' +
          especialidades.map((e) => `<option value="${e.id_especialidad}">${window.AppHelpers.esc(e.nombre)}</option>`).join('');

        populateDoctorSelect();

        agendaSpecialty.addEventListener('change', () => {
          populateDoctorSelect();
          loadAgenda();
        });

        agendaDoctor.addEventListener('change', () => loadAgenda());
      } catch (err) {
        console.error('Error cargando filtros de agenda:', err);
      }
    }

    btnModeDaily.addEventListener('click', () => setMode('daily'));
    btnModeMonthly.addEventListener('click', () => setMode('monthly'));
    agendaDateInput.addEventListener('change', () => loadAgenda());
    refreshBtn.addEventListener('click', () => loadAgenda());

    // Inicializar con fecha local de hoy
    agendaDateInput.value = window.AppHelpers.todayLocal();
  }

  function populateDoctorSelect() {
    const espId = Number(agendaSpecialty.value);
    const docs = espId
      ? cachedDoctors.filter((d) => d.id_especialidad === espId)
      : cachedDoctors;

    agendaDoctor.innerHTML = '<option value="">Todos los profesionales</option>' +
      docs.map((d) => `<option value="${d.id_profesional}">${window.AppHelpers.esc(d.apellido)}, ${window.AppHelpers.esc(d.nombre)}</option>`).join('');
  }

  window.AppSession.ready.then((usuario) => {
    initEvents(usuario);
    loadAgenda();
  });
})();
