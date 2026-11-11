import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../scripts/db-reset.js';
import { closeDb, getDb } from '../src/db/connection.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.resolve(__dirname, '../data/test_paciente_rol.db');

test('Suite Completa: Rol PACIENTE - Segundo Parcial / TP4', async (suite) => {
  resetDatabase(testDbPath);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  suite.after(() => {
    server.close();
    closeDb();
  });

  let adminCookie = '';
  let recepCookie = '';
  let paciente1Cookie = ''; // Ana López (seed id_usuario=6, id_paciente=1)
  let paciente2Cookie = ''; // Luis Díaz (seed id_usuario=7, id_paciente=2)
  let nuevoPacienteId = 0;
  let nuevoUsuarioPacienteId = 0;
  let nuevaClaveGenerada = '';
  let nuevoPacienteCookie = '';

  // 1. Logins iniciales
  await suite.test('1. Autenticación de roles base y pacientes semilla', async () => {
    // Admin
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'admin@saludturnos.com', clave: 'SaludTurnos#2026' })
      });
      assert.equal(res.status, 200);
      adminCookie = res.headers.get('set-cookie').split(';')[0];
    }

    // Recepción
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'recepcion@saludturnos.com', clave: 'Recepcion#2026' })
      });
      assert.equal(res.status, 200);
      recepCookie = res.headers.get('set-cookie').split(';')[0];
    }

    // Paciente Semilla 1 (Ana López)
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'ana@email.com', clave: 'AnaLopez#2026' })
      });
      assert.equal(res.status, 200);
      paciente1Cookie = res.headers.get('set-cookie').split(';')[0];
      const body = await res.json();
      assert.equal(body.usuario.rol, 'PACIENTE');
      assert.equal(body.usuario.id_paciente, 1);
      assert.equal(body.usuario.dni, '30111222');
    }

    // Paciente Semilla 2 (Luis Díaz)
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'luis@email.com', clave: 'LuisDiaz#2026' })
      });
      assert.equal(res.status, 200);
      paciente2Cookie = res.headers.get('set-cookie').split(';')[0];
    }
  });

  // 2. Alta Atómica y Políticas de Clave
  await suite.test('2. Alta atómica de paciente con usuario y generación de clave', async () => {
    // 2.1 Recepcionista da de alta nuevo paciente
    const res = await fetch(`${baseUrl}/api/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepCookie },
      body: JSON.stringify({
        dni: '40123456',
        nombre: 'Valeria',
        apellido: 'Rios',
        correo: 'valeria.rios@email.com',
        telefono: '3764889900',
        fecha_nacimiento: '1995-08-20',
        obra_social: 'OSDE'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data.id_paciente);
    assert.ok(body.clave_generada, 'Debe devolver clave generada');
    nuevoPacienteId = body.data.id_paciente;
    nuevaClaveGenerada = body.clave_generada;

    // Verificar política de clave (12 caracteres, mayúscula, minúscula, número, especial)
    assert.ok(nuevaClaveGenerada.length >= 12);
    assert.ok(/[A-Z]/.test(nuevaClaveGenerada));
    assert.ok(/[a-z]/.test(nuevaClaveGenerada));
    assert.ok(/[0-9]/.test(nuevaClaveGenerada));
    assert.ok(/[^A-Za-z0-9]/.test(nuevaClaveGenerada));

    // 2.2 Rechazo por DNI duplicado
    const resDupDni = await fetch(`${baseUrl}/api/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepCookie },
      body: JSON.stringify({
        dni: '40123456',
        nombre: 'Otra',
        apellido: 'Persona',
        correo: 'otra.persona@email.com'
      })
    });
    assert.equal(resDupDni.status, 409);

    // 2.3 Rechazo por Correo duplicado en usuarios
    const resDupEmail = await fetch(`${baseUrl}/api/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepCookie },
      body: JSON.stringify({
        dni: '40999888',
        nombre: 'Clon',
        apellido: 'Email',
        correo: 'valeria.rios@email.com'
      })
    });
    assert.equal(resDupEmail.status, 409);

    // 2.4 Admin crea paciente desde pantalla usuarios (DM-28)
    const resAdmin = await fetch(`${baseUrl}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        nombre: 'Marcos',
        apellido: 'Perez',
        correo: 'marcos.perez@email.com',
        rol: 'PACIENTE',
        paciente: {
          dni: '38777666',
          telefono: '3764123456',
          obra_social: 'Swiss Medical'
        }
      })
    });
    assert.equal(resAdmin.status, 201);
    const bodyAdmin = await resAdmin.json();
    assert.ok(bodyAdmin.clave_generada);
    nuevoUsuarioPacienteId = bodyAdmin.id_usuario;
  });

  // 3. Login de nuevo paciente, sesión única y Mi Cuenta
  await suite.test('3. Login de nuevo paciente, sesión única y Mi Cuenta', async () => {
    // 3.1 Login con clave generada
    const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'valeria.rios@email.com', clave: nuevaClaveGenerada })
    });
    assert.equal(resLogin.status, 200);
    nuevoPacienteCookie = resLogin.headers.get('set-cookie').split(';')[0];
    const loginData = await resLogin.json();
    assert.equal(loginData.usuario.rol, 'PACIENTE');
    assert.equal(loginData.usuario.dni, '40123456');

    // 3.2 Consulta perfil Mi Cuenta (/api/auth/me)
    const resMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resMe.status, 200);
    const meData = await resMe.json();
    assert.equal(meData.usuario.dni, '40123456');
    assert.equal(meData.usuario.rol, 'PACIENTE');

    // 3.3 Cambio de contraseña
    const nuevaClavePersonal = 'ValeriaRios#2026!';
    const resPass = await fetch(`${baseUrl}/api/auth/clave`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: nuevoPacienteCookie },
      body: JSON.stringify({
        clave_actual: nuevaClaveGenerada,
        clave_nueva: nuevaClavePersonal
      })
    });
    assert.equal(resPass.status, 200);

    // 3.4 Comprobar que clave anterior falla y nueva funciona
    const resOldFail = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'valeria.rios@email.com', clave: nuevaClaveGenerada })
    });
    assert.equal(resOldFail.status, 401);

    const resNewOk = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'valeria.rios@email.com', clave: nuevaClavePersonal })
    });
    assert.equal(resNewOk.status, 200);
    nuevoPacienteCookie = resNewOk.headers.get('set-cookie').split(';')[0];
  });

  // 4. Acceso y Sanitización de Especialidades y Profesionales
  await suite.test('4. Consulta de especialidades y profesionales sanitizados', async () => {
    // 4.1 Especialidades (solo activas)
    const resEsp = await fetch(`${baseUrl}/api/especialidades`, {
      headers: { Cookie: paciente1Cookie }
    });
    assert.equal(resEsp.status, 200);
    const espBody = await resEsp.json();
    assert.ok(espBody.data.length > 0);
    assert.ok(espBody.data.every((e) => e.estado === 1));

    // Paciente no puede crear especialidad
    const resEspPost = await fetch(`${baseUrl}/api/especialidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: paciente1Cookie },
      body: JSON.stringify({ nombre: 'Neurología' })
    });
    assert.equal(resEspPost.status, 403);

    // 4.2 Profesionales (sanitizados para paciente)
    const resDoc = await fetch(`${baseUrl}/api/profesionales`, {
      headers: { Cookie: paciente1Cookie }
    });
    assert.equal(resDoc.status, 200);
    const docBody = await resDoc.json();
    assert.ok(docBody.data.length > 0);
    // Verificar sanitización: no debe existir matricula ni id_usuario ni usuario_correo
    for (const d of docBody.data) {
      assert.equal(d.matricula, undefined, 'No debe filtrar matrícula');
      assert.equal(d.id_usuario, undefined, 'No debe filtrar id_usuario');
      assert.equal(d.usuario_correo, undefined, 'No debe filtrar correo interno');
      assert.ok(d.nombre);
      assert.ok(d.apellido);
      assert.ok(d.consultorio);
    }

    // Detalle de profesional por ID
    const resDocDetail = await fetch(`${baseUrl}/api/profesionales/1`, {
      headers: { Cookie: paciente1Cookie }
    });
    assert.equal(resDocDetail.status, 200);
    const docDetail = await resDocDetail.json();
    assert.equal(docDetail.data.matricula, undefined);
  });

  // 5. Consulta de Disponibilidad y Reserva de Turnos
  await suite.test('5. Disponibilidad y Reserva de Turnos por el Paciente', async () => {
    // 5.1 Consultar turnos disponibles para lunes 2026-11-16
    const resDisp = await fetch(`${baseUrl}/api/turnos/disponibles?fecha=2026-11-16&id_profesional=1`, {
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resDisp.status, 200);
    const dispBody = await resDisp.json();
    assert.ok(dispBody.data[0].horarios.includes('10:00'));

    // 5.2 Reserva exitosa para sí mismo (sin enviar id_paciente explícito)
    const resTurno = await fetch(`${baseUrl}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: nuevoPacienteCookie },
      body: JSON.stringify({
        id_profesional: 1,
        fecha: '2026-11-16',
        hora: '10:00',
        motivo_consulta: 'Dolor de espalda'
      })
    });
    assert.equal(resTurno.status, 201);
    const turnoBody = await resTurno.json();
    assert.equal(turnoBody.data.estado, 'PENDIENTE');
    assert.equal(turnoBody.data.id_paciente, nuevoPacienteId);
    assert.equal(turnoBody.data.observaciones, undefined, 'No debe filtrar observaciones internas');

    // 5.3 Intento de reservar para otro paciente -> 403 Forbidden (RFM-12)
    const resImpersonate = await fetch(`${baseUrl}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: nuevoPacienteCookie },
      body: JSON.stringify({
        id_paciente: 1, // Pertenece a Ana López
        id_profesional: 1,
        fecha: '2026-11-16',
        hora: '10:30'
      })
    });
    assert.equal(resImpersonate.status, 403);

    // 5.4 Doble reserva en el mismo slot 10:00 -> 409
    const resDoble = await fetch(`${baseUrl}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: paciente1Cookie },
      body: JSON.stringify({
        id_profesional: 1,
        fecha: '2026-11-16',
        hora: '10:00'
      })
    });
    assert.equal(resDoble.status, 409);
  });

  // 6. Aislamiento Estricto y Ordenamiento DM-21
  await suite.test('6. Aislamiento de turnos y ordenamiento DM-21', async () => {
    // 6.1 Paciente 1 (Ana López) consulta sus turnos
    const resAna = await fetch(`${baseUrl}/api/turnos`, {
      headers: { Cookie: paciente1Cookie }
    });
    assert.equal(resAna.status, 200);
    const anaBody = await resAna.json();
    // Todos los turnos devueltos deben ser de id_paciente = 1
    assert.ok(anaBody.data.length > 0);
    for (const t of anaBody.data) {
      assert.equal(t.id_paciente, 1);
      assert.equal(t.observaciones, undefined, 'No debe filtrar observaciones internas');
    }

    // 6.2 Paciente intenta ver por ID un turno que no le pertenece -> 404
    // Buscamos un turno de Ana (paciente 1) e intentamos acceder con Valeria
    const turnoAnaId = anaBody.data[0].id_turno;
    const resForbiddenTurno = await fetch(`${baseUrl}/api/turnos/${turnoAnaId}`, {
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resForbiddenTurno.status, 404);

    // 6.3 Paciente Valeria consulta sus turnos: solo ve su turno de 10:00
    const resValeria = await fetch(`${baseUrl}/api/turnos`, {
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resValeria.status, 200);
    const valeriaBody = await resValeria.json();
    assert.equal(valeriaBody.data.length, 1);
    assert.equal(valeriaBody.data[0].id_paciente, nuevoPacienteId);
  });

  // 7. Endpoints Prohibidos y Cancelación de Turno Propio
  await suite.test('7. Verificación de permisos y cancelación de turno propio por el paciente', async () => {
    // Agenda -> 403
    const resAgenda = await fetch(`${baseUrl}/api/agenda?id_profesional=1&fecha=2026-11-16`, {
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resAgenda.status, 403);

    // Usuarios -> 403
    const resUsuarios = await fetch(`${baseUrl}/api/usuarios`, {
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resUsuarios.status, 403);

    // Pacientes -> 403
    const resPacientes = await fetch(`${baseUrl}/api/pacientes`, {
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resPacientes.status, 403);

    // Modificar turno (PUT) -> 403
    const resPutTurno = await fetch(`${baseUrl}/api/turnos/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: nuevoPacienteCookie },
      body: JSON.stringify({ fecha: '2026-11-23', hora: '10:00' })
    });
    assert.equal(resPutTurno.status, 403);

    // Cambiar estado turno arbitrario (PATCH) -> 403
    const resPatchTurno = await fetch(`${baseUrl}/api/turnos/1/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: nuevoPacienteCookie },
      body: JSON.stringify({ estado: 'CONFIRMADO' })
    });
    assert.equal(resPatchTurno.status, 403);

    // Cancelar turno ajeno (DELETE) -> 404 Not Found
    const resDeleteAjeno = await fetch(`${baseUrl}/api/turnos/1`, {
      method: 'DELETE',
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resDeleteAjeno.status, 404);

    // Cancelar turno propio en estado CONFIRMADO (Ana López cancela su turno 5) -> 200 OK
    const resCancelAna = await fetch(`${baseUrl}/api/turnos/5`, {
      method: 'DELETE',
      headers: { Cookie: paciente1Cookie }
    });
    assert.equal(resCancelAna.status, 200);
    const cancelBody = await resCancelAna.json();
    assert.equal(cancelBody.data.estado, 'CANCELADO');

    // Intentar cancelar nuevamente el turno ya CANCELADO -> 409 Conflict
    const resCancelRepetido = await fetch(`${baseUrl}/api/turnos/5`, {
      method: 'DELETE',
      headers: { Cookie: paciente1Cookie }
    });
    assert.equal(resCancelRepetido.status, 409);
  });

  // 8. Dashboard Scoped para Paciente
  await suite.test('8. Dashboard adaptado y acotado al paciente', async () => {
    const resDash = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resDash.status, 200);
    const dash = await resDash.json();

    // Debe mostrar los indicadores de Valeria (1 turno pendiente)
    assert.equal(dash.data.indicadores.total, 1);
    assert.equal(dash.data.indicadores.por_estado.PENDIENTE, 1);
    assert.equal(dash.data.proximos.length, 1);
    assert.equal(dash.data.proximos[0].id_paciente, nuevoPacienteId);
  });

  // 9. Restablecimiento de clave por recepcionista y admin
  await suite.test('9. Restablecimiento de contraseña de paciente por recepción', async () => {
    // Recepcionista restablece clave
    const resReset = await fetch(`${baseUrl}/api/pacientes/${nuevoPacienteId}/clave`, {
      method: 'POST',
      headers: { Cookie: recepCookie }
    });
    assert.equal(resReset.status, 200);
    const bodyReset = await resReset.json();
    assert.ok(bodyReset.clave_generada);
    const claveNuevaReset = bodyReset.clave_generada;

    // La sesión actual de Valeria debe haber sido destruida
    const resMeOld = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: nuevoPacienteCookie }
    });
    assert.equal(resMeOld.status, 401);

    // Valeria inicia sesión con la clave restablecida
    const resLoginReset = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'valeria.rios@email.com', clave: claveNuevaReset })
    });
    assert.equal(resLoginReset.status, 200);
  });

  // 10. Desactivación sincronizada de paciente y sesiones
  await suite.test('10. Desactivación sincronizada y bloqueo de login', async () => {
    // Recepcionista intenta desactivar paciente -> 403 Forbidden (solo Admin)
    const resRecepDeact = await fetch(`${baseUrl}/api/pacientes/${nuevoPacienteId}`, {
      method: 'DELETE',
      headers: { Cookie: recepCookie }
    });
    assert.equal(resRecepDeact.status, 403);

    // Admin intenta desactivar paciente con turno futuro activo -> 409
    const resDeactFail = await fetch(`${baseUrl}/api/pacientes/${nuevoPacienteId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    assert.equal(resDeactFail.status, 409);

    // Cancelamos el turno para permitir desactivar
    const db = getDb();
    db.prepare("UPDATE turno SET estado = 'CANCELADO' WHERE id_paciente = ?").run(nuevoPacienteId);

    // Ahora Admin desactiva exitosamente -> 200
    const resDeactOk = await fetch(`${baseUrl}/api/pacientes/${nuevoPacienteId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    assert.equal(resDeactOk.status, 200);

    // Verificar que el usuario quedó con estado = 0 y no puede loguearse
    const resLoginBlocked = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'valeria.rios@email.com', clave: 'ValeriaRios#2026!' })
    });
    assert.equal(resLoginBlocked.status, 401);
  });

  // 11. H-01: Aislamiento estricto si id_paciente es null
  await suite.test('11. Verificación H-01 para paciente no vinculado', async () => {
    const fakePatientUser = {
      id: 999,
      correo: 'unlinked@email.com',
      rol: 'PACIENTE',
      id_paciente: null
    };

    // Importamos dinámicamente o verificamos vía servicio
    const { turnoService } = await import('../src/services/turnoService.js');
    const { agendaService } = await import('../src/services/agendaService.js');

    const turnos = turnoService.list({}, fakePatientUser);
    assert.deepEqual(turnos, []);

    const dash = agendaService.getDashboard(fakePatientUser);
    assert.equal(dash.indicadores.total, 0);
    assert.deepEqual(dash.proximos, []);
  });
});
