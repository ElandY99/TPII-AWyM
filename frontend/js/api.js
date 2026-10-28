/* =============================================================
   js/api.js
   -------------------------------------------------------------
   Cliente HTTP centralizado para Salud Turnos.
   - Encapsula fetch con credenciales same-origin (cookies HttpOnly).
   - Limpieza automática de parámetros vacíos para esquemas Zod estrictos.
   - Manejo tipado de errores (ApiError con mapa de campos).
   - Redirección automática ante 401 en pantallas privadas.
   ============================================================= */

(function () {
  'use strict';

  /**
   * Error tipado devuelto por la API.
   */
  class ApiError extends Error {
    constructor(status, message, campos = {}) {
      super(message || 'Error en la solicitud');
      this.name = 'ApiError';
      this.status = status;
      this.campos = campos || {};
    }
  }

  /**
   * Serializa un objeto a query string omitiendo valores vacíos, nulos o indefinidos (FE-GEN-03).
   * @param {Object} params
   * @returns {string} Ejemplo: "?q=lopez&estado=1" o ""
   */
  function toQueryString(params) {
    if (!params || typeof params !== 'object') return '';
    const searchParams = new URLSearchParams();

    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    }

    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  }

  /**
   * Petición HTTP base.
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async function request(endpoint, options = {}) {
    const { method = 'GET', query, body, signal } = options;
    const url = `${endpoint}${toQueryString(query)}`;

    const headers = {
      Accept: 'application/json',
      ...(options.headers || {})
    };

    const fetchConfig = {
      method,
      headers,
      credentials: 'same-origin',
      signal
    };

    if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
      fetchConfig.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url, fetchConfig);
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err;
      }
      throw new ApiError(0, 'No se pudo conectar con el servidor. Verifique que esté en línea.');
    }

    // Intenta parsear JSON de respuesta
    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const status = response.status;
      const errorMsg = data?.error || (status === 404 ? 'Recurso no encontrado' : 'Error en la solicitud');
      const campos = data?.campos || {};

      // Manejo de sesión expirada (401)
      if (status === 401 && !endpoint.includes('/api/auth/login')) {
        const currentPath = window.location.pathname;
        if (!currentPath.endsWith('login.html') && !currentPath.endsWith('index.html')) {
          sessionStorage.setItem('saludturnos_motivo_logout', 'Su sesión ha finalizado o fue iniciada en otro dispositivo.');
          window.location.href = 'login.html';
        }
      }

      throw new ApiError(status, errorMsg, campos);
    }

    return data;
  }

  // Objeto público Api
  window.Api = {
    ApiError,
    toQueryString,
    request,

    // 1. Autenticación y Cuenta
    auth: {
      login: (credentials) => request('/api/auth/login', { method: 'POST', body: credentials }),
      logout: () => request('/api/auth/logout', { method: 'POST' }),
      me: () => request('/api/auth/me', { method: 'GET' }),
      changePassword: (data) => request('/api/auth/clave', { method: 'PUT', body: data })
    },

    // 2. Usuarios (Administrador)
    usuarios: {
      list: (filters, signal) => request('/api/usuarios', { method: 'GET', query: filters, signal }),
      getById: (id) => request(`/api/usuarios/${id}`, { method: 'GET' }),
      create: (data) => request('/api/usuarios', { method: 'POST', body: data }),
      update: (id, data) => request(`/api/usuarios/${id}`, { method: 'PUT', body: data }),
      deactivate: (id) => request(`/api/usuarios/${id}`, { method: 'DELETE' }),
      activate: (id) => request(`/api/usuarios/${id}/activar`, { method: 'PATCH' }),
      resetPassword: (id) => request(`/api/usuarios/${id}/clave`, { method: 'POST' })
    },

    // 3. Profesionales y Disponibilidad
    profesionales: {
      list: (filters, signal) => request('/api/profesionales', { method: 'GET', query: filters, signal }),
      getById: (id) => request(`/api/profesionales/${id}`, { method: 'GET' }),
      update: (id, data) => request(`/api/profesionales/${id}`, { method: 'PUT', body: data }),
      deactivate: (id) => request(`/api/profesionales/${id}`, { method: 'DELETE' }),
      activate: (id) => request(`/api/profesionales/${id}/activar`, { method: 'PATCH' }),
      getDisponibilidad: (id) => request(`/api/profesionales/${id}/disponibilidad`, { method: 'GET' }),
      updateDisponibilidad: (id, franjas) => request(`/api/profesionales/${id}/disponibilidad`, { method: 'PUT', body: { franjas } })
    },

    // 4. Especialidades
    especialidades: {
      list: (filters, signal) => request('/api/especialidades', { method: 'GET', query: filters, signal }),
      getById: (id) => request(`/api/especialidades/${id}`, { method: 'GET' }),
      create: (data) => request('/api/especialidades', { method: 'POST', body: data }),
      update: (id, data) => request(`/api/especialidades/${id}`, { method: 'PUT', body: data }),
      deactivate: (id) => request(`/api/especialidades/${id}`, { method: 'DELETE' }),
      activate: (id) => request(`/api/especialidades/${id}/activar`, { method: 'PATCH' })
    },

    // 5. Pacientes
    pacientes: {
      list: (filters, signal) => request('/api/pacientes', { method: 'GET', query: filters, signal }),
      getById: (id) => request(`/api/pacientes/${id}`, { method: 'GET' }),
      create: (data) => request('/api/pacientes', { method: 'POST', body: data }),
      update: (id, data) => request(`/api/pacientes/${id}`, { method: 'PUT', body: data }),
      deactivate: (id) => request(`/api/pacientes/${id}`, { method: 'DELETE' }),
      activate: (id) => request(`/api/pacientes/${id}/activar`, { method: 'PATCH' })
    },

    // 6. Turnos Médicos
    turnos: {
      getDisponibles: (query) => request('/api/turnos/disponibles', { method: 'GET', query }),
      list: (filters, signal) => request('/api/turnos', { method: 'GET', query: filters, signal }),
      getById: (id) => request(`/api/turnos/${id}`, { method: 'GET' }),
      create: (data) => request('/api/turnos', { method: 'POST', body: data }),
      update: (id, data) => request(`/api/turnos/${id}`, { method: 'PUT', body: data }),
      changeStatus: (id, estado) => request(`/api/turnos/${id}/estado`, { method: 'PATCH', body: { estado } }),
      cancel: (id) => request(`/api/turnos/${id}`, { method: 'DELETE' })
    },

    // 7. Agenda Médica
    agenda: {
      get: (query, signal) => request('/api/agenda', { method: 'GET', query, signal })
    },

    // 8. Dashboard
    dashboard: {
      get: () => request('/api/dashboard', { method: 'GET' })
    }
  };
})();
