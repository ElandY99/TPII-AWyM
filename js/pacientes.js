/* =============================================================
   pacientes.js
   -------------------------------------------------------------
   Lógica de la pantalla Gestión de Pacientes:
   - Mostrar pacientes.
   - Buscar pacientes.
   - Mostrar/ocultar el formulario.
   - Validar datos.
   - Evitar DNI duplicados.
   - Registrar pacientes en localStorage.
   ============================================================= */

/*
  let se utiliza porque el arreglo patients será modificado cuando
  se agregue un nuevo paciente.
*/
let patients = AppData.read('patients');

// Referencias a elementos del DOM.
const table = document.getElementById('patientsTable');
const search = document.getElementById('patientSearch');
const formCard = document.getElementById('patientFormCard');
const form = document.getElementById('patientForm');
const toggleBtn = document.getElementById('toggleFormBtn');
const cancelBtn = document.getElementById('cancelPatientBtn');
const message = document.getElementById('patientMessage');

/* -------------------------------------------------------------
   FUNCIÓN renderPatients(filter)
   -------------------------------------------------------------
   Dibuja la tabla de pacientes.
   Puede recibir un texto opcional para filtrar los resultados.
------------------------------------------------------------- */
function renderPatients(filter = '') {

  // Se normaliza el texto para facilitar la comparación.
  const text = filter.toLowerCase().trim();

  /*
    filter recorre cada paciente y conserva aquellos donde el texto
    buscado aparezca en DNI, nombre o apellido.
  */
  const filtered = patients.filter(function (patient) {
    const searchableText = `${patient.dni} ${patient.nombre} ${patient.apellido}`.toLowerCase();
    return searchableText.includes(text);
  });

  // Si se encontraron pacientes, se generan las filas.
  if (filtered.length > 0) {
    table.innerHTML = filtered.map(function (patient) {
      return `
        <tr>
          <td>${patient.dni}</td>
          <td>${patient.nombre} ${patient.apellido}</td>
          <td>${patient.telefono || '-'}</td>
          <td>${patient.correo || '-'}</td>
          <td>${patient.estado ? 'Activo' : 'Inactivo'}</td>
        </tr>
      `;
    }).join('');
  } else {
    // Caso en el que el filtro no devuelve resultados.
    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">No se encontraron pacientes.</td>
      </tr>
    `;
  }
}

/* -------------------------------------------------------------
   FUNCIÓN clearFormErrors()
   Limpia mensajes anteriores del formulario.
------------------------------------------------------------- */
function clearFormErrors() {
  const errorIds = [
    'dniError',
    'nombreError',
    'apellidoError',
    'correoError'
  ];

  errorIds.forEach(function (id) {
    document.getElementById(id).textContent = '';
  });

  message.textContent = '';
  message.className = 'form-message span-2';
}

/* -------------------------------------------------------------
   FUNCIÓN toggleForm(show)
   -------------------------------------------------------------
   show = true  -> muestra el formulario.
   show = false -> oculta y limpia el formulario.
------------------------------------------------------------- */
function toggleForm(show) {
  formCard.classList.toggle('hidden', !show);

  if (!show) {
    form.reset();
    clearFormErrors();
  }
}

/* -------------------------------------------------------------
   EVENTOS DE INTERFAZ
------------------------------------------------------------- */

// Botón "Nuevo paciente".
toggleBtn.addEventListener('click', function () {
  toggleForm(true);
});

// Botón "Cancelar" del formulario.
cancelBtn.addEventListener('click', function () {
  toggleForm(false);
});

/*
  El evento input se dispara cada vez que cambia el contenido
  del cuadro de búsqueda. La tabla se actualiza en tiempo real.
*/
search.addEventListener('input', function () {
  renderPatients(search.value);
});

/* -------------------------------------------------------------
   ALTA DE PACIENTE
------------------------------------------------------------- */
form.addEventListener('submit', function (event) {
  event.preventDefault();
  clearFormErrors();

  // Se obtienen los valores ingresados.
  const dni = document.getElementById('dni').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const correo = document.getElementById('correo').value.trim();

  let valid = true;

  /* ---------------- VALIDACIÓN DEL DNI ---------------- */
  if (!dni) {
    document.getElementById('dniError').textContent = 'El DNI es obligatorio.';
    valid = false;
  } else {
    // some devuelve true si al menos un paciente tiene ese DNI.
    const duplicatedDni = patients.some(function (patient) {
      return patient.dni === dni;
    });

    if (duplicatedDni) {
      document.getElementById('dniError').textContent = 'El DNI ya se encuentra registrado.';
      valid = false;
    }
  }

  /* --------------- VALIDACIÓN DEL NOMBRE -------------- */
  if (!nombre) {
    document.getElementById('nombreError').textContent = 'El nombre es obligatorio.';
    valid = false;
  }

  /* -------------- VALIDACIÓN DEL APELLIDO ------------- */
  if (!apellido) {
    document.getElementById('apellidoError').textContent = 'El apellido es obligatorio.';
    valid = false;
  }

  /* ---------------- VALIDACIÓN DEL CORREO --------------
     El correo es opcional, pero si el usuario escribe uno debe
     respetar un formato básico usuario@dominio.extensión.
  ------------------------------------------------------- */
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (correo && !emailPattern.test(correo)) {
    document.getElementById('correoError').textContent = 'Ingrese un correo válido.';
    valid = false;
  }

  // Si existe algún error, no se registra el paciente.
  if (!valid) {
    return;
  }

  /* -----------------------------------------------------
     GENERACIÓN DEL NUEVO ID
     -----------------------------------------------------
     Se obtiene el mayor ID actual y se suma 1.
     Si todavía no existen pacientes, se comienza desde 1.
  ----------------------------------------------------- */
  const nextId = patients.length > 0
    ? Math.max(...patients.map(function (patient) { return patient.id; })) + 1
    : 1;

  // Se agrega el nuevo objeto al arreglo.
  patients.push({
    id: nextId,
    dni,
    nombre,
    apellido,
    telefono,
    correo,
    estado: true
  });

  // Se persiste el arreglo actualizado en localStorage.
  AppData.write('patients', patients);

  // Se vuelve a dibujar la tabla manteniendo el filtro actual.
  renderPatients(search.value);

  // Mensaje de éxito.
  message.textContent = 'Paciente registrado correctamente.';
  message.classList.add('ok');

  // Se limpian los campos del formulario.
  form.reset();
});

/* -------------------------------------------------------------
   CARGA INICIAL
   -------------------------------------------------------------
   Al entrar a la pantalla se dibuja inmediatamente el listado.
------------------------------------------------------------- */
renderPatients();
