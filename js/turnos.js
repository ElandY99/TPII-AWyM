/* =============================================================
   turnos.js
   -------------------------------------------------------------
   Lógica principal de Gestión / Solicitud de Turnos.

   Permite:
   - Cargar pacientes activos.
   - Cargar especialidades.
   - Filtrar profesionales según especialidad.
   - Calcular horarios libres.
   - Validar el formulario.
   - Evitar superposición de turnos.
   - Registrar un nuevo turno.
   - Cancelar un turno existente.
   ============================================================= */

/* -------------------------------------------------------------
   CARGA DE DATOS
------------------------------------------------------------- */
let turns = AppData.read('turns');
const patients = AppData.read('patients');
const doctors = AppData.read('doctors');
const specialties = AppData.read('specialties');
const hours = AppData.read('hours');

/* -------------------------------------------------------------
   REFERENCIAS AL DOM
------------------------------------------------------------- */
const patientSelect = document.getElementById('patientSelect');
const specialtySelect = document.getElementById('specialtySelect');
const doctorSelect = document.getElementById('doctorSelect');
const dateInput = document.getElementById('turnDate');
const timeSelect = document.getElementById('turnTime');
const form = document.getElementById('turnForm');
const message = document.getElementById('turnMessage');
const table = document.getElementById('turnsTable');

/* -------------------------------------------------------------
   FUNCIÓN fillPatients()
   -------------------------------------------------------------
   Carga en el <select> solamente pacientes activos.
------------------------------------------------------------- */
function fillPatients() {
  const activePatients = patients.filter(function (patient) {
    return patient.estado;
  });

  const options = activePatients.map(function (patient) {
    return `
      <option value="${patient.id}">
        ${patient.dni} - ${patient.nombre} ${patient.apellido}
      </option>
    `;
  }).join('');

  patientSelect.innerHTML = `
    <option value="">Seleccione un paciente</option>
    ${options}
  `;
}

/* -------------------------------------------------------------
   FUNCIÓN fillSpecialties()
   Carga las especialidades disponibles.
------------------------------------------------------------- */
function fillSpecialties() {
  specialtySelect.innerHTML = specialties.map(function (specialty) {
    return `<option value="${specialty.id}">${specialty.name}</option>`;
  }).join('');
}

/* -------------------------------------------------------------
   FUNCIÓN fillDoctors()
   -------------------------------------------------------------
   Filtra profesionales según la especialidad elegida.
------------------------------------------------------------- */
function fillDoctors() {

  // value viene del HTML como texto, por eso se convierte a Number.
  const specialtyId = Number(specialtySelect.value);

  const filteredDoctors = doctors.filter(function (doctor) {
    return doctor.specialtyId === specialtyId;
  });

  const options = filteredDoctors.map(function (doctor) {
    return `
      <option value="${doctor.id}">
        ${doctor.name} - Consultorio ${doctor.office}
      </option>
    `;
  }).join('');

  doctorSelect.innerHTML = `
    <option value="">Seleccione un profesional</option>
    ${options}
  `;

  /*
    Al cambiar de especialidad también cambia el profesional.
    Por eso se recalculan los horarios disponibles.
  */
  fillHours();
}

/* -------------------------------------------------------------
   FUNCIÓN fillHours()
   -------------------------------------------------------------
   Muestra únicamente horarios que todavía no estén ocupados por
   un turno activo del mismo profesional y la misma fecha.
------------------------------------------------------------- */
function fillHours() {
  const doctorId = Number(doctorSelect.value);
  const date = dateInput.value;

  // Se reinicia el selector de horarios.
  timeSelect.innerHTML = '<option value="">Seleccione un horario</option>';

  hours.forEach(function (hour) {

    /*
      occupied será true si existe un turno que coincida con:
      - mismo profesional,
      - misma fecha,
      - misma hora,
      - estado diferente de Cancelado.
    */
    const occupied = turns.some(function (turn) {
      return turn.doctorId === doctorId
        && turn.date === date
        && turn.time === hour
        && turn.status !== 'Cancelado';
    });

    // Solo se agrega el horario si está libre.
    if (!occupied) {
      timeSelect.insertAdjacentHTML(
        'beforeend',
        `<option value="${hour}">${hour}</option>`
      );
    }
  });
}

/* -------------------------------------------------------------
   FUNCIÓN clearErrors()
   Limpia mensajes previos del formulario.
------------------------------------------------------------- */
function clearErrors() {
  const errorIds = [
    'patientSelectError',
    'doctorSelectError',
    'turnDateError',
    'turnTimeError'
  ];

  errorIds.forEach(function (id) {
    document.getElementById(id).textContent = '';
  });

  message.textContent = '';
  message.className = 'form-message span-2';
}

/* -------------------------------------------------------------
   FUNCIÓN renderTurns()
   -------------------------------------------------------------
   Construye la tabla con todos los turnos registrados.
------------------------------------------------------------- */
function renderTurns() {

  // Si no hay turnos, se muestra un mensaje dentro de la tabla.
  if (turns.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">No hay turnos registrados.</td>
      </tr>
    `;
    return;
  }

  /*
    slice crea una copia antes de ordenar para no alterar
    directamente el arreglo original.
  */
  const orderedTurns = turns
    .slice()
    .sort(function (a, b) {
      const dateA = `${a.date} ${a.time}`;
      const dateB = `${b.date} ${b.time}`;
      return dateA.localeCompare(dateB);
    });

  table.innerHTML = orderedTurns.map(function (turn) {

    // Se recupera el objeto paciente relacionado con el turno.
    const patient = patients.find(function (item) {
      return item.id === turn.patientId;
    });

    // Se recupera el objeto profesional relacionado con el turno.
    const doctor = doctors.find(function (item) {
      return item.id === turn.doctorId;
    });

    /*
      Si el turno ya está cancelado no tiene sentido mostrar nuevamente
      el botón Cancelar.
    */
    const action = turn.status === 'Cancelado'
      ? '-'
      : `<button class="btn btn-danger" data-cancel-id="${turn.id}">Cancelar</button>`;

    return `
      <tr>
        <td>${turn.date}</td>
        <td>${turn.time}</td>
        <td>${AppHelpers.patientName(patient)}</td>
        <td>${AppHelpers.doctorName(doctor)}</td>
        <td>${AppHelpers.statusBadge(turn.status)}</td>
        <td>${action}</td>
      </tr>
    `;
  }).join('');
}

/* -------------------------------------------------------------
   EVENTOS DE LOS FILTROS DEL FORMULARIO
------------------------------------------------------------- */

// Cambiar la especialidad vuelve a cargar profesionales.
specialtySelect.addEventListener('change', fillDoctors);

// Cambiar el profesional vuelve a calcular disponibilidad.
doctorSelect.addEventListener('change', fillHours);

// Cambiar la fecha vuelve a calcular disponibilidad.
dateInput.addEventListener('change', fillHours);

/* -------------------------------------------------------------
   CANCELACIÓN DE TURNOS
   -------------------------------------------------------------
   Se usa delegación de eventos sobre la tabla porque los botones
   Cancelar son creados dinámicamente con innerHTML.
------------------------------------------------------------- */
table.addEventListener('click', function (event) {

  /*
    closest busca si el elemento presionado o alguno de sus padres
    posee el atributo data-cancel-id.
  */
  const button = event.target.closest('[data-cancel-id]');

  // Si el click no fue sobre un botón Cancelar, no se hace nada.
  if (!button) {
    return;
  }

  // dataset.cancelId recupera el valor del atributo data-cancel-id.
  const id = Number(button.dataset.cancelId);

  /*
    map crea un nuevo arreglo.
    Solo el turno con el ID indicado cambia su estado a Cancelado.
  */
  turns = turns.map(function (turn) {
    if (turn.id === id) {
      return {
        ...turn,
        status: 'Cancelado'
      };
    }

    return turn;
  });

  // Se guarda el arreglo actualizado.
  AppData.write('turns', turns);

  // Se actualizan la tabla y los horarios disponibles.
  renderTurns();
  fillHours();
});

/* -------------------------------------------------------------
   REGISTRO DE UN NUEVO TURNO
------------------------------------------------------------- */
form.addEventListener('submit', function (event) {
  event.preventDefault();
  clearErrors();

  // Se leen los valores del formulario.
  const patientId = Number(patientSelect.value);
  const doctorId = Number(doctorSelect.value);
  const date = dateInput.value;
  const time = timeSelect.value;
  const motivo = document.getElementById('motivo').value.trim();

  let valid = true;

  /* ---------------- VALIDACIONES BÁSICAS ---------------- */
  if (!patientId) {
    document.getElementById('patientSelectError').textContent = 'Seleccione un paciente.';
    valid = false;
  }

  if (!doctorId) {
    document.getElementById('doctorSelectError').textContent = 'Seleccione un profesional.';
    valid = false;
  }

  if (!date) {
    document.getElementById('turnDateError').textContent = 'Seleccione una fecha.';
    valid = false;
  }

  if (!time) {
    document.getElementById('turnTimeError').textContent = 'Seleccione un horario disponible.';
    valid = false;
  }

  if (!valid) {
    return;
  }

  /* -------------------------------------------------------
     SEGUNDA VERIFICACIÓN DE DISPONIBILIDAD
     -------------------------------------------------------
     Aunque el horario mostrado era libre, se valida nuevamente
     antes de guardar. Esto evita registrar una superposición.
  ------------------------------------------------------- */
  const conflict = turns.some(function (turn) {
    return turn.doctorId === doctorId
      && turn.date === date
      && turn.time === time
      && turn.status !== 'Cancelado';
  });

  if (conflict) {
    message.textContent = 'El horario dejó de estar disponible. Seleccione otro.';
    message.classList.add('bad');

    fillHours();
    return;
  }

  /* ---------------- GENERACIÓN DEL ID ------------------- */
  const nextId = turns.length > 0
    ? Math.max(...turns.map(function (turn) { return turn.id; })) + 1
    : 1;

  // Se crea el nuevo objeto Turno.
  const newTurn = {
    id: nextId,
    patientId,
    doctorId,
    date,
    time,
    status: 'Pendiente',
    motivo
  };

  // Se agrega al arreglo y se guarda en localStorage.
  turns.push(newTurn);
  AppData.write('turns', turns);

  // Se informa el resultado al usuario.
  message.textContent = 'Turno registrado correctamente.';
  message.classList.add('ok');

  // Se actualiza el DOM sin recargar la página.
  renderTurns();
  fillHours();
});

/* -------------------------------------------------------------
   INICIALIZACIÓN DE LA PANTALLA
------------------------------------------------------------- */

// Carga pacientes y especialidades.
fillPatients();
fillSpecialties();

// Con la primera especialidad disponible se cargan los profesionales.
fillDoctors();

/*
  Se establece la fecha mínima en hoy para impedir seleccionar
  días anteriores desde el control HTML.
*/
dateInput.min = new Date().toISOString().slice(0, 10);
dateInput.value = dateInput.min;

// Se calculan horarios y se dibuja la tabla inicial.
fillHours();
renderTurns();
