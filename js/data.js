/* =============================================================
   data.js
   -------------------------------------------------------------
   Este archivo cumple dos funciones principales:

   1) Define datos simulados para poder probar el Front-End.
   2) Proporciona funciones simples para leer y guardar información
      utilizando localStorage.

   IMPORTANTE:
   - No existe una base de datos real.
   - No existe un backend.
   - localStorage pertenece al navegador del usuario.
   - Los datos se mantienen mientras no se borre el almacenamiento
     del navegador.
   ============================================================= */

/*
  Se utiliza una función autoejecutable (IIFE).
  Esto evita dejar variables internas sueltas en el ámbito global.
*/
(function () {

  /* -----------------------------------------------------------
     DATOS INICIALES DEL SISTEMA
     -----------------------------------------------------------
     Estos datos se utilizan solamente la primera vez que se pide
     cada colección y todavía no existe información en localStorage.
  ----------------------------------------------------------- */
  const defaults = {

    // Usuario simulado para probar el Login.
    users: [
      {
        email: 'admin@saludturnos.com',
        password: '1234',
        role: 'Administrador'
      }
    ],

    // Especialidades disponibles.
    specialties: [
      { id: 1, name: 'Clínica médica' },
      { id: 2, name: 'Pediatría' },
      { id: 3, name: 'Cardiología' }
    ],

    // Profesionales y la especialidad a la que pertenece cada uno.
    doctors: [
      {
        id: 1,
        name: 'Dra. Laura Gómez',
        specialtyId: 1,
        office: '101'
      },
      {
        id: 2,
        name: 'Dr. Martín Pérez',
        specialtyId: 2,
        office: '102'
      },
      {
        id: 3,
        name: 'Dra. Carla Núñez',
        specialtyId: 3,
        office: '103'
      }
    ],

    // Pacientes de ejemplo.
    patients: [
      {
        id: 1,
        dni: '30111222',
        nombre: 'Ana',
        apellido: 'López',
        telefono: '3764-111111',
        correo: 'ana@email.com',
        estado: true
      },
      {
        id: 2,
        dni: '28777444',
        nombre: 'Luis',
        apellido: 'Díaz',
        telefono: '3765-222222',
        correo: 'luis@email.com',
        estado: true
      }
    ],

    // Turnos iniciales utilizados para mostrar contenido en Dashboard y Agenda.
    turns: [
      {
        id: 1,
        patientId: 1,
        doctorId: 1,
        date: '2026-10-06',
        time: '09:00',
        status: 'Confirmado',
        motivo: 'Control'
      },
      {
        id: 2,
        patientId: 2,
        doctorId: 2,
        date: '2026-10-06',
        time: '09:30',
        status: 'Pendiente',
        motivo: 'Consulta'
      }
    ],

    // Horarios posibles para la agenda.
    hours: [
      '08:30',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30'
    ]
  };

  /* -----------------------------------------------------------
     FUNCIÓN read(key)
     -----------------------------------------------------------
     Recibe el nombre de una colección, por ejemplo:
       AppData.read('patients')

     1) Busca en localStorage una clave llamada saludturnos_patients.
     2) Si existe, convierte el JSON a un objeto/arreglo JavaScript.
     3) Si no existe, guarda los datos iniciales y los devuelve.
  ----------------------------------------------------------- */
  function read(key) {
    const storageKey = 'saludturnos_' + key;
    const stored = localStorage.getItem(storageKey);

    // Si ya existen datos guardados, se devuelven esos datos.
    if (stored) {
      return JSON.parse(stored);
    }

    // Si todavía no existen, se guardan los valores por defecto.
    localStorage.setItem(storageKey, JSON.stringify(defaults[key]));

    /*
      Se devuelve una copia para evitar modificar accidentalmente
      el objeto defaults original.
    */
    return JSON.parse(JSON.stringify(defaults[key]));
  }

  /* -----------------------------------------------------------
     FUNCIÓN write(key, value)
     -----------------------------------------------------------
     Guarda una colección completa en localStorage.

     Ejemplo:
       AppData.write('patients', patients);
  ----------------------------------------------------------- */
  function write(key, value) {
    const storageKey = 'saludturnos_' + key;
    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  /*
    Se crea un único objeto global llamado AppData.
    Los demás archivos JavaScript pueden usarlo así:

      AppData.read('turns');
      AppData.write('turns', turns);
  */
  window.AppData = {
    defaults,
    read,
    write
  };

})();
