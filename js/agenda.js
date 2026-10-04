/* =============================================================
   agenda.js
   -------------------------------------------------------------
   Muestra la disponibilidad de un profesional para una fecha.

   Cada horario puede quedar representado como:
   - LIBRE: no existe un turno activo en ese horario.
   - OCUPADO: existe un turno Pendiente o Confirmado.
   ============================================================= */

// Se cargan los datos que necesita la pantalla.
const doctors = AppData.read('doctors');
const patients = AppData.read('patients');
const hours = AppData.read('hours');

// Referencias a los elementos HTML.
const dateInput = document.getElementById('agendaDate');
const doctorSelect = document.getElementById('agendaDoctor');
const agendaGrid = document.getElementById('agendaGrid');

/* -------------------------------------------------------------
   CARGA DEL SELECT DE PROFESIONALES
------------------------------------------------------------- */
doctorSelect.innerHTML = doctors.map(function (doctor) {
  return `<option value="${doctor.id}">${doctor.name}</option>`;
}).join('');

/*
  Se asigna como fecha inicial el día actual.
  toISOString devuelve una fecha completa y slice(0, 10)
  conserva solamente YYYY-MM-DD, formato esperado por input date.
*/
dateInput.value = new Date().toISOString().slice(0, 10);

/* -------------------------------------------------------------
   FUNCIÓN renderAgenda()
------------------------------------------------------------- */
function renderAgenda() {

  // Se vuelven a leer los turnos por si fueron modificados en otra pantalla.
  const turns = AppData.read('turns');

  const date = dateInput.value;
  const doctorId = Number(doctorSelect.value);

  /*
    Se recorre cada horario y se busca un turno que coincida con:
    - fecha,
    - hora,
    - profesional,
    - estado diferente de Cancelado.
  */
  agendaGrid.innerHTML = hours.map(function (hour) {

    const turn = turns.find(function (item) {
      return item.date === date
        && item.time === hour
        && item.doctorId === doctorId
        && item.status !== 'Cancelado';
    });

    // Si no existe turno, el horario está libre.
    if (!turn) {
      return `
        <div class="agenda-slot free">
          <strong>${hour}</strong>
          <span>Horario disponible</span>
          <span class="slot-state">LIBRE</span>
        </div>
      `;
    }

    // Si existe turno, se localiza al paciente asociado.
    const patient = patients.find(function (item) {
      return item.id === turn.patientId;
    });

    return `
      <div class="agenda-slot busy">
        <strong>${hour}</strong>
        <span>${AppHelpers.patientName(patient)} - ${turn.status}</span>
        <span class="slot-state">OCUPADO</span>
      </div>
    `;
  }).join('');
}

/* -------------------------------------------------------------
   EVENTOS
   -------------------------------------------------------------
   Cada cambio de fecha o profesional vuelve a construir la agenda.
------------------------------------------------------------- */
dateInput.addEventListener('change', renderAgenda);
doctorSelect.addEventListener('change', renderAgenda);

// Primera carga de la agenda.
renderAgenda();
