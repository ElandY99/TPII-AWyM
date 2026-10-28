/* =============================================================
   js/dashboard.js
   -------------------------------------------------------------
   Lógica del Panel Principal conectada a la API:
   - Consulta de indicadores en ventana móvil de 30 días (/api/dashboard).
   - Renderizado de métricas destacadas y secundarias por estado (DUDA-11).
   - Tabla de próximos 5 turnos cronológicos no cancelados con consultorio.
   - Adaptación de vista y textos según el rol del usuario (FE-DAS-05).
   ============================================================= */

(function () {
  'use strict';

  const totalEl = document.getElementById('totalTurnos');
  const confirmadosEl = document.getElementById('confirmados');
  const canceladosEl = document.getElementById('cancelados');

  const pendientesEl = document.getElementById('pendientes');
  const enConsultorioEl = document.getElementById('enConsultorio');
  const asistidosEl = document.getElementById('asistidos');
  const ausentesEl = document.getElementById('ausentes');

  const windowNoticeEl = document.getElementById('dashboardWindowNotice');
  const dashSubtitle = document.getElementById('dashSubtitle');
  const newTurnBtn = document.getElementById('newTurnBtnDashboard');
  const dashboardTable = document.getElementById('dashboardTurnos');

  /**
   * Carga métricas y próximos turnos desde /api/dashboard.
   */
  async function loadDashboardData() {
    try {
      const res = await window.Api.dashboard.get();
      const data = res.data;

      // 1. Período de la ventana (FE-DAS-02)
      if (data.ventana) {
        const desdeStr = window.AppHelpers.formatDate(data.ventana.desde);
        const hastaStr = window.AppHelpers.formatDate(data.ventana.hasta);
        windowNoticeEl.textContent = `Turnos registrados entre el ${desdeStr} y el ${hastaStr} (próximos 30 días)`;
      }

      // 2. Indicadores principales y secundarios (DUDA-11)
      const ind = data.indicadores || {};
      totalEl.textContent = ind.total || 0;
      confirmadosEl.textContent = ind.confirmados || 0;
      canceladosEl.textContent = ind.cancelados || 0;

      const porEstado = ind.por_estado || {};
      pendientesEl.textContent = porEstado.PENDIENTE || 0;
      enConsultorioEl.textContent = porEstado.EN_CONSULTORIO || 0;
      asistidosEl.textContent = porEstado.ASISTIDO || 0;
      ausentesEl.textContent = porEstado.AUSENTE || 0;

      // 3. Tabla de próximos turnos (máx 5)
      renderProximos(data.proximos || []);
    } catch (err) {
      console.error('Error al cargar métricas de dashboard:', err);
      dashboardTable.innerHTML = `<tr><td colspan="6" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar métricas del panel')}</td></tr>`;
    }
  }

  /**
   * Renderiza las filas de los próximos turnos a atender.
   */
  function renderProximos(proximos) {
    if (!proximos || proximos.length === 0) {
      dashboardTable.innerHTML = '<tr><td colspan="6" class="empty-row">No hay turnos programados en los próximos días.</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    proximos.forEach((t) => {
      const tr = document.createElement('tr');

      const pacienteNombre = `${window.AppHelpers.esc(t.paciente_apellido)}, ${window.AppHelpers.esc(t.paciente_nombre)}`;
      const pacienteInfo = `${pacienteNombre} <br><small class="muted">DNI ${window.AppHelpers.esc(t.paciente_dni)}</small>`;
      const profesionalNombre = `${window.AppHelpers.esc(t.profesional_nombre)} ${window.AppHelpers.esc(t.profesional_apellido)}`;
      const consultorioLabel = t.consultorio ? window.AppHelpers.esc(t.consultorio) : '-';

      tr.innerHTML = `
        <td><strong>${window.AppHelpers.formatDate(t.fecha)}</strong></td>
        <td><code>${window.AppHelpers.esc(t.hora)}</code></td>
        <td>${pacienteInfo}</td>
        <td>${profesionalNombre}</td>
        <td>${consultorioLabel}</td>
        <td>${window.AppHelpers.statusBadge(t.estado)}</td>
      `;

      fragment.appendChild(tr);
    });

    dashboardTable.innerHTML = '';
    dashboardTable.appendChild(fragment);
  }

  /**
   * Adapta la presentación según el rol del usuario (FE-DAS-04, FE-DAS-05).
   */
  function initRoleView(usuario) {
    if (usuario.rol === 'PROFESIONAL') {
      dashSubtitle.textContent = 'Métricas y próximos turnos bajo su atención médica directa.';
      if (newTurnBtn) {
        newTurnBtn.classList.add('hidden');
      }
    }
  }

  // Inicialización tras resolver la sesión
  window.AppSession.ready.then((usuario) => {
    initRoleView(usuario);
    loadDashboardData();

    // Refresco al recuperar foco en la pestaña
    window.addEventListener('focus', () => loadDashboardData());
  });
})();
