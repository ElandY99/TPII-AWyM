/* =============================================================
   dashboard.js
   -------------------------------------------------------------
   Genera el contenido dinámico del Panel Principal:
   - Cantidad total de turnos.
   - Cantidad de confirmados.
   - Cantidad de cancelados.
   - Tabla con los próximos turnos activos.
   ============================================================= */

// Se leen las colecciones desde localStorage.
const turns = AppData.read('turns');
const patients = AppData.read('patients');
const doctors = AppData.read('doctors');

/* -------------------------------------------------------------
   INDICADORES DEL DASHBOARD
------------------------------------------------------------- */

// Total de elementos dentro del arreglo turns.
document.getElementById('totalTurnos').textContent = turns.length;

// filter devuelve solamente los turnos que cumplen la condición.
document.getElementById('confirmados').textContent = turns.filter(function (turn) {
  return turn.status === 'Confirmado';
}).length;

document.getElementById('cancelados').textContent = turns.filter(function (turn) {
  return turn.status === 'Cancelado';
}).length;

/* -------------------------------------------------------------
   TABLA DE PRÓXIMOS TURNOS
------------------------------------------------------------- */
const tbody = document.getElementById('dashboardTurnos');

/*
  1) Se quitan los turnos cancelados.
  2) Se ordenan por fecha y hora.
  3) Se muestran solamente los primeros cinco.
*/
const activeTurns = turns
  .filter(function (turn) {
    return turn.status !== 'Cancelado';
  })
  .sort(function (a, b) {
    const dateA = `${a.date} ${a.time}`;
    const dateB = `${b.date} ${b.time}`;
    return dateA.localeCompare(dateB);
  })
  .slice(0, 5);

// Si no existen turnos activos, se informa dentro de la tabla.
if (activeTurns.length === 0) {
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="empty-row">No hay turnos registrados.</td>
    </tr>
  `;
} else {

  /*
    map transforma cada turno en una fila HTML.
    join('') une todas esas filas en un único texto HTML.
  */
  tbody.innerHTML = activeTurns.map(function (turn) {

    // Se busca el paciente asociado al patientId del turno.
    const patient = patients.find(function (item) {
      return item.id === turn.patientId;
    });

    // Se busca el profesional asociado al doctorId del turno.
    const doctor = doctors.find(function (item) {
      return item.id === turn.doctorId;
    });

    return `
      <tr>
        <td>${turn.date}</td>
        <td>${turn.time}</td>
        <td>${AppHelpers.patientName(patient)}</td>
        <td>${AppHelpers.doctorName(doctor)}</td>
        <td>${AppHelpers.statusBadge(turn.status)}</td>
      </tr>
    `;
  }).join('');
}
