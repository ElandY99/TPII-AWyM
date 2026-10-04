/* =============================================================
   common.js
   -------------------------------------------------------------
   Contiene lógica compartida por todas las pantallas privadas:
   - Verificar si existe una sesión iniciada.
   - Cerrar sesión.
   - Funciones auxiliares para mostrar nombres y estados.
   ============================================================= */

(function () {

  /* -----------------------------------------------------------
     CONTROL BÁSICO DE SESIÓN
     -----------------------------------------------------------
     Cuando el Login es correcto se guarda en sessionStorage una
     clave llamada saludturnos_user.

     sessionStorage se mantiene mientras la pestaña del navegador
     permanezca abierta.
  ----------------------------------------------------------- */
  const logged = sessionStorage.getItem('saludturnos_user');

  // Si no hay sesión, el usuario vuelve a la pantalla de Login.
  if (!logged) {
    window.location.href = 'login.html';
    return;
  }

  /* -----------------------------------------------------------
     CIERRE DE SESIÓN
     ----------------------------------------------------------- */
  const logoutBtn = document.getElementById('logoutBtn');

  // Se comprueba que el botón exista antes de agregar el evento.
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {

      // Se elimina la sesión actual.
      sessionStorage.removeItem('saludturnos_user');

      // Se redirige al Login.
      window.location.href = 'login.html';
    });
  }

  /* -----------------------------------------------------------
     FUNCIONES AUXILIARES COMPARTIDAS
     -----------------------------------------------------------
     Se agrupan dentro de AppHelpers para reutilizarlas desde
     dashboard.js, turnos.js y agenda.js.
  ----------------------------------------------------------- */
  window.AppHelpers = {

    // Devuelve el nombre completo de un paciente.
    patientName(patient) {
      if (!patient) {
        return 'Paciente no disponible';
      }

      return `${patient.nombre} ${patient.apellido}`;
    },

    // Devuelve el nombre de un profesional.
    doctorName(doctor) {
      if (!doctor) {
        return 'Profesional no disponible';
      }

      return doctor.name;
    },

    /*
      Devuelve un fragmento HTML para representar visualmente
      el estado de un turno mediante una etiqueta (badge).
    */
    statusBadge(status) {

      // Convierte, por ejemplo, "En Consultorio" en "en-consultorio".
      const cssClass = status.toLowerCase().replaceAll(' ', '-');

      return `<span class="badge ${cssClass}">${status}</span>`;
    }
  };

})();
