/* =============================================================
   js/especialidades.js
   -------------------------------------------------------------
   Lógica de Gestión de Especialidades conectada a la API:
   - Visualización para ADMINISTRADOR y RECEPCIONISTA (solo lectura).
   - Filtro por nombre con debounce y por estado con pills.
   - Modal de Alta y Edición para ADMINISTRADOR.
   - Desactivación y Reactivación protegida (ADMINISTRADOR).
   ============================================================= */

(function () {
  'use strict';

  let currentAbortController = null;
  let activeEstado = '1'; // Default: Activas

  const tableBody = document.getElementById('specialtiesTable');
  const searchInput = document.getElementById('specialtySearch');
  const newBtn = document.getElementById('newSpecialtyBtn');
  const actionsHeader = document.getElementById('actionsHeader');

  /**
   * Carga el listado de especialidades desde la API.
   */
  async function loadSpecialties() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const nombre = searchInput.value.trim();
    const query = {
      nombre: nombre || undefined,
      estado: activeEstado !== 'todos' ? activeEstado : 'todos'
    };

    const isAdmin = window.AppSession.isAdmin();
    const colCount = isAdmin ? 5 : 4;

    tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row">Cargando especialidades...</td></tr>`;

    try {
      const res = await window.Api.especialidades.list(query, currentAbortController.signal);
      renderTable(res.data || []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar especialidades:', err);
      tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar especialidades')}</td></tr>`;
    }
  }

  /**
   * Renderiza la tabla de especialidades.
   */
  function renderTable(especialidades) {
    const isAdmin = window.AppSession.isAdmin();
    const colCount = isAdmin ? 5 : 4;

    if (!especialidades || especialidades.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row">No se encontraron especialidades.</td></tr>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    especialidades.forEach((esp) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>#${esp.id_especialidad}</td>
        <td><strong>${window.AppHelpers.esc(esp.nombre)}</strong></td>
        <td>${window.AppHelpers.esc(esp.descripcion || '-')}</td>
        <td>${window.AppHelpers.activeBadge(esp.estado)}</td>
        ${isAdmin ? '<td class="actions-cell"></td>' : ''}
      `;

      if (isAdmin) {
        const actionsCell = tr.querySelector('.actions-cell');

        // Botón Editar
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-light btn-xs';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openModalForm(esp));
        actionsCell.appendChild(editBtn);

        // Desactivar / Reactivar
        if (esp.estado === 1) {
          const deactBtn = document.createElement('button');
          deactBtn.type = 'button';
          deactBtn.className = 'btn btn-danger btn-xs';
          deactBtn.textContent = 'Desactivar';
          deactBtn.addEventListener('click', () => handleDeactivate(esp));
          actionsCell.appendChild(deactBtn);
        } else {
          const actBtn = document.createElement('button');
          actBtn.type = 'button';
          actBtn.className = 'btn btn-light btn-xs';
          actBtn.style.color = 'var(--success)';
          actBtn.textContent = 'Reactivar';
          actBtn.addEventListener('click', () => handleActivate(esp));
          actionsCell.appendChild(actBtn);
        }
      }

      fragment.appendChild(tr);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
  }

  /**
   * Abre el modal para crear o editar una especialidad.
   */
  function openModalForm(esp = null) {
    const isEdit = Boolean(esp);
    const title = isEdit ? `Editar Especialidad: ${esp.nombre}` : 'Nueva Especialidad';

    const formHtml = `
      <form id="modalSpecialtyForm" novalidate>
        <div class="field" style="margin-bottom: 14px;">
          <label for="modalEspNombre">Nombre * (3 a 80 caracteres)</label>
          <input id="modalEspNombre" name="nombre" value="${isEdit ? window.AppHelpers.esc(esp.nombre) : ''}" maxlength="80" required>
          <small class="error" id="modalEspNombreError"></small>
        </div>
        <div class="field">
          <label for="modalEspDesc">Descripción (opcional, hasta 255 caracteres)</label>
          <textarea id="modalEspDesc" name="descripcion" rows="3" maxlength="255">${isEdit ? window.AppHelpers.esc(esp.descripcion || '') : ''}</textarea>
          <small class="error" id="modalEspDescError"></small>
        </div>
      </form>
    `;

    const modal = window.AppUI.modal({
      title,
      size: 'md',
      content: formHtml,
      actions: [
        {
          label: 'Cancelar',
          className: 'btn btn-light',
          onClick: (_, close) => close()
        },
        {
          label: isEdit ? 'Guardar cambios' : 'Crear especialidad',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const modalForm = document.getElementById('modalSpecialtyForm');
            const nombreInput = document.getElementById('modalEspNombre');
            const descInput = document.getElementById('modalEspDesc');
            const nombre = nombreInput.value.trim();
            const descripcion = descInput.value.trim() || null;

            // Validación cliente
            const nombreError = document.getElementById('modalEspNombreError');
            nombreError.textContent = '';
            nombreInput.classList.remove('input-error');

            if (!nombre || nombre.length < 3 || nombre.length > 80) {
              nombreError.textContent = 'El nombre debe tener entre 3 y 80 caracteres.';
              nombreInput.classList.add('input-error');
              return;
            }

            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Guardando...');

            try {
              if (isEdit) {
                await window.Api.especialidades.update(esp.id_especialidad, { nombre, descripcion });
                window.AppUI.showToast('Especialidad actualizada correctamente.', 'ok');
              } else {
                await window.Api.especialidades.create({ nombre, descripcion });
                window.AppUI.showToast('Especialidad creada correctamente.', 'ok');
              }
              close();
              loadSpecialties();
            } catch (err) {
              if (err.status === 400 || err.status === 409) {
                if (err.campos?.nombre) {
                  nombreError.textContent = err.campos.nombre;
                  nombreInput.classList.add('input-error');
                } else {
                  window.AppUI.showToast(err.message, 'bad');
                }
              } else {
                window.AppUI.showToast(err.message || 'Error al guardar la especialidad.', 'bad');
              }
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });
  }

  /**
   * Desactivar especialidad.
   */
  async function handleDeactivate(esp) {
    const ok = await window.AppUI.confirm({
      title: 'Desactivar especialidad',
      message: `¿Está seguro de desactivar la especialidad "${esp.nombre}"?`,
      confirmText: 'Desactivar',
      isDanger: true
    });

    if (!ok) return;

    try {
      await window.Api.especialidades.deactivate(esp.id_especialidad);
      window.AppUI.showToast('Especialidad desactivada correctamente.', 'ok');
      loadSpecialties();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo desactivar la especialidad.', 'bad');
    }
  }

  /**
   * Reactivar especialidad.
   */
  async function handleActivate(esp) {
    const ok = await window.AppUI.confirm({
      title: 'Reactivar especialidad',
      message: `¿Desea reactivar la especialidad "${esp.nombre}"?`,
      confirmText: 'Reactivar'
    });

    if (!ok) return;

    try {
      await window.Api.especialidades.activate(esp.id_especialidad);
      window.AppUI.showToast('Especialidad reactivada correctamente.', 'ok');
      loadSpecialties();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo reactivar la especialidad.', 'bad');
    }
  }

  /**
   * Configura eventos y adapta UI según el rol.
   */
  function initEvents(usuario) {
    const isAdmin = usuario.rol === 'ADMINISTRADOR';

    if (!isAdmin) {
      if (newBtn) newBtn.classList.add('hidden');
      if (actionsHeader) actionsHeader.classList.add('hidden');
    } else {
      if (newBtn) {
        newBtn.addEventListener('click', () => openModalForm(null));
      }
    }

    searchInput.addEventListener(
      'input',
      window.AppHelpers.debounce(() => loadSpecialties(), 300)
    );

    document.querySelectorAll('.pill-group .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-group .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeEstado = btn.dataset.estado;
        loadSpecialties();
      });
    });
  }

  window.AppSession.ready.then((usuario) => {
    initEvents(usuario);
    loadSpecialties();
  });
})();
