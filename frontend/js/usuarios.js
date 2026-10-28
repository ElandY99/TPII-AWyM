/* =============================================================
   js/usuarios.js
   -------------------------------------------------------------
   Lógica de Administración de Usuarios (Exclusiva de ADMINISTRADOR):
   - Filtros combinados por nombre/apellido, correo, rol y estado.
   - Alta atómica de usuario RECEPCIONISTA o PROFESIONAL (con especialidad,
     matrícula, consultorio y franjas de disponibilidad - FE-USR-03).
   - Modal de Clave Generada accesible con botón copiar (FE-USR-04).
   - Edición de datos básicos y reseteo de contraseñas.
   - Desactivación y reactivación con restricciones de seguridad.
   ============================================================= */

(function () {
  'use strict';

  let currentAbortController = null;
  let activeEstado = '1';
  let cachedEspecialidades = [];
  let profesionalesMapByUsuario = {}; // id_usuario -> profesional

  const tableBody = document.getElementById('usersTable');
  const searchInput = document.getElementById('userSearch');
  const emailSearchInput = document.getElementById('userEmailSearch');
  const roleSelect = document.getElementById('userRoleFilter');
  const newUserBtn = document.getElementById('newUserBtn');

  /**
   * Carga el listado de usuarios y cruza con profesionales para conocer vínculos.
   */
  async function loadUsers() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const search = searchInput.value.trim();
    const emailSearch = emailSearchInput.value.trim();
    const rol = roleSelect.value;

    const query = {
      nombre: search || undefined,
      correo: emailSearch || undefined,
      rol: rol || undefined,
      estado: activeEstado !== 'todos' ? activeEstado : 'todos'
    };

    tableBody.innerHTML = '<tr><td colspan="7" class="empty-row">Cargando usuarios...</td></tr>';

    try {
      const [usersRes, profRes] = await Promise.all([
        window.Api.usuarios.list(query, currentAbortController.signal),
        window.Api.profesionales.list({ estado: 'todos' })
      ]);

      // Construir mapa de profesionales por id_usuario
      profesionalesMapByUsuario = {};
      (profRes.data || []).forEach((p) => {
        if (p.id_usuario) {
          profesionalesMapByUsuario[p.id_usuario] = p;
        }
      });

      renderTable(usersRes.data || []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar usuarios:', err);
      tableBody.innerHTML = `<tr><td colspan="7" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar usuarios')}</td></tr>`;
    }
  }

  /**
   * Renderiza la tabla de usuarios.
   */
  function renderTable(usuarios) {
    if (!usuarios || usuarios.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="empty-row">No se encontraron usuarios.</td></tr>';
      return;
    }

    const currentAdminId = window.AppSession.getUser()?.id;
    const fragment = document.createDocumentFragment();

    usuarios.forEach((u) => {
      const tr = document.createElement('tr');
      const isOtherAdmin = u.rol === 'ADMINISTRADOR' && u.id_usuario !== currentAdminId;
      const isSelf = u.id_usuario === currentAdminId;
      const linkedDoctor = profesionalesMapByUsuario[u.id_usuario];

      let rolBadge = '';
      if (u.rol === 'ADMINISTRADOR') {
        rolBadge = '<span class="badge" style="background: #e8eaf6; color: #283593;">Admin</span>';
      } else if (u.rol === 'RECEPCIONISTA') {
        rolBadge = '<span class="badge" style="background: #e0f2f1; color: #00695c;">Recepción</span>';
      } else {
        const docExtra = linkedDoctor ? ` (${window.AppHelpers.esc(linkedDoctor.especialidad_nombre || '')})` : '';
        rolBadge = `<span class="badge" style="background: #ede7f6; color: #4527a0;">Médico${docExtra}</span>`;
      }

      tr.innerHTML = `
        <td>#${u.id_usuario}</td>
        <td><strong>${window.AppHelpers.esc(u.nombre)} ${window.AppHelpers.esc(u.apellido)}</strong></td>
        <td>${window.AppHelpers.esc(u.correo)}</td>
        <td>${rolBadge}</td>
        <td>${window.AppHelpers.activeBadge(u.estado)}</td>
        <td style="font-size: 0.84rem; color: var(--muted);">${window.AppHelpers.formatDateTime(u.fecha_creacion)}</td>
        <td class="actions-cell"></td>
      `;

      const actionsCell = tr.querySelector('.actions-cell');

      // Botón Editar datos básicos
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-light btn-xs';
      editBtn.textContent = 'Editar';
      if (isOtherAdmin) {
        editBtn.disabled = true;
        editBtn.title = 'No es posible modificar a otros administradores';
      } else {
        editBtn.addEventListener('click', () => openEditUserModal(u));
      }
      actionsCell.appendChild(editBtn);

      // Botón Resetear Clave
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'btn btn-light btn-xs';
      resetBtn.textContent = 'Clave';
      resetBtn.title = 'Restablecer contraseña';
      if (isOtherAdmin) {
        resetBtn.disabled = true;
      } else {
        resetBtn.addEventListener('click', () => handleResetPassword(u));
      }
      actionsCell.appendChild(resetBtn);

      // Desactivar / Reactivar
      if (u.estado === 1) {
        const deactBtn = document.createElement('button');
        deactBtn.type = 'button';
        deactBtn.className = 'btn btn-danger btn-xs';
        deactBtn.textContent = 'Baja';
        deactBtn.title = 'Desactivar usuario';

        if (isSelf) {
          deactBtn.disabled = true;
          deactBtn.title = 'No puede desactivar su propia cuenta';
        } else if (isOtherAdmin) {
          deactBtn.disabled = true;
          deactBtn.title = 'No es posible desactivar a otros administradores';
        } else {
          deactBtn.addEventListener('click', () => handleDeactivateUser(u));
        }
        actionsCell.appendChild(deactBtn);
      } else {
        const actBtn = document.createElement('button');
        actBtn.type = 'button';
        actBtn.className = 'btn btn-light btn-xs';
        actBtn.style.color = 'var(--success)';
        actBtn.textContent = 'Activar';

        // FE-USR-09: Si es médico vinculado, guiar a Profesionales
        if (u.rol === 'PROFESIONAL' && linkedDoctor && linkedDoctor.estado === 0) {
          actBtn.title = 'Los médicos deben ser reactivados desde la pantalla Profesionales';
          actBtn.addEventListener('click', () => {
            window.AppUI.showToast(
              'Para reactivar este usuario médico, reactívelo desde la pantalla Profesionales.',
              'info'
            );
            setTimeout(() => {
              window.location.href = 'profesionales.html';
            }, 1000);
          });
        } else {
          actBtn.addEventListener('click', () => handleActivateUser(u));
        }
        actionsCell.appendChild(actBtn);
      }

      fragment.appendChild(tr);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
  }

  /**
   * Modal de Clave Generada (FE-USR-04 / A7).
   */
  function showGeneratedPasswordModal(clave, correo) {
    const contentHtml = `
      <p style="margin-top: 0;">Se ha generado una nueva contraseña segura para <strong>${window.AppHelpers.esc(correo)}</strong>:</p>
      <div class="password-box">
        <span class="password-code" id="modalPasswordCode">${window.AppHelpers.esc(clave)}</span>
        <button type="button" class="btn btn-secondary btn-xs" id="copyPasswordBtn">Copiar</button>
      </div>
      <p style="color: var(--danger); font-size: 0.88rem; font-weight: 600; margin-bottom: 0;">
        ⚠️ Esta contraseña se muestra una sola vez. Asegúrese de copiarla y entregarla al usuario.
      </p>
    `;

    const modal = window.AppUI.modal({
      title: 'Contraseña generada',
      size: 'sm',
      content: contentHtml,
      actions: [
        {
          label: 'Entendido y cerrada',
          className: 'btn btn-primary',
          onClick: (_, close) => close()
        }
      ]
    });

    const copyBtn = modal.dialog.querySelector('#copyPasswordBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(clave);
          copyBtn.textContent = '¡Copiado!';
          window.AppUI.showToast('Contraseña copiada al portapapeles.', 'ok');
          setTimeout(() => {
            copyBtn.textContent = 'Copiar';
          }, 2000);
        } catch {
          window.AppUI.showToast('No se pudo copiar automáticamente. Selecciónela y cópiela manualmente.', 'info');
        }
      });
    }
  }

  /**
   * Modal de Alta Atómica de Usuario (FE-USR-03).
   */
  async function openCreateUserModal() {
    // Asegurar especialidades en caché para el select
    if (cachedEspecialidades.length === 0) {
      try {
        const res = await window.Api.especialidades.list({ estado: 1 });
        cachedEspecialidades = res.data || [];
      } catch (err) {
        console.error('Error al cargar especialidades:', err);
      }
    }

    const especialidadesOptions = cachedEspecialidades
      .map((e) => `<option value="${e.id_especialidad}">${window.AppHelpers.esc(e.nombre)}</option>`)
      .join('');

    const formHtml = `
      <form id="modalCreateUserForm" novalidate>
        <div class="grid-form" style="gap: 12px; margin-bottom: 12px;">
          <div class="field">
            <label for="cuNombre">Nombre *</label>
            <input id="cuNombre" name="nombre" maxlength="50" required>
            <small class="error" id="cuNombreError"></small>
          </div>
          <div class="field">
            <label for="cuApellido">Apellido *</label>
            <input id="cuApellido" name="apellido" maxlength="50" required>
            <small class="error" id="cuApellidoError"></small>
          </div>
          <div class="field">
            <label for="cuCorreo">Correo electrónico *</label>
            <input id="cuCorreo" name="correo" type="email" maxlength="100" placeholder="usuario@saludturnos.com" required>
            <small class="error" id="cuCorreoError"></small>
          </div>
          <div class="field">
            <label for="cuRol">Rol del usuario *</label>
            <select id="cuRol" name="rol" required>
              <option value="RECEPCIONISTA">Recepcionista</option>
              <option value="PROFESIONAL">Profesional Médico</option>
            </select>
            <small class="error" id="cuRolError"></small>
          </div>
        </div>

        <!-- Sección Profesional (Visible solo si rol === PROFESIONAL) -->
        <div id="cuDoctorSection" class="hidden" style="margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line);">
          <h4 style="margin: 0 0 10px; color: var(--navy-dark);">Datos Médicos y Consultorio</h4>
          <div class="grid-form" style="gap: 12px; margin-bottom: 14px;">
            <div class="field">
              <label for="cuEspecialidad">Especialidad médica *</label>
              <select id="cuEspecialidad" name="id_especialidad">
                ${especialidadesOptions || '<option value="">Sin especialidades activas</option>'}
              </select>
              <small class="error" id="cuEspecialidadError"></small>
            </div>
            <div class="field">
              <label for="cuMatricula">Matrícula profesional * (5 dígitos)</label>
              <input id="cuMatricula" name="matricula" maxlength="5" placeholder="Ej: 10005">
              <small class="error" id="cuMatriculaError"></small>
            </div>
            <div class="field span-2">
              <label for="cuConsultorio">Consultorio asignado *</label>
              <input id="cuConsultorio" name="consultorio" maxlength="20" placeholder="Ej: 104 o Consultorio 104">
              <small class="error" id="cuConsultorioError"></small>
            </div>
          </div>

          <h4 style="margin: 0 0 4px; color: var(--navy-dark);">Disponibilidad Horaria Inicial</h4>
          <p class="muted" style="font-size: 0.84rem; margin: 0 0 8px;">Debe configurar al menos una franja horaria de atención semanal.</p>
          
          <div id="cuFranjasList" class="franjas-list"></div>
          <button type="button" class="btn btn-light btn-xs" id="cuAddFranjaBtn" style="margin-top: 8px;">+ Agregar franja</button>
          <small class="error" id="cuDisponibilidadError" style="display: block; margin-top: 4px;"></small>
        </div>
      </form>
    `;

    const modal = window.AppUI.modal({
      title: 'Alta de usuario',
      size: 'lg',
      content: formHtml,
      actions: [
        {
          label: 'Cancelar',
          className: 'btn btn-light',
          onClick: (_, close) => close()
        },
        {
          label: 'Crear usuario',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            await handleCreateUserSubmit(e, close);
          }
        }
      ]
    });

    // Control de visibilidad de sección profesional
    const rolSelect = modal.dialog.querySelector('#cuRol');
    const doctorSec = modal.dialog.querySelector('#cuDoctorSection');
    const franjasList = modal.dialog.querySelector('#cuFranjasList');
    const addFranjaBtn = modal.dialog.querySelector('#cuAddFranjaBtn');

    function toggleDoctorSection() {
      if (rolSelect.value === 'PROFESIONAL') {
        doctorSec.classList.remove('hidden');
        if (franjasList.children.length === 0) {
          addFranjaRow(franjasList, 'LUNES', '08:00', '12:00');
        }
      } else {
        doctorSec.classList.add('hidden');
      }
    }

    rolSelect.addEventListener('change', toggleDoctorSection);
    addFranjaBtn.addEventListener('click', () => addFranjaRow(franjasList, 'LUNES', '08:00', '12:00'));
  }

  /**
   * Helper para agregar una fila de franja horaria en el modal.
   */
  function addFranjaRow(container, defaultDia = 'LUNES', defaultInicio = '08:00', defaultFin = '12:00') {
    const row = document.createElement('div');
    row.className = 'franja-row';

    const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    const diasOptions = dias
      .map((d) => `<option value="${d}" ${d === defaultDia ? 'selected' : ''}>${d}</option>`)
      .join('');

    // Generar opciones de media hora
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

    row.querySelector('.franja-remove-btn').addEventListener('click', () => {
      row.remove();
    });

    container.appendChild(row);
  }

  /**
   * Envío del formulario de alta atómica de usuario.
   */
  async function handleCreateUserSubmit(e, closeModal) {
    const formEl = document.getElementById('modalCreateUserForm');
    const submitBtn = e.target;

    const nombre = document.getElementById('cuNombre').value.trim();
    const apellido = document.getElementById('cuApellido').value.trim();
    const correo = document.getElementById('cuCorreo').value.trim();
    const rol = document.getElementById('cuRol').value;

    const campos = {};
    if (!nombre || nombre.length < 2) campos.cuNombre = 'Mínimo 2 caracteres.';
    if (!apellido || apellido.length < 2) campos.cuApellido = 'Mínimo 2 caracteres.';
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) campos.cuCorreo = 'Formato de correo inválido.';

    let profesionalData = undefined;
    let disponibilidadData = undefined;

    if (rol === 'PROFESIONAL') {
      const idEsp = Number(document.getElementById('cuEspecialidad').value);
      const matricula = document.getElementById('cuMatricula').value.trim();
      const consultorio = document.getElementById('cuConsultorio').value.trim();

      if (!idEsp) campos.cuEspecialidad = 'Debe seleccionar una especialidad.';
      if (!/^\d{5}$/.test(matricula)) campos.cuMatricula = 'La matrícula debe tener exactamente 5 dígitos numéricos.';
      if (!consultorio) campos.cuConsultorio = 'El consultorio es requerido.';

      // Extraer franjas horarias
      const franjas = [];
      const rows = formEl.querySelectorAll('.franja-row');
      rows.forEach((r) => {
        const dia = r.querySelector('.franja-dia').value;
        const inicio = r.querySelector('.franja-inicio').value;
        const fin = r.querySelector('.franja-fin').value;
        franjas.push({ dia_semana: dia, hora_inicio: inicio, hora_fin: fin });
      });

      if (franjas.length === 0) {
        campos.cuDisponibilidad = 'Debe configurar al menos una franja horaria.';
      } else {
        // Validar que inicio < fin y no se solapen
        for (const f of franjas) {
          if (f.hora_inicio >= f.hora_fin) {
            campos.cuDisponibilidad = `En ${f.dia_semana}, la hora de fin debe ser posterior a la de inicio.`;
            break;
          }
        }
      }

      profesionalData = {
        id_especialidad: idEsp,
        matricula,
        consultorio
      };
      disponibilidadData = franjas;
    }

    // Render errores cliente
    formEl.querySelectorAll('.error').forEach((el) => (el.textContent = ''));
    formEl.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

    if (Object.keys(campos).length > 0) {
      for (const [id, msg] of Object.entries(campos)) {
        const errEl = formEl.querySelector(`#${id}Error`);
        if (errEl) errEl.textContent = msg;
        const inputEl = formEl.querySelector(`#${id}`);
        if (inputEl) inputEl.classList.add('input-error');
      }
      return;
    }

    const payload = {
      nombre,
      apellido,
      correo: correo.toLowerCase(),
      rol,
      ...(profesionalData ? { profesional: profesionalData } : {}),
      ...(disponibilidadData ? { disponibilidad: disponibilidadData } : {})
    };

    window.AppUI.setLoading(submitBtn, true, 'Creando...');

    try {
      const res = await window.Api.usuarios.create(payload);
      closeModal();
      window.AppUI.showToast('Usuario creado exitosamente.', 'ok');

      // Mostrar modal de clave generada (FE-USR-04)
      if (res.clave_generada) {
        showGeneratedPasswordModal(res.clave_generada, correo);
      }

      loadUsers();
    } catch (err) {
      if (err.status === 400 || err.status === 409) {
        // Mapear campos anidados como profesional.matricula o campos planos
        const mappedErrors = {};
        for (const [k, v] of Object.entries(err.campos || {})) {
          if (k === 'correo') mappedErrors.cuCorreo = v;
          else if (k === 'nombre') mappedErrors.cuNombre = v;
          else if (k === 'apellido') mappedErrors.cuApellido = v;
          else if (k === 'profesional.matricula' || k === 'matricula') mappedErrors.cuMatricula = v;
          else if (k === 'profesional.consultorio' || k === 'consultorio') mappedErrors.cuConsultorio = v;
          else if (k === 'profesional.id_especialidad' || k === 'id_especialidad') mappedErrors.cuEspecialidad = v;
          else if (k === 'disponibilidad') mappedErrors.cuDisponibilidad = v;
        }

        if (Object.keys(mappedErrors).length > 0) {
          for (const [id, msg] of Object.entries(mappedErrors)) {
            const errEl = formEl.querySelector(`#${id}Error`);
            if (errEl) errEl.textContent = msg;
          }
        }
        window.AppUI.showToast(err.message || 'Revise los campos del formulario.', 'bad');
      } else {
        window.AppUI.showToast(err.message || 'Error al crear el usuario.', 'bad');
      }
    } finally {
      window.AppUI.setLoading(submitBtn, false);
    }
  }

  /**
   * Modal de Edición de Usuario (FE-USR-05).
   */
  function openEditUserModal(u) {
    const formHtml = `
      <form id="modalEditUserForm" novalidate>
        <div class="field" style="margin-bottom: 12px;">
          <label for="euNombre">Nombre *</label>
          <input id="euNombre" name="nombre" value="${window.AppHelpers.esc(u.nombre)}" maxlength="50" required>
          <small class="error" id="euNombreError"></small>
        </div>
        <div class="field" style="margin-bottom: 12px;">
          <label for="euApellido">Apellido *</label>
          <input id="euApellido" name="apellido" value="${window.AppHelpers.esc(u.apellido)}" maxlength="50" required>
          <small class="error" id="euApellidoError"></small>
        </div>
        <div class="field" style="margin-bottom: 12px;">
          <label for="euCorreo">Correo electrónico *</label>
          <input id="euCorreo" name="correo" type="email" value="${window.AppHelpers.esc(u.correo)}" maxlength="100" required>
          <small class="error" id="euCorreoError"></small>
        </div>
        <p class="muted" style="font-size: 0.84rem; margin: 0;">
          El rol del usuario (${u.rol}) no puede ser modificado.
        </p>
      </form>
    `;

    const modal = window.AppUI.modal({
      title: `Editar Usuario #${u.id_usuario}`,
      size: 'md',
      content: formHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, close) => close() },
        {
          label: 'Guardar cambios',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const nombre = document.getElementById('euNombre').value.trim();
            const apellido = document.getElementById('euApellido').value.trim();
            const correo = document.getElementById('euCorreo').value.trim();

            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Guardando...');

            try {
              await window.Api.usuarios.update(u.id_usuario, { nombre, apellido, correo: correo.toLowerCase() });
              window.AppUI.showToast('Usuario actualizado correctamente.', 'ok');
              close();
              loadUsers();
            } catch (err) {
              if (err.campos?.correo) {
                document.getElementById('euCorreoError').textContent = err.campos.correo;
              }
              window.AppUI.showToast(err.message || 'Error al actualizar usuario.', 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });
  }

  /**
   * Restablecimiento de contraseña de usuario (FE-USR-07).
   */
  async function handleResetPassword(u) {
    const ok = await window.AppUI.confirm({
      title: 'Restablecer contraseña',
      message: `Se generará una nueva contraseña para ${u.nombre} ${u.apellido} (${u.correo}) y se cerrarán sus sesiones activas. ¿Desea continuar?`,
      confirmText: 'Restablecer clave'
    });

    if (!ok) return;

    try {
      const res = await window.Api.usuarios.resetPassword(u.id_usuario);
      window.AppUI.showToast('Contraseña restablecida con éxito.', 'ok');
      showGeneratedPasswordModal(res.clave_generada, u.correo);
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo restablecer la contraseña.', 'bad');
    }
  }

  /**
   * Desactivar usuario.
   */
  async function handleDeactivateUser(u) {
    const ok = await window.AppUI.confirm({
      title: 'Desactivar usuario',
      message: `¿Está seguro de desactivar al usuario ${u.nombre} ${u.apellido}? Sus sesiones activas se cerrarán.`,
      confirmText: 'Desactivar',
      isDanger: true
    });

    if (!ok) return;

    try {
      await window.Api.usuarios.deactivate(u.id_usuario);
      window.AppUI.showToast('Usuario desactivado correctamente.', 'ok');
      loadUsers();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo desactivar al usuario.', 'bad');
    }
  }

  /**
   * Reactivar usuario.
   */
  async function handleActivateUser(u) {
    const ok = await window.AppUI.confirm({
      title: 'Reactivar usuario',
      message: `¿Desea reactivar al usuario ${u.nombre} ${u.apellido}?`,
      confirmText: 'Reactivar'
    });

    if (!ok) return;

    try {
      await window.Api.usuarios.activate(u.id_usuario);
      window.AppUI.showToast('Usuario reactivado correctamente.', 'ok');
      loadUsers();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo reactivar al usuario.', 'bad');
    }
  }

  /**
   * Inicialización de eventos y listeners.
   */
  function initEvents() {
    newUserBtn.addEventListener('click', openCreateUserModal);

    const debouncedSearch = window.AppHelpers.debounce(() => loadUsers(), 300);
    searchInput.addEventListener('input', debouncedSearch);
    emailSearchInput.addEventListener('input', debouncedSearch);
    roleSelect.addEventListener('change', () => loadUsers());

    document.querySelectorAll('.pill-group .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-group .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeEstado = btn.dataset.estado;
        loadUsers();
      });
    });
  }

  window.AppSession.ready.then(() => {
    initEvents();
    loadUsers();
  });
})();
