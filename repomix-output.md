This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: **/node_modules/**, **/Info_del_proyecto/**, **/css/**, **/requirements.md, **/MANUAL_DE_INSTALACION_Y_CONFIGURACION.pdf
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
backend/
  scripts/
    db-export.js
    db-reset.js
    hash-password.js
  src/
    config/
      index.js
    controllers/
      agendaController.js
      authController.js
      especialidadController.js
      pacienteController.js
      turnoController.js
      userController.js
    core/
      cookies.js
      errorHandler.js
      errors.js
      passwords.js
      text.js
      time.js
    db/
      connection.js
      export.sql
      schema.sql
      seed.sql
    middleware/
      auth.js
      roles.js
      validate.js
    repositories/
      especialidadRepository.js
      pacienteRepository.js
      profesionalRepository.js
      turnoRepository.js
      userRepository.js
    routes/
      agendaRoutes.js
      authRoutes.js
      especialidadRoutes.js
      pacienteRoutes.js
      turnoRoutes.js
      userRoutes.js
    schemas/
      agendaSchema.js
      authSchema.js
      especialidadSchema.js
      pacienteSchema.js
      turnoSchema.js
      userSchema.js
    services/
      agendaService.js
      auditService.js
      authService.js
      especialidadService.js
      pacienteService.js
      turnoService.js
      userService.js
    app.js
  test/
    agenda.test.js
    auth.test.js
    core.test.js
    especialidades.test.js
    paciente_rol.test.js
    pacientes.test.js
    turnos.test.js
    users.test.js
  server.js
frontend/
  images/
    eye-key-look-password-security-see-svgrepo-com.svg
    eye-password-see-view-svgrepo-com.svg
  js/
    agenda.js
    api.js
    common.js
    cuenta.js
    dashboard.js
    especialidades.js
    login.js
    pacientes.js
    profesionales.js
    turnos.js
    ui.js
    usuarios.js
  agenda.html
  cuenta.html
  dashboard.html
  especialidades.html
  index.html
  login.html
  pacientes.html
  profesionales.html
  turno.html
  usuarios.html
.gitignore
package.json
repomix.config.json
```

# Files

## File: backend/test/paciente_rol.test.js
```javascript
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
```

## File: repomix.config.json
```json
{
  "ignore": {
    "customPatterns": ["**/node_modules/**", "**/Info_del_proyecto/**", "**/css/**", "**/requirements.md", "**/MANUAL_DE_INSTALACION_Y_CONFIGURACION.pdf"],
    "useGitignore": true,
    "useDotIgnore": true,
    "useDefaultPatterns": true
  }
}
```

## File: backend/scripts/db-export.js
```javascript
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, closeDb } from '../src/db/connection.js';
import { config } from '../src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function exportDatabase(outputFilePath) {
  const db = getDb();
  const targetFile = outputFilePath || path.resolve(__dirname, '../src/db/export.sql');

  const tables = [
    'usuario',
    'sesion',
    'especialidad',
    'profesional',
    'disponibilidad',
    'paciente',
    'turno',
    'auditoria'
  ];

  let sqlDump = `-- =====================================================================
-- EXPORTACIÓN COMPLETA DE BASE DE DATOS - SISTEMA SALUD TURNOS (TP3)
-- Generado automáticamente: ${new Date().toISOString()}
-- =====================================================================

PRAGMA foreign_keys = OFF;

`;

  // Esquema de cada tabla
  for (const table of tables) {
    const tableDef = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`).get(table);
    if (tableDef && tableDef.sql) {
      sqlDump += `DROP TABLE IF EXISTS ${table};\n${tableDef.sql};\n\n`;
    }
  }

  // Índices
  const indexes = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL`).all();
  for (const idx of indexes) {
    sqlDump += `${idx.sql};\n`;
  }
  sqlDump += '\n';

  // Volcado de datos de cada tabla
  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length > 0) {
      sqlDump += `-- Datos de ${table}\n`;
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        sqlDump += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      sqlDump += '\n';
    }
  }

  sqlDump += `PRAGMA foreign_keys = ON;\n`;

  fs.writeFileSync(targetFile, sqlDump, 'utf8');
  console.log(`[Exportación] Base de datos exportada con éxito en: ${targetFile}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  exportDatabase();
  closeDb();
}
```

## File: backend/scripts/db-reset.js
```javascript
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, closeDb } from '../src/db/connection.js';
import { config } from '../src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function resetDatabase(customDbPath) {
  closeDb();

  const targetPath = customDbPath || config.dbPath;

  // Eliminar archivo existente y auxiliares WAL/SHM
  if (targetPath !== ':memory:') {
    const filesToRemove = [targetPath, `${targetPath}-wal`, `${targetPath}-shm`];
    for (const f of filesToRemove) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {
          // ignore
        }
      }
    }
  }

  const db = getDb(targetPath);

  const schemaPath = path.resolve(__dirname, '../src/db/schema.sql');
  const seedPath = path.resolve(__dirname, '../src/db/seed.sql');

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  const dropSql = `
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS auditoria;
    DROP TABLE IF EXISTS turno;
    DROP TABLE IF EXISTS paciente;
    DROP TABLE IF EXISTS disponibilidad;
    DROP TABLE IF EXISTS profesional;
    DROP TABLE IF EXISTS especialidad;
    DROP TABLE IF EXISTS sesion;
    DROP TABLE IF EXISTS usuario;
    PRAGMA foreign_keys = ON;
  `;

  db.exec(dropSql);
  db.exec(schemaSql);
  db.exec(seedSql);

  console.log(`[Base de Datos] Reinicializada con éxito en: ${targetPath}`);
  return db;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  resetDatabase();
  closeDb();
}
```

## File: backend/scripts/hash-password.js
```javascript
import crypto from 'node:crypto';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}

const passwords = {
  admin: 'SaludTurnos#2026',
  recepcion: 'Recepcion#2026',
  laura: 'LauraGomez#2026',
  martin: 'MartinPerez#2026',
  carla: 'CarlaNunez#2026'
};

for (const [user, pwd] of Object.entries(passwords)) {
  console.log(`${user} (${pwd}) -> ${hashPassword(pwd)}`);
}
```

## File: backend/src/controllers/agendaController.js
```javascript
import { agendaService } from '../services/agendaService.js';

export const agendaController = {
  getAgenda(req, res, next) {
    try {
      const query = req.valid.query;
      const data = agendaService.getAgenda(query, req.user);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  getDashboard(req, res, next) {
    try {
      const data = agendaService.getDashboard(req.user);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
};
```

## File: backend/src/controllers/authController.js
```javascript
import { authService } from '../services/authService.js';
import { serializeCookie, parseCookies } from '../core/cookies.js';
import { config } from '../config/index.js';

export const authController = {
  async login(req, res, next) {
    try {
      const { correo, clave } = req.valid.body;
      const { token, usuario } = await authService.login(correo, clave);

      const cookieStr = serializeCookie(config.cookieName, token, {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/'
      });
      res.setHeader('Set-Cookie', cookieStr);

      res.json({
        mensaje: 'Inicio de sesión exitoso',
        usuario
      });
    } catch (err) {
      next(err);
    }
  },

  logout(req, res, next) {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies[config.cookieName];

      authService.logout(token, req.user?.id);

      const cookieStr = serializeCookie(config.cookieName, '', {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 0
      });
      res.setHeader('Set-Cookie', cookieStr);

      res.json({ mensaje: 'Sesión cerrada correctamente' });
    } catch (err) {
      next(err);
    }
  },

  me(req, res) {
    res.json({ usuario: req.user });
  },

  async changePassword(req, res, next) {
    try {
      const { clave_actual, clave_nueva } = req.valid.body;
      await authService.changePassword(req.user.id, clave_actual, clave_nueva);
      res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  }
};
```

## File: backend/src/controllers/especialidadController.js
```javascript
import { especialidadService } from '../services/especialidadService.js';

export const especialidadController = {
  list(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = especialidadService.list(filters, req.user);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron especialidades' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = especialidadService.getById(id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      const data = especialidadService.create(req.valid.body, req.user.id);
      res.status(201).json({
        mensaje: 'Especialidad creada exitosamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = especialidadService.update(id, req.valid.body, req.user.id);
      res.json({
        mensaje: 'Especialidad actualizada correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  deactivate(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = especialidadService.deactivate(id, req.user.id);
      res.json({
        mensaje: 'Especialidad desactivada correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  activate(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = especialidadService.activate(id, req.user.id);
      res.json({
        mensaje: 'Especialidad reactivada correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  }
};
```

## File: backend/src/controllers/pacienteController.js
```javascript
import { pacienteService } from '../services/pacienteService.js';

export const pacienteController = {
  list(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = pacienteService.list(filters);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron pacientes' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = pacienteService.getById(id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const result = await pacienteService.create(req.valid.body, req.user.id);
      res.status(201).json({
        mensaje: 'Paciente registrado exitosamente',
        data: result.paciente,
        clave_generada: result.clave_generada
      });
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = pacienteService.update(id, req.valid.body, req.user.id);
      res.json({
        mensaje: 'Paciente actualizado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  deactivate(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = pacienteService.deactivate(id, req.user.id);
      res.json({
        mensaje: 'Paciente desactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  activate(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = pacienteService.activate(id, req.user.id);
      res.json({
        mensaje: 'Paciente reactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { id } = req.valid.params;
      const result = await pacienteService.resetPassword(id, req.user.id);
      res.json({
        mensaje: 'Contraseña restablecida exitosamente',
        clave_generada: result.clave_generada
      });
    } catch (err) {
      next(err);
    }
  }
};
```

## File: backend/src/controllers/turnoController.js
```javascript
import { turnoService } from '../services/turnoService.js';

export const turnoController = {
  list(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = turnoService.list(filters, req.user);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron turnos registrados' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = turnoService.getById(id, req.user);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      const data = turnoService.create(req.valid.body, req.user);
      res.status(201).json({
        mensaje: 'Turno registrado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = turnoService.update(id, req.valid.body, req.user);
      res.json({
        mensaje: 'Turno actualizado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  cambiarEstado(req, res, next) {
    try {
      const { id } = req.valid.params;
      const { estado } = req.valid.body;
      const data = turnoService.cambiarEstado(id, estado, req.user);
      res.json({
        mensaje: `Estado de turno actualizado a ${estado}`,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  cancelar(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = turnoService.cancelar(id, req.user);
      res.json({
        mensaje: 'Turno cancelado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  getDisponibles(req, res, next) {
    try {
      const query = req.valid.query;
      const data = turnoService.getHorariosLibres(query);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se registran horarios libres para el criterio seleccionado' : undefined
      });
    } catch (err) {
      next(err);
    }
  }
};
```

## File: backend/src/controllers/userController.js
```javascript
import { userService } from '../services/userService.js';

export const userController = {
  listUsers(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = userService.listUsers(filters);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron usuarios' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getUserById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.getUserById(id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async createUser(req, res, next) {
    try {
      const { usuario, clave_generada } = await userService.createUser(req.valid.body, req.user.id);
      res.status(201).json({
        mensaje: 'Usuario creado exitosamente',
        data: usuario,
        clave_generada // Se expone una sola vez (D-10)
      });
    } catch (err) {
      next(err);
    }
  },

  updateUser(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.updateUser(id, req.valid.body, req.user.id);
      res.json({
        mensaje: 'Usuario actualizado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  deactivateUser(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.deactivateUser(id, req.user.id);
      res.json({
        mensaje: 'Usuario desactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  activateUser(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.activateUser(id, req.user.id);
      res.json({
        mensaje: 'Usuario reactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { id } = req.valid.params;
      const result = await userService.resetPassword(id, req.user.id);
      res.json({
        mensaje: 'Contraseña restablecida exitosamente',
        clave_generada: result.clave_generada
      });
    } catch (err) {
      next(err);
    }
  },

  // Profesionales
  listProfesionales(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = userService.listProfesionales(filters, req.user);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron profesionales' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getProfesionalById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.getProfesionalById(id, req.user);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  updateProfesional(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.updateProfesional(id, req.valid.body, req.user.id);
      res.json({
        mensaje: 'Profesional actualizado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  deactivateProfesional(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.deactivateProfesional(id, req.user.id);
      res.json({
        mensaje: 'Profesional desactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  activateProfesional(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.activateProfesional(id, req.user.id);
      res.json({
        mensaje: 'Profesional reactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  // Disponibilidad
  getDisponibilidad(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.getDisponibilidad(id, req.user);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se registran horarios de atención para el profesional' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  updateDisponibilidad(req, res, next) {
    try {
      const { id } = req.valid.params;
      const { franjas } = req.valid.body;
      const data = userService.updateDisponibilidad(id, franjas, req.user.id);
      res.json({
        mensaje: 'Disponibilidad horaria actualizada correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  }
};
```

## File: backend/src/core/cookies.js
```javascript
/**
 * Manejo minimalista de cookies sin dependencias externas.
 */

/**
 * Parsea el encabezado Cookie en un objeto clave-valor.
 * @param {string|undefined} cookieHeader
 * @returns {Record<string, string>}
 */
export function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      list[name] = decodeURIComponent(value);
    }
  });

  return list;
}

/**
 * Serializa una cookie HTTP.
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @returns {string}
 */
export function serializeCookie(name, val, options = {}) {
  let str = `${encodeURIComponent(name)}=${encodeURIComponent(val)}`;

  if (options.maxAge != null) {
    str += `; Max-Age=${Math.floor(options.maxAge)}`;
  }
  if (options.path) {
    str += `; Path=${options.path}`;
  } else {
    str += '; Path=/';
  }
  if (options.httpOnly) {
    str += '; HttpOnly';
  }
  if (options.sameSite) {
    str += `; SameSite=${options.sameSite}`;
  } else {
    str += '; SameSite=Lax';
  }
  if (options.secure) {
    str += '; Secure';
  }

  return str;
}
```

## File: backend/src/core/errorHandler.js
```javascript
import { AppError } from './errors.js';

/**
 * Middleware central de manejo de errores de Express 5.
 */
export function errorHandler(err, req, res, next) {
  // Manejo de errores de AppError conocidos
  if (err instanceof AppError) {
    const response = { error: err.message };
    if (err.campos) {
      response.campos = err.campos;
    }
    return res.status(err.statusCode).json(response);
  }

  // Manejo de errores de restricciones de SQLite (better-sqlite3)
  if (err && typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
    if (err.message.includes('ux_turno_slot_profesional') || err.message.includes('ux_turno_slot_paciente')) {
      return res.status(409).json({
        error: 'El horario dejó de estar disponible. Seleccione otro.'
      });
    }
    if (err.message.includes('ux_profesional_consultorio_clave')) {
      return res.status(409).json({
        error: 'El consultorio ingresado ya se encuentra asignado a otro profesional.',
        campos: { consultorio: 'Ya asignado' }
      });
    }
    if (err.message.includes('uq_usuario_correo')) {
      return res.status(409).json({
        error: 'El correo electrónico ya se encuentra registrado.',
        campos: { correo: 'Ya registrado' }
      });
    }
    if (err.message.includes('uq_paciente_dni')) {
      return res.status(409).json({
        error: 'El DNI ingresado ya se encuentra registrado en el sistema.',
        campos: { dni: 'Ya registrado' }
      });
    }
    if (err.message.includes('uq_profesional_matricula')) {
      return res.status(409).json({
        error: 'La matrícula ya se encuentra registrada en el sistema.',
        campos: { matricula: 'Ya registrada' }
      });
    }
    if (err.message.includes('uq_especialidad_nombre')) {
      return res.status(409).json({
        error: 'El nombre de la especialidad ya se encuentra registrado.',
        campos: { nombre: 'Ya registrado' }
      });
    }

    return res.status(409).json({
      error: 'Restricción de integridad o unicidad no superada.'
    });
  }

  // Error inesperado: loggear detalle internamente, pero no exponer trazas al cliente (RNFB-06)
  console.error('[Error no controlado]', err);
  return res.status(500).json({
    error: 'Error interno del servidor. Comuníquese con el administrador.'
  });
}
```

## File: backend/src/core/errors.js
```javascript
/**
 * Jerarquía de errores del dominio para el backend de Salud Turnos.
 */

export class AppError extends Error {
  /**
   * @param {string} message Mensaje para el usuario
   * @param {number} statusCode Código HTTP (400, 401, 403, 404, 409, 500)
   * @param {Record<string, string|string[]>} [campos] Mapa opcional de errores por campo
   */
  constructor(message, statusCode = 400, campos = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.campos = campos;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos', campos = {}) {
    super(message, 400, campos);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso no autorizado para este rol') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso', campos = undefined) {
    super(message, 409, campos);
  }
}
```

## File: backend/src/core/passwords.js
```javascript
import crypto from 'node:crypto';
import { config } from '../config/index.js';

/**
 * Genera un hash seguro con sal aleatoria usando crypto.scrypt.
 * Formato: scrypt$N$r$p$saltHex$keyHex
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    const { n, r, p, keyLen } = config.scrypt;
    crypto.scrypt(password, salt, keyLen, { N: n, r, p }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt$${n}$${r}$${p}$${salt.toString('hex')}$${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifica una contraseña contra un hash almacenado de forma segura contra timing attacks.
 * @param {string} password
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  return new Promise((resolve) => {
    if (!storedHash || !storedHash.startsWith('scrypt$')) {
      return resolve(false);
    }

    const parts = storedHash.split('$');
    if (parts.length !== 6) return resolve(false);

    const [, nStr, rStr, pStr, saltHex, keyHex] = parts;
    const n = parseInt(nStr, 10);
    const r = parseInt(rStr, 10);
    const p = parseInt(pStr, 10);
    const salt = Buffer.from(saltHex, 'hex');
    const key = Buffer.from(keyHex, 'hex');

    crypto.scrypt(password, salt, key.length, { N: n, r, p }, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        resolve(crypto.timingSafeEqual(key, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Genera una contraseña segura que cumple la política D-08 (≥ 8 caracteres, mayúscula, minúscula y caracter especial).
 * @returns {string}
 */
export function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '#$@!%*?&';
  const all = upper + lower + digits + special;

  const chars = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)]
  ];

  while (chars.length < 12) {
    chars.push(all[crypto.randomInt(all.length)]);
  }

  // Mezclar array usando Fisher-Yates
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
```

## File: backend/src/core/text.js
```javascript
/**
 * Utilidades de manipulación y normalización de texto.
 */

/**
 * Normaliza un texto: elimina tildes/acentos, convierte a minúsculas y recorta espacios extremos.
 * @param {string|null|undefined} str
 * @returns {string}
 */
export function normalizar(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Genera la clave única de un consultorio:
 * Normaliza y elimina TODOS los espacios internos.
 * Ejemplo: "Consultorio 1" -> "consultorio1" === "consultorio1" (D-18)
 * @param {string|null|undefined} str
 * @returns {string|null}
 */
export function claveConsultorio(str) {
  if (!str) return null;
  const norm = normalizar(str).replace(/\s+/g, '');
  return norm.length > 0 ? norm : null;
}

/**
 * Escapa caracteres comodín para búsquedas seguras con LIKE (... ESCAPE '\').
 * @param {string} str
 * @returns {string}
 */
export function escapeLike(str) {
  if (!str) return '';
  return String(str).replace(/([%_\\])/g, '\\$1');
}
```

## File: backend/src/core/time.js
```javascript
import { config } from '../config/index.js';

const DIAS_MAP = {
  0: 'DOMINGO',
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO'
};

/**
 * Retorna la fecha y hora actual en zona horaria de Argentina (America/Argentina/Buenos_Aires).
 * @returns {{ fecha: string, hora: string, fechaHora: string, diaSemana: string }}
 */
export function getNowInArgentina() {
  const now = new Date();

  // YYYY-MM-DD
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  // HH:MM:SS
  const horaConSegundos = new Intl.DateTimeFormat('es-AR', {
    timeZone: config.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  const hora = horaConSegundos.slice(0, 5);

  // Determinar día de la semana en la zona horaria de Argentina
  // Creamos una fecha local a partir del string YYYY-MM-DD
  const [y, m, d] = fecha.split('-').map(Number);
  const localDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const diaSemana = DIAS_MAP[localDate.getUTCDay()];

  return {
    fecha,
    hora,
    fechaHora: `${fecha} ${horaConSegundos}`,
    diaSemana
  };
}

/**
 * Obtiene el nombre del día de la semana para una fecha dada (YYYY-MM-DD).
 * @param {string} fechaStr Formato YYYY-MM-DD
 * @returns {string} LUNES..DOMINGO
 */
export function getDiaSemana(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const localDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return DIAS_MAP[localDate.getUTCDay()];
}

/**
 * Convierte un horario HH:MM a minutos desde las 00:00.
 * @param {string} horaStr
 * @returns {number}
 */
export function horaToMinutos(horaStr) {
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convierte minutos desde las 00:00 a string HH:MM.
 * @param {number} minutos
 * @returns {string}
 */
export function minutosToHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Compara dos momentos fecha + hora (YYYY-MM-DD HH:MM).
 * @returns {number} Negativo si dt1 < dt2, 0 si son iguales, positivo si dt1 > dt2
 */
export function compareDateTime(fecha1, hora1, fecha2, hora2) {
  const dt1 = `${fecha1} ${hora1}`;
  const dt2 = `${fecha2} ${hora2}`;
  return dt1.localeCompare(dt2);
}
```

## File: backend/src/db/connection.js
```javascript
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/index.js';
import { normalizar } from '../core/text.js';

let dbInstance = null;

/**
 * Obtiene o crea la conexión a SQLite con WAL mode, Foreign Keys y función personalizada de normalización.
 * @param {string} [customPath] Ruta opcional para pruebas o memoria
 * @returns {import('better-sqlite3').Database}
 */
export function getDb(customPath) {
  const isNewPath = customPath && dbInstance && dbInstance.name !== customPath;
  if (dbInstance && !customPath && !isNewPath) {
    return dbInstance;
  }

  if (isNewPath) {
    try {
      dbInstance.close();
    } catch {}
    dbInstance = null;
  }

  const dbPath = customPath || config.dbPath;

  // Asegurar que el directorio contenedor exista si no es en memoria
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);

  // Configuraciones de rendimiento y robustez
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Registrar función SQL determinística 'normalizar' para búsquedas insensibles a tildes/mayúsculas
  db.function('normalizar', { deterministic: true }, (str) => {
    return normalizar(str);
  });

  dbInstance = db;
  return db;
}

/**
 * Cierra la instancia global de base de datos si existe.
 */
export function closeDb() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
}
```

## File: backend/src/db/export.sql
```sql
-- =====================================================================
-- EXPORTACIÓN COMPLETA DE BASE DE DATOS - SISTEMA SALUD TURNOS (TP3)
-- Generado automáticamente: 2026-11-11T17:25:58.811Z
-- =====================================================================

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS usuario;
CREATE TABLE usuario (
  id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  correo TEXT NOT NULL COLLATE NOCASE,
  clave_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL', 'PACIENTE')),
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT uq_usuario_correo UNIQUE (correo)
);

DROP TABLE IF EXISTS sesion;
CREATE TABLE sesion (
  id_sesion TEXT PRIMARY KEY, -- SHA-256 del token aleatorio en cookie
  id_usuario INTEGER NOT NULL,
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  ultima_actividad TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT uq_sesion_usuario UNIQUE (id_usuario) -- Previene sesiones simultáneas por usuario
);

DROP TABLE IF EXISTS especialidad;
CREATE TABLE especialidad (
  id_especialidad INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL COLLATE NOCASE,
  descripcion TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT uq_especialidad_nombre UNIQUE (nombre)
);

DROP TABLE IF EXISTS profesional;
CREATE TABLE profesional (
  id_profesional INTEGER PRIMARY KEY AUTOINCREMENT,
  id_especialidad INTEGER NOT NULL,
  id_usuario INTEGER UNIQUE,
  matricula TEXT NOT NULL CHECK(length(matricula) = 5 AND matricula GLOB '[0-9][0-9][0-9][0-9][0-9]'),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  consultorio TEXT,
  consultorio_clave TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT fk_profesional_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad),
  CONSTRAINT fk_profesional_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  CONSTRAINT uq_profesional_matricula UNIQUE (matricula)
);

DROP TABLE IF EXISTS disponibilidad;
CREATE TABLE disponibilidad (
  id_disponibilidad INTEGER PRIMARY KEY AUTOINCREMENT,
  id_profesional INTEGER NOT NULL,
  dia_semana TEXT NOT NULL CHECK(dia_semana IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
  hora_inicio TEXT NOT NULL CHECK(hora_inicio GLOB '[0-2][0-9]:[0-5][0-9]'),
  hora_fin TEXT NOT NULL CHECK(hora_fin GLOB '[0-2][0-9]:[0-5][0-9]'),
  duracion_min INTEGER NOT NULL DEFAULT 30 CHECK(duracion_min = 30),
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT fk_disponibilidad_profesional FOREIGN KEY (id_profesional) REFERENCES profesional(id_profesional) ON DELETE CASCADE,
  CONSTRAINT ck_disponibilidad_horario CHECK(hora_inicio < hora_fin)
);

DROP TABLE IF EXISTS paciente;
CREATE TABLE paciente (
  id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER NOT NULL UNIQUE,
  dni TEXT NOT NULL CHECK(length(dni) BETWEEN 7 AND 8 AND dni GLOB '[0-9]*'),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT CHECK(telefono IS NULL OR (length(telefono) <= 12 AND telefono GLOB '[0-9]*')),
  correo TEXT NOT NULL COLLATE NOCASE,
  fecha_nacimiento TEXT CHECK(fecha_nacimiento IS NULL OR (fecha_nacimiento GLOB '[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]' AND fecha_nacimiento >= '1900-01-01')),
  obra_social TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT fk_paciente_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  CONSTRAINT uq_paciente_dni UNIQUE (dni),
  CONSTRAINT uq_paciente_correo UNIQUE (correo)
);

DROP TABLE IF EXISTS turno;
CREATE TABLE turno (
  id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
  id_paciente INTEGER NOT NULL,
  id_profesional INTEGER NOT NULL,
  fecha TEXT NOT NULL CHECK(fecha GLOB '[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  hora TEXT NOT NULL CHECK(hora GLOB '[0-2][0-9]:[0-5][0-9]' AND (hora LIKE '%:00' OR hora LIKE '%:30')),
  estado TEXT NOT NULL CHECK(estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_CONSULTORIO', 'ASISTIDO', 'AUSENTE', 'CANCELADO')),
  motivo_consulta TEXT,
  observaciones TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  fecha_hora_llegada TEXT,
  creado_por INTEGER,
  cancelado_por INTEGER,
  fecha_cancelacion TEXT,
  CONSTRAINT fk_turno_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
  CONSTRAINT fk_turno_profesional FOREIGN KEY (id_profesional) REFERENCES profesional(id_profesional),
  CONSTRAINT fk_turno_creador FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario),
  CONSTRAINT fk_turno_cancelador FOREIGN KEY (cancelado_por) REFERENCES usuario(id_usuario)
);

DROP TABLE IF EXISTS auditoria;
CREATE TABLE auditoria (
  id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER, -- NULL representa acciones del SISTEMA (ej: pase automático a AUSENTE)
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  id_entidad INTEGER,
  datos_antes TEXT, -- JSON
  datos_despues TEXT, -- JSON
  fecha TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE UNIQUE INDEX ux_profesional_consultorio_clave
  ON profesional(consultorio_clave) WHERE consultorio_clave IS NOT NULL AND estado = 1;
CREATE UNIQUE INDEX ux_turno_slot_profesional
  ON turno(id_profesional, fecha, hora) WHERE estado <> 'CANCELADO';
CREATE UNIQUE INDEX ux_turno_slot_paciente
  ON turno(id_paciente, fecha, hora) WHERE estado <> 'CANCELADO';
CREATE INDEX idx_auditoria_entidad ON auditoria(entidad, id_entidad);

-- Datos de usuario
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (1, 'Administrador', 'General', 'admin@saludturnos.com', 'scrypt$16384$8$1$57ee8c0debed376a2304352910071d36$0754af89fa3c9651138dc193feaa07e76b42f4c521b1a5b1b62e5e5271514bd471994b7ea0ec07aa95db14aa6b341cd4dc67df9530cbff671ff23498d718b7bd', 'ADMINISTRADOR', 1, '2026-11-11 14:25:50');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (2, 'María', 'Recepcionista', 'recepcion@saludturnos.com', 'scrypt$16384$8$1$e54cea18e350330cf62f879e8f1385d2$3cd3d578066f99d7100a7ec9da1e030796d4b2d45a7b4e2a65c5ae3293ea3bf6add7ffd3c6e8bfdf3d51dff43db6073db01777676e80c79f8528ebe408dda361', 'RECEPCIONISTA', 1, '2026-11-11 14:25:50');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (3, 'Laura', 'Gómez', 'laura.gomez@saludturnos.com', 'scrypt$16384$8$1$8839b34222dbae7f5cc5e21ec4201b0e$73099685ae2390fbcc913a680ddff39142332a12318f7f8eff6fbb799859f086e129f2903bc8dfbd7dc8019b2ab9568177a3cf61d910e2b6583522aefe4cfe51', 'PROFESIONAL', 1, '2026-11-11 14:25:50');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (4, 'Martín', 'Pérez', 'martin.perez@saludturnos.com', 'scrypt$16384$8$1$4297f15e54f0f32c6db56c73fe32dca1$616186c6032b9da9f1c643e7186da808dd1b057110b87d7f7a6b89048b28c2c48c8eaf23f71745653ce9693ef88331ee6b024b4655e7bd1a24561fa701d5c28b', 'PROFESIONAL', 1, '2026-11-11 14:25:50');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (5, 'Carla', 'Núñez', 'carla.nunez@saludturnos.com', 'scrypt$16384$8$1$1abd1dd59b7c39901b8b866782bef84d$e932eb0c6c6eb736e345349dcf928eb2ecc63a70d18b5791119032f17f2276a47ceed40d6302f84715e9cf054b464d1b50f015fcd42ce686bbc07d52263bc135', 'PROFESIONAL', 1, '2026-11-11 14:25:50');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (6, 'Ana', 'López', 'ana@email.com', 'scrypt$16384$8$1$85f8f96f8ab4ff48ca0ca547583c9ab7$8d8419914dae9e7625873e7899eeed072e8d47b0355a3b85c9de5ddb11297fb4ca0bd79ef4d5dbc34bd8498a62d5a48904c5904e588018b6ab37280a41b6992d', 'PACIENTE', 1, '2026-11-11 14:25:50');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (7, 'Luis', 'Díaz', 'luis@email.com', 'scrypt$16384$8$1$f840e391e0568d81dc0f96408794bc36$f840d8ce1a74155d699e2a734c166d52d082d57d63a2b0e5a85f7b6f88627f639ed6c9c9522e87ced36c287e75eac84a166d0e80bb86d73e3622d1a0c248fe7e', 'PACIENTE', 1, '2026-11-11 14:25:50');

-- Datos de especialidad
INSERT INTO especialidad (id_especialidad, nombre, descripcion, estado) VALUES (1, 'Clínica médica', 'Atención integral del adulto y medicina clínica general', 1);
INSERT INTO especialidad (id_especialidad, nombre, descripcion, estado) VALUES (2, 'Pediatría', 'Atención médica integral a niños y adolescentes', 1);
INSERT INTO especialidad (id_especialidad, nombre, descripcion, estado) VALUES (3, 'Cardiología', 'Diagnóstico y tratamiento de enfermedades del corazón y vasculares', 1);

-- Datos de profesional
INSERT INTO profesional (id_profesional, id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado) VALUES (1, 1, 3, '10001', 'Laura', 'Gómez', '101', '101', 1);
INSERT INTO profesional (id_profesional, id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado) VALUES (2, 2, 4, '10002', 'Martín', 'Pérez', '102', '102', 1);
INSERT INTO profesional (id_profesional, id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado) VALUES (3, 3, 5, '10003', 'Carla', 'Núñez', '103', '103', 1);

-- Datos de disponibilidad
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (1, 1, 'LUNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (2, 1, 'MARTES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (3, 1, 'MIERCOLES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (4, 1, 'JUEVES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (5, 1, 'VIERNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (6, 2, 'LUNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (7, 2, 'MARTES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (8, 2, 'MIERCOLES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (9, 2, 'JUEVES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (10, 2, 'VIERNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (11, 3, 'LUNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (12, 3, 'MARTES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (13, 3, 'MIERCOLES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (14, 3, 'JUEVES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (15, 3, 'VIERNES', '08:00', '12:00', 30, 1);

-- Datos de paciente
INSERT INTO paciente (id_paciente, id_usuario, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado) VALUES (1, 6, '30111222', 'Ana', 'López', '3764111111', 'ana@email.com', '1985-04-12', 'OSDE', 1);
INSERT INTO paciente (id_paciente, id_usuario, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado) VALUES (2, 7, '28777444', 'Luis', 'Díaz', '3765222222', 'luis@email.com', '1981-09-23', 'Swiss Medical', 1);

-- Datos de turno
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (1, 1, 1, '2026-10-06', '09:00', 'CONFIRMADO', 'Control', NULL, '2026-11-11 14:25:50', NULL, 1, NULL, NULL);
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (2, 2, 2, '2026-10-06', '09:30', 'PENDIENTE', 'Consulta', NULL, '2026-11-11 14:25:50', NULL, 1, NULL, NULL);
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (3, 1, 1, '2026-11-11', '10:00', 'CONFIRMADO', 'Seguimiento de tratamiento', NULL, '2026-11-11 14:25:50', NULL, 1, NULL, NULL);
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (4, 2, 2, '2026-11-11', '11:00', 'PENDIENTE', 'Control pediátrico semestral', NULL, '2026-11-11 14:25:50', NULL, 1, NULL, NULL);
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (5, 1, 3, '2026-11-12', '09:30', 'CONFIRMADO', 'Electrocardiograma de rutina', NULL, '2026-11-11 14:25:50', NULL, 1, NULL, NULL);
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (6, 2, 1, '2026-11-13', '10:30', 'PENDIENTE', 'Consulta médica general', NULL, '2026-11-11 14:25:50', NULL, 1, NULL, NULL);

-- Datos de auditoria
INSERT INTO auditoria (id_auditoria, id_usuario, accion, entidad, id_entidad, datos_antes, datos_despues, fecha) VALUES (1, 1, 'INICIALIZACION', 'SISTEMA', NULL, NULL, '{"mensaje": "Base de datos inicializada con datos semilla"}', '2026-11-11 14:25:50');

PRAGMA foreign_keys = ON;
```

## File: backend/src/db/schema.sql
```sql
-- =====================================================================
-- Esquema de Base de Datos - Sistema Salud Turnos (TP1 + Ampliaciones TP3)
-- Motor: SQLite (better-sqlite3)
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. Tabla de Usuarios (Administración y control de acceso)
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  correo TEXT NOT NULL COLLATE NOCASE,
  clave_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL', 'PACIENTE')),
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT uq_usuario_correo UNIQUE (correo)
);

-- 2. Tabla de Sesiones (Ampliación TP3: gestión de sesiones sin JWT, una sola sesión activa)
CREATE TABLE IF NOT EXISTS sesion (
  id_sesion TEXT PRIMARY KEY, -- SHA-256 del token aleatorio en cookie
  id_usuario INTEGER NOT NULL,
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  ultima_actividad TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT uq_sesion_usuario UNIQUE (id_usuario) -- Previene sesiones simultáneas por usuario
);

-- 3. Tabla de Especialidades Médicas
CREATE TABLE IF NOT EXISTS especialidad (
  id_especialidad INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL COLLATE NOCASE,
  descripcion TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT uq_especialidad_nombre UNIQUE (nombre)
);

-- 4. Tabla de Profesionales Médicos
-- Nota TP3: consultorio pasa a ser NULLABLE para poder liberarlo antes de la baja lógica (Q10).
-- consultorio_clave almacena el consultorio sin espacios ni tildes en minúsculas para unicidad exacta.
CREATE TABLE IF NOT EXISTS profesional (
  id_profesional INTEGER PRIMARY KEY AUTOINCREMENT,
  id_especialidad INTEGER NOT NULL,
  id_usuario INTEGER UNIQUE,
  matricula TEXT NOT NULL CHECK(length(matricula) = 5 AND matricula GLOB '[0-9][0-9][0-9][0-9][0-9]'),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  consultorio TEXT,
  consultorio_clave TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT fk_profesional_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad),
  CONSTRAINT fk_profesional_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  CONSTRAINT uq_profesional_matricula UNIQUE (matricula)
);

-- Índice único parcial para consultorio: dos profesionales no pueden tener el mismo consultorio
CREATE UNIQUE INDEX IF NOT EXISTS ux_profesional_consultorio_clave
  ON profesional(consultorio_clave) WHERE consultorio_clave IS NOT NULL AND estado = 1;

-- 5. Tabla de Disponibilidad (Agenda semanal por profesional)
CREATE TABLE IF NOT EXISTS disponibilidad (
  id_disponibilidad INTEGER PRIMARY KEY AUTOINCREMENT,
  id_profesional INTEGER NOT NULL,
  dia_semana TEXT NOT NULL CHECK(dia_semana IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
  hora_inicio TEXT NOT NULL CHECK(hora_inicio GLOB '[0-2][0-9]:[0-5][0-9]'),
  hora_fin TEXT NOT NULL CHECK(hora_fin GLOB '[0-2][0-9]:[0-5][0-9]'),
  duracion_min INTEGER NOT NULL DEFAULT 30 CHECK(duracion_min = 30),
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT fk_disponibilidad_profesional FOREIGN KEY (id_profesional) REFERENCES profesional(id_profesional) ON DELETE CASCADE,
  CONSTRAINT ck_disponibilidad_horario CHECK(hora_inicio < hora_fin)
);

-- 6. Tabla de Pacientes (Ampliación TP4: vinculación obligatoria 1:1 con usuario rol PACIENTE)
CREATE TABLE IF NOT EXISTS paciente (
  id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER NOT NULL UNIQUE,
  dni TEXT NOT NULL CHECK(length(dni) BETWEEN 7 AND 8 AND dni GLOB '[0-9]*'),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT CHECK(telefono IS NULL OR (length(telefono) <= 12 AND telefono GLOB '[0-9]*')),
  correo TEXT NOT NULL COLLATE NOCASE,
  fecha_nacimiento TEXT CHECK(fecha_nacimiento IS NULL OR (fecha_nacimiento GLOB '[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]' AND fecha_nacimiento >= '1900-01-01')),
  obra_social TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT fk_paciente_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  CONSTRAINT uq_paciente_dni UNIQUE (dni),
  CONSTRAINT uq_paciente_correo UNIQUE (correo)
);

-- 7. Tabla de Turnos
CREATE TABLE IF NOT EXISTS turno (
  id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
  id_paciente INTEGER NOT NULL,
  id_profesional INTEGER NOT NULL,
  fecha TEXT NOT NULL CHECK(fecha GLOB '[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  hora TEXT NOT NULL CHECK(hora GLOB '[0-2][0-9]:[0-5][0-9]' AND (hora LIKE '%:00' OR hora LIKE '%:30')),
  estado TEXT NOT NULL CHECK(estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_CONSULTORIO', 'ASISTIDO', 'AUSENTE', 'CANCELADO')),
  motivo_consulta TEXT,
  observaciones TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  fecha_hora_llegada TEXT,
  creado_por INTEGER,
  cancelado_por INTEGER,
  fecha_cancelacion TEXT,
  CONSTRAINT fk_turno_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
  CONSTRAINT fk_turno_profesional FOREIGN KEY (id_profesional) REFERENCES profesional(id_profesional),
  CONSTRAINT fk_turno_creador FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario),
  CONSTRAINT fk_turno_cancelador FOREIGN KEY (cancelado_por) REFERENCES usuario(id_usuario)
);

-- Índices de seguridad para concurrencia e integridad (RNF-04 y D-27)
CREATE UNIQUE INDEX IF NOT EXISTS ux_turno_slot_profesional
  ON turno(id_profesional, fecha, hora) WHERE estado <> 'CANCELADO';

CREATE UNIQUE INDEX IF NOT EXISTS ux_turno_slot_paciente
  ON turno(id_paciente, fecha, hora) WHERE estado <> 'CANCELADO';

-- 8. Tabla de Auditoría (Ampliación TP3: trazabilidad obligatoria según D-41)
CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER, -- NULL representa acciones del SISTEMA (ej: pase automático a AUSENTE)
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  id_entidad INTEGER,
  datos_antes TEXT, -- JSON
  datos_despues TEXT, -- JSON
  fecha TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad, id_entidad);
```

## File: backend/src/db/seed.sql
```sql
-- =====================================================================
-- Datos Iniciales / Semilla - Sistema Salud Turnos
-- Incluye: datos del Front-End TP2 normalizados, profesionales con consultorio,
-- agendas de 08:00 a 12:00, usuario admin, recepcionista y profesionales vinculados.
-- =====================================================================

-- 1. Usuarios
-- Contraseñas según política (D-08):
-- admin: SaludTurnos#2026
-- recepcion: Recepcion#2026
-- laura: LauraGomez#2026
-- martin: MartinPerez#2026
-- carla: CarlaNunez#2026
-- ana: AnaLopez#2026
-- luis: LuisDiaz#2026

INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado) VALUES
  (1, 'Administrador', 'General', 'admin@saludturnos.com', 'scrypt$16384$8$1$57ee8c0debed376a2304352910071d36$0754af89fa3c9651138dc193feaa07e76b42f4c521b1a5b1b62e5e5271514bd471994b7ea0ec07aa95db14aa6b341cd4dc67df9530cbff671ff23498d718b7bd', 'ADMINISTRADOR', 1),
  (2, 'María', 'Recepcionista', 'recepcion@saludturnos.com', 'scrypt$16384$8$1$e54cea18e350330cf62f879e8f1385d2$3cd3d578066f99d7100a7ec9da1e030796d4b2d45a7b4e2a65c5ae3293ea3bf6add7ffd3c6e8bfdf3d51dff43db6073db01777676e80c79f8528ebe408dda361', 'RECEPCIONISTA', 1),
  (3, 'Laura', 'Gómez', 'laura.gomez@saludturnos.com', 'scrypt$16384$8$1$8839b34222dbae7f5cc5e21ec4201b0e$73099685ae2390fbcc913a680ddff39142332a12318f7f8eff6fbb799859f086e129f2903bc8dfbd7dc8019b2ab9568177a3cf61d910e2b6583522aefe4cfe51', 'PROFESIONAL', 1),
  (4, 'Martín', 'Pérez', 'martin.perez@saludturnos.com', 'scrypt$16384$8$1$4297f15e54f0f32c6db56c73fe32dca1$616186c6032b9da9f1c643e7186da808dd1b057110b87d7f7a6b89048b28c2c48c8eaf23f71745653ce9693ef88331ee6b024b4655e7bd1a24561fa701d5c28b', 'PROFESIONAL', 1),
  (5, 'Carla', 'Núñez', 'carla.nunez@saludturnos.com', 'scrypt$16384$8$1$1abd1dd59b7c39901b8b866782bef84d$e932eb0c6c6eb736e345349dcf928eb2ecc63a70d18b5791119032f17f2276a47ceed40d6302f84715e9cf054b464d1b50f015fcd42ce686bbc07d52263bc135', 'PROFESIONAL', 1),
  (6, 'Ana', 'López', 'ana@email.com', 'scrypt$16384$8$1$85f8f96f8ab4ff48ca0ca547583c9ab7$8d8419914dae9e7625873e7899eeed072e8d47b0355a3b85c9de5ddb11297fb4ca0bd79ef4d5dbc34bd8498a62d5a48904c5904e588018b6ab37280a41b6992d', 'PACIENTE', 1),
  (7, 'Luis', 'Díaz', 'luis@email.com', 'scrypt$16384$8$1$f840e391e0568d81dc0f96408794bc36$f840d8ce1a74155d699e2a734c166d52d082d57d63a2b0e5a85f7b6f88627f639ed6c9c9522e87ced36c287e75eac84a166d0e80bb86d73e3622d1a0c248fe7e', 'PACIENTE', 1);

-- 2. Especialidades
INSERT INTO especialidad (id_especialidad, nombre, descripcion, estado) VALUES
  (1, 'Clínica médica', 'Atención integral del adulto y medicina clínica general', 1),
  (2, 'Pediatría', 'Atención médica integral a niños y adolescentes', 1),
  (3, 'Cardiología', 'Diagnóstico y tratamiento de enfermedades del corazón y vasculares', 1);

-- 3. Profesionales
INSERT INTO profesional (id_profesional, id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado) VALUES
  (1, 1, 3, '10001', 'Laura', 'Gómez', '101', '101', 1),
  (2, 2, 4, '10002', 'Martín', 'Pérez', '102', '102', 1),
  (3, 3, 5, '10003', 'Carla', 'Núñez', '103', '103', 1);

-- 4. Disponibilidad (Lunes a Viernes de 08:00 a 12:00)
-- Profesional 1 (Laura Gómez)
INSERT INTO disponibilidad (id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES
  (1, 'LUNES', '08:00', '12:00', 30, 1),
  (1, 'MARTES', '08:00', '12:00', 30, 1),
  (1, 'MIERCOLES', '08:00', '12:00', 30, 1),
  (1, 'JUEVES', '08:00', '12:00', 30, 1),
  (1, 'VIERNES', '08:00', '12:00', 30, 1);

-- Profesional 2 (Martín Pérez)
INSERT INTO disponibilidad (id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES
  (2, 'LUNES', '08:00', '12:00', 30, 1),
  (2, 'MARTES', '08:00', '12:00', 30, 1),
  (2, 'MIERCOLES', '08:00', '12:00', 30, 1),
  (2, 'JUEVES', '08:00', '12:00', 30, 1),
  (2, 'VIERNES', '08:00', '12:00', 30, 1);

-- Profesional 3 (Carla Núñez)
INSERT INTO disponibilidad (id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES
  (3, 'LUNES', '08:00', '12:00', 30, 1),
  (3, 'MARTES', '08:00', '12:00', 30, 1),
  (3, 'MIERCOLES', '08:00', '12:00', 30, 1),
  (3, 'JUEVES', '08:00', '12:00', 30, 1),
  (3, 'VIERNES', '08:00', '12:00', 30, 1);

-- 5. Pacientes (conservando datos de TP2, vinculados 1:1 con sus cuentas de usuario de rol PACIENTE)
INSERT INTO paciente (id_paciente, id_usuario, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado) VALUES
  (1, 6, '30111222', 'Ana', 'López', '3764111111', 'ana@email.com', '1985-04-12', 'OSDE', 1),
  (2, 7, '28777444', 'Luis', 'Díaz', '3765222222', 'luis@email.com', '1981-09-23', 'Swiss Medical', 1);

-- 6. Turnos históricos (2026-10-06)
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, creado_por) VALUES
  (1, 1, 1, '2026-10-06', '09:00', 'CONFIRMADO', 'Control', 1),
  (2, 2, 2, '2026-10-06', '09:30', 'PENDIENTE', 'Consulta', 1);

-- Turnos activos actuales y futuros para demostración en Panel, Agenda y Turnos
INSERT INTO turno (id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, creado_por) VALUES
  (1, 1, date('now', 'localtime', 'weekday 3'), '10:00', 'CONFIRMADO', 'Seguimiento de tratamiento', 1),
  (2, 2, date('now', 'localtime', 'weekday 3'), '11:00', 'PENDIENTE', 'Control pediátrico semestral', 1),
  (1, 3, date('now', 'localtime', 'weekday 4'), '09:30', 'CONFIRMADO', 'Electrocardiograma de rutina', 1),
  (2, 1, date('now', 'localtime', 'weekday 5'), '10:30', 'PENDIENTE', 'Consulta médica general', 1);

-- 7. Registro de auditoría inicial
INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, datos_despues) VALUES
  (1, 'INICIALIZACION', 'SISTEMA', NULL, '{"mensaje": "Base de datos inicializada con datos semilla"}');
```

## File: backend/src/middleware/auth.js
```javascript
import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';
import { parseCookies } from '../core/cookies.js';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../core/errors.js';

/**
 * Middleware que verifica la sesión activa del usuario a través de cookie HttpOnly.
 * Vincula a req.user los datos esenciales del usuario autenticado.
 */
export function requireAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[config.cookieName];

  if (!token) {
    return next(new UnauthorizedError('Sesión no iniciada o inválida'));
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const db = getDb();

  const row = db.prepare(`
    SELECT 
      s.id_sesion,
      u.id_usuario,
      u.nombre,
      u.apellido,
      u.correo,
      u.rol,
      u.estado,
      p.id_profesional,
      pac.id_paciente,
      pac.dni AS paciente_dni
    FROM sesion s
    JOIN usuario u ON s.id_usuario = u.id_usuario
    LEFT JOIN profesional p ON p.id_usuario = u.id_usuario AND p.estado = 1
    LEFT JOIN paciente pac ON pac.id_usuario = u.id_usuario AND pac.estado = 1
    WHERE s.id_sesion = ?
  `).get(tokenHash);

  if (!row || !row.estado) {
    // Si la sesión no existe o el usuario está inactivo, rechazar
    return next(new UnauthorizedError('Sesión no válida o usuario inactivo'));
  }

  // Actualizar última actividad
  try {
    db.prepare(`
      UPDATE sesion 
      SET ultima_actividad = DATETIME('now', 'localtime') 
      WHERE id_sesion = ?
    `).run(tokenHash);
  } catch {
    // Ignorar fallo no crítico de actualización de timestamp
  }

  req.user = {
    id: row.id_usuario,
    nombre: row.nombre,
    apellido: row.apellido,
    correo: row.correo,
    rol: row.rol,
    id_profesional: row.id_profesional || null,
    id_paciente: row.id_paciente || null,
    dni: row.paciente_dni || null
  };

  next();
}
```

## File: backend/src/middleware/roles.js
```javascript
import { ForbiddenError, UnauthorizedError } from '../core/errors.js';

/**
 * Middleware de autorización por rol.
 * Si el usuario es ADMINISTRADOR, tiene permiso irrestricto (superusuario D-05).
 * @param  {...string} rolesPermitidos Roles que pueden acceder
 */
export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuario no autenticado'));
    }

    if (req.user.rol === 'ADMINISTRADOR') {
      return next();
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(new ForbiddenError('No posee los permisos necesarios para realizar esta acción'));
    }

    next();
  };
}
```

## File: backend/src/middleware/validate.js
```javascript
import { ValidationError } from '../core/errors.js';

/**
 * Middleware de validación con Zod para req.body, req.params y req.query.
 * Los datos validados y transformados se asignan a req.valid.
 * @param {{ body?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny }} schemas
 */
export function validate(schemas) {
  return (req, res, next) => {
    req.valid = req.valid || {};
    const fieldErrors = {};

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        Object.assign(fieldErrors, result.error.flatten().fieldErrors);
        if (result.error.flatten().formErrors?.length) {
          fieldErrors._params = result.error.flatten().formErrors;
        }
      } else {
        req.valid.params = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        Object.assign(fieldErrors, result.error.flatten().fieldErrors);
        if (result.error.flatten().formErrors?.length) {
          fieldErrors._query = result.error.flatten().formErrors;
        }
      } else {
        req.valid.query = result.data;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        Object.assign(fieldErrors, result.error.flatten().fieldErrors);
        if (result.error.flatten().formErrors?.length) {
          fieldErrors._body = result.error.flatten().formErrors;
        }
      } else {
        req.valid.body = result.data;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      // Normalizar mensajes para que sean strings directos
      const campos = {};
      for (const [campo, errs] of Object.entries(fieldErrors)) {
        campos[campo] = Array.isArray(errs) ? errs[0] : String(errs);
      }
      return next(new ValidationError('Datos de entrada inválidos', campos));
    }

    next();
  };
}
```

## File: backend/src/repositories/especialidadRepository.js
```javascript
import { getDb } from '../db/connection.js';
import { escapeLike } from '../core/text.js';

export const especialidadRepository = {
  findAll({ nombre, estado }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (nombre) {
      conditions.push("normalizar(nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(nombre));
    }

    if (estado !== undefined && estado !== 'todos') {
      conditions.push('estado = ?');
      params.push(Number(estado));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id_especialidad, nombre, descripcion, estado
      FROM especialidad
      ${where}
      ORDER BY nombre ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT id_especialidad, nombre, descripcion, estado
      FROM especialidad
      WHERE id_especialidad = ?
    `).get(id);
  },

  findByNombre(nombre, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare(`
        SELECT id_especialidad, nombre, estado
        FROM especialidad
        WHERE normalizar(nombre) = normalizar(?) AND id_especialidad <> ?
      `).get(nombre, excludeId);
    }
    return db.prepare(`
      SELECT id_especialidad, nombre, estado
      FROM especialidad
      WHERE normalizar(nombre) = normalizar(?)
    `).get(nombre);
  },

  create({ nombre, descripcion }) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO especialidad (nombre, descripcion, estado)
      VALUES (?, ?, 1)
    `).run(nombre, descripcion || null);

    return result.lastInsertRowid;
  },

  update(id, { nombre, descripcion }) {
    const db = getDb();
    db.prepare(`
      UPDATE especialidad
      SET nombre = ?, descripcion = ?
      WHERE id_especialidad = ?
    `).run(nombre, descripcion || null, id);
  },

  setEstado(id, estado) {
    const db = getDb();
    db.prepare(`
      UPDATE especialidad
      SET estado = ?
      WHERE id_especialidad = ?
    `).run(estado, id);
  },

  countActiveProfesionales(idEspecialidad) {
    const db = getDb();
    const row = db.prepare(`
      SELECT COUNT(*) as total
      FROM profesional
      WHERE id_especialidad = ? AND estado = 1
    `).get(idEspecialidad);
    return row.total;
  }
};
```

## File: backend/src/repositories/pacienteRepository.js
```javascript
import { getDb } from '../db/connection.js';
import { escapeLike } from '../core/text.js';

export const pacienteRepository = {
  findAll({ q, dni, nombre, telefono, correo, estado }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    // Búsqueda en tiempo real (coincidencia parcial en DNI, nombre o apellido)
    if (q) {
      conditions.push(`(
        dni LIKE '%' || ? || '%' ESCAPE '\\' OR
        normalizar(nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\' OR
        normalizar(apellido) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'
      )`);
      const escapedQ = escapeLike(q);
      params.push(escapedQ, escapedQ, escapedQ);
    }

    if (dni) {
      conditions.push("dni LIKE '%' || ? || '%' ESCAPE '\\'");
      params.push(escapeLike(dni));
    }
    if (nombre) {
      conditions.push("(normalizar(nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\' OR normalizar(apellido) LIKE '%' || normalizar(?) || '%' ESCAPE '\\')");
      params.push(escapeLike(nombre), escapeLike(nombre));
    }
    if (telefono) {
      conditions.push("telefono LIKE '%' || ? || '%' ESCAPE '\\'");
      params.push(escapeLike(telefono));
    }
    if (correo) {
      conditions.push("normalizar(correo) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(correo));
    }
    if (estado !== undefined && estado !== 'todos') {
      conditions.push('estado = ?');
      params.push(Number(estado));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id_paciente, id_usuario, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado
      FROM paciente
      ${where}
      ORDER BY apellido ASC, nombre ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT id_paciente, id_usuario, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado
      FROM paciente
      WHERE id_paciente = ?
    `).get(id);
  },

  findByIdUsuario(id_usuario) {
    const db = getDb();
    return db.prepare(`
      SELECT id_paciente, id_usuario, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado
      FROM paciente
      WHERE id_usuario = ?
    `).get(id_usuario);
  },

  findByDni(dni, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare('SELECT id_paciente, dni, estado FROM paciente WHERE dni = ? AND id_paciente <> ?').get(dni, excludeId);
    }
    return db.prepare('SELECT id_paciente, dni, estado FROM paciente WHERE dni = ?').get(dni);
  },

  findByCorreo(correo, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare('SELECT id_paciente, correo, estado FROM paciente WHERE normalizar(correo) = normalizar(?) AND id_paciente <> ?').get(correo, excludeId);
    }
    return db.prepare('SELECT id_paciente, correo, estado FROM paciente WHERE normalizar(correo) = normalizar(?)').get(correo);
  },

  create({ id_usuario, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social }) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO paciente (id_usuario, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id_usuario,
      dni,
      nombre,
      apellido,
      telefono || null,
      correo,
      fecha_nacimiento || null,
      obra_social || null
    );

    return result.lastInsertRowid;
  },

  update(id, { dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social }) {
    const db = getDb();
    db.prepare(`
      UPDATE paciente
      SET dni = ?, nombre = ?, apellido = ?, telefono = ?, correo = ?, fecha_nacimiento = ?, obra_social = ?
      WHERE id_paciente = ?
    `).run(
      dni,
      nombre,
      apellido,
      telefono || null,
      correo,
      fecha_nacimiento || null,
      obra_social || null,
      id
    );
  },

  setEstado(id, estado) {
    const db = getDb();
    db.prepare('UPDATE paciente SET estado = ? WHERE id_paciente = ?').run(estado, id);
  },

  countActiveFutureTurnos(id_paciente, fechaActual) {
    const db = getDb();
    const row = db.prepare(`
      SELECT COUNT(*) as total
      FROM turno
      WHERE id_paciente = ?
        AND fecha >= ?
        AND estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_CONSULTORIO')
    `).get(id_paciente, fechaActual);
    return row.total;
  }
};
```

## File: backend/src/repositories/profesionalRepository.js
```javascript
import { getDb } from '../db/connection.js';
import { escapeLike, claveConsultorio } from '../core/text.js';

export const profesionalRepository = {
  findAll({ especialidad, nombre, estado }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (especialidad) {
      conditions.push("normalizar(e.nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(especialidad));
    }
    if (nombre) {
      conditions.push("(normalizar(p.nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\' OR normalizar(p.apellido) LIKE '%' || normalizar(?) || '%' ESCAPE '\\')");
      params.push(escapeLike(nombre), escapeLike(nombre));
    }
    if (estado !== undefined && estado !== 'todos') {
      conditions.push('p.estado = ?');
      params.push(Number(estado));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT p.id_profesional, p.id_especialidad, p.id_usuario, p.matricula,
             p.nombre, p.apellido, p.consultorio, p.estado,
             e.nombre AS especialidad_nombre,
             u.correo AS usuario_correo
      FROM profesional p
      JOIN especialidad e ON p.id_especialidad = e.id_especialidad
      LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
      ${where}
      ORDER BY p.apellido ASC, p.nombre ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT p.id_profesional, p.id_especialidad, p.id_usuario, p.matricula,
             p.nombre, p.apellido, p.consultorio, p.estado,
             e.nombre AS especialidad_nombre,
             u.correo AS usuario_correo
      FROM profesional p
      JOIN especialidad e ON p.id_especialidad = e.id_especialidad
      LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
      WHERE p.id_profesional = ?
    `).get(id);
  },

  findByMatricula(matricula, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare(`
        SELECT id_profesional, matricula FROM profesional WHERE matricula = ? AND id_profesional <> ?
      `).get(matricula, excludeId);
    }
    return db.prepare('SELECT id_profesional, matricula FROM profesional WHERE matricula = ?').get(matricula);
  },

  findByConsultorio(consultorio, excludeId = null) {
    const key = claveConsultorio(consultorio);
    if (!key) return null;
    const db = getDb();
    if (excludeId) {
      return db.prepare(`
        SELECT id_profesional, consultorio FROM profesional 
        WHERE consultorio_clave = ? AND id_profesional <> ? AND estado = 1
      `).get(key, excludeId);
    }
    return db.prepare(`
      SELECT id_profesional, consultorio FROM profesional 
      WHERE consultorio_clave = ? AND estado = 1
    `).get(key);
  },

  create({ id_especialidad, id_usuario, matricula, nombre, apellido, consultorio }) {
    const db = getDb();
    const key = claveConsultorio(consultorio);
    const result = db.prepare(`
      INSERT INTO profesional (id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, key);

    return result.lastInsertRowid;
  },

  update(id, { id_especialidad, matricula, consultorio }) {
    const db = getDb();
    const key = claveConsultorio(consultorio);
    db.prepare(`
      UPDATE profesional
      SET id_especialidad = ?, matricula = ?, consultorio = ?, consultorio_clave = ?
      WHERE id_profesional = ?
    `).run(id_especialidad, matricula, consultorio || null, key, id);
  },

  setEstado(id, estado) {
    const db = getDb();
    db.prepare('UPDATE profesional SET estado = ? WHERE id_profesional = ?').run(estado, id);
  },

  // Turnos futuros activos (PENDIENTE, CONFIRMADO, EN_CONSULTORIO)
  countActiveFutureTurnos(id_profesional, fechaActual) {
    const db = getDb();
    const row = db.prepare(`
      SELECT COUNT(*) as total
      FROM turno
      WHERE id_profesional = ?
        AND fecha >= ?
        AND estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_CONSULTORIO')
    `).get(id_profesional, fechaActual);
    return row.total;
  },

  // Disponibilidad
  getDisponibilidad(id_profesional) {
    const db = getDb();
    return db.prepare(`
      SELECT id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado
      FROM disponibilidad
      WHERE id_profesional = ? AND estado = 1
      ORDER BY 
        CASE dia_semana
          WHEN 'LUNES' THEN 1
          WHEN 'MARTES' THEN 2
          WHEN 'MIERCOLES' THEN 3
          WHEN 'JUEVES' THEN 4
          WHEN 'VIERNES' THEN 5
          WHEN 'SABADO' THEN 6
          WHEN 'DOMINGO' THEN 7
        END,
        hora_inicio ASC
    `).all(id_profesional);
  },

  setDisponibilidad(id_profesional, franjas) {
    const db = getDb();
    // Eliminar franjas actuales y reinsertar
    db.prepare('DELETE FROM disponibilidad WHERE id_profesional = ?').run(id_profesional);
    const insert = db.prepare(`
      INSERT INTO disponibilidad (id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado)
      VALUES (?, ?, ?, ?, 30, 1)
    `);

    for (const f of franjas) {
      insert.run(id_profesional, f.dia_semana, f.hora_inicio, f.hora_fin);
    }
  },

  clearDisponibilidad(id_profesional) {
    const db = getDb();
    db.prepare('DELETE FROM disponibilidad WHERE id_profesional = ?').run(id_profesional);
  }
};
```

## File: backend/src/repositories/turnoRepository.js
```javascript
import { getDb } from '../db/connection.js';
import { escapeLike } from '../core/text.js';

export const turnoRepository = {
  findAll({ fecha, hora, paciente, profesional, estado, id_profesional_scope, id_paciente_scope }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    // Si el usuario autenticado es PACIENTE, se restringe estrictamente a sus turnos (RFM-17, RFM-19)
    if (id_paciente_scope) {
      conditions.push('t.id_paciente = ?');
      params.push(id_paciente_scope);
    } else if (paciente) {
      conditions.push('(pa.dni LIKE \'%\' || ? || \'%\' ESCAPE \'\\\' OR normalizar(pa.nombre) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\' OR normalizar(pa.apellido) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\')');
      const escPac = escapeLike(paciente);
      params.push(escPac, escPac, escPac);
    }

    // Si el usuario autenticado es PROFESIONAL, se restringe estrictamente a sus turnos (D-02, CA-15.3)
    if (id_profesional_scope) {
      conditions.push('t.id_profesional = ?');
      params.push(id_profesional_scope);
    } else if (profesional) {
      conditions.push('(normalizar(pr.nombre) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\' OR normalizar(pr.apellido) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\')');
      params.push(escapeLike(profesional), escapeLike(profesional));
    }

    if (fecha) {
      conditions.push('t.fecha = ?');
      params.push(fecha);
    }
    if (hora) {
      conditions.push('t.hora = ?');
      params.push(hora);
    }
    if (estado !== undefined && estado !== 'todos') {
      conditions.push('t.estado = ?');
      params.push(estado);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        t.id_turno, t.fecha, t.hora, t.estado, t.motivo_consulta, t.observaciones,
        t.fecha_creacion, t.fecha_hora_llegada, t.fecha_cancelacion,
        pa.id_paciente, pa.dni AS paciente_dni, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido, pa.telefono AS paciente_telefono, pa.correo AS paciente_correo,
        pr.id_profesional, pr.matricula AS profesional_matricula, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido, pr.consultorio AS consultorio,
        e.id_especialidad, e.nombre AS especialidad_nombre
      FROM turno t
      JOIN paciente pa ON t.id_paciente = pa.id_paciente
      JOIN profesional pr ON t.id_profesional = pr.id_profesional
      JOIN especialidad e ON pr.id_especialidad = e.id_especialidad
      ${where}
      ORDER BY t.fecha ASC, t.hora ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT 
        t.id_turno, t.id_paciente, t.id_profesional, t.fecha, t.hora, t.estado,
        t.motivo_consulta, t.observaciones, t.fecha_creacion, t.fecha_hora_llegada,
        t.creado_por, t.cancelado_por, t.fecha_cancelacion,
        pa.dni AS paciente_dni, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
        pr.matricula AS profesional_matricula, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido, pr.consultorio AS consultorio,
        e.nombre AS especialidad_nombre
      FROM turno t
      JOIN paciente pa ON t.id_paciente = pa.id_paciente
      JOIN profesional pr ON t.id_profesional = pr.id_profesional
      JOIN especialidad e ON pr.id_especialidad = e.id_especialidad
      WHERE t.id_turno = ?
    `).get(id);
  },

  create({ id_paciente, id_profesional, fecha, hora, motivo_consulta, observaciones, creado_por }) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO turno (id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, creado_por)
      VALUES (?, ?, ?, ?, 'PENDIENTE', ?, ?, ?)
    `).run(
      id_paciente,
      id_profesional,
      fecha,
      hora,
      motivo_consulta || null,
      observaciones || null,
      creado_por
    );

    return result.lastInsertRowid;
  },

  update(id, fields) {
    const db = getDb();
    const sets = [];
    const params = [];

    for (const [key, value] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
    params.push(id);

    db.prepare(`
      UPDATE turno
      SET ${sets.join(', ')}
      WHERE id_turno = ?
    `).run(...params);
  },

  setEstado(id, estado, extraFields = {}) {
    const db = getDb();
    const sets = ['estado = ?'];
    const params = [estado];

    for (const [k, v] of Object.entries(extraFields)) {
      sets.push(`${k} = ?`);
      params.push(v);
    }
    params.push(id);

    db.prepare(`
      UPDATE turno
      SET ${sets.join(', ')}
      WHERE id_turno = ?
    `).run(...params);
  },

  findConflictTurnoProfesional(id_profesional, fecha, hora, excludeTurnoId = null) {
    const db = getDb();
    if (excludeTurnoId) {
      return db.prepare(`
        SELECT id_turno FROM turno
        WHERE id_profesional = ? AND fecha = ? AND hora = ? AND estado <> 'CANCELADO' AND id_turno <> ?
      `).get(id_profesional, fecha, hora, excludeTurnoId);
    }
    return db.prepare(`
      SELECT id_turno FROM turno
      WHERE id_profesional = ? AND fecha = ? AND hora = ? AND estado <> 'CANCELADO'
    `).get(id_profesional, fecha, hora);
  },

  findConflictTurnoPaciente(id_paciente, fecha, hora, excludeTurnoId = null) {
    const db = getDb();
    if (excludeTurnoId) {
      return db.prepare(`
        SELECT id_turno FROM turno
        WHERE id_paciente = ? AND fecha = ? AND hora = ? AND estado <> 'CANCELADO' AND id_turno <> ?
      `).get(id_paciente, fecha, hora, excludeTurnoId);
    }
    return db.prepare(`
      SELECT id_turno FROM turno
      WHERE id_paciente = ? AND fecha = ? AND hora = ? AND estado <> 'CANCELADO'
    `).get(id_paciente, fecha, hora);
  },

  // Turnos expirados para pase automático a AUSENTE (Q2 / D-30)
  // Aplica a turnos en PENDIENTE o CONFIRMADO cuando pasaron >= 30 minutos desde el inicio
  marcarTurnosAusentesAutomaticos(fechaHoraLimite) {
    const db = getDb();
    const turnosParaAusente = db.prepare(`
      SELECT id_turno, id_paciente, id_profesional, fecha, hora, estado
      FROM turno
      WHERE estado IN ('PENDIENTE', 'CONFIRMADO')
        AND (fecha || ' ' || hora) <= ?
    `).all(fechaHoraLimite);

    if (turnosParaAusente.length === 0) return [];

    const ids = turnosParaAusente.map(t => t.id_turno);
    const placeholders = ids.map(() => '?').join(',');

    db.prepare(`
      UPDATE turno
      SET estado = 'AUSENTE'
      WHERE id_turno IN (${placeholders})
    `).run(...ids);

    return turnosParaAusente;
  }
};
```

## File: backend/src/repositories/userRepository.js
```javascript
import { getDb } from '../db/connection.js';
import { escapeLike } from '../core/text.js';

export const userRepository = {
  findAll({ nombre, apellido, correo, rol, estado }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (nombre) {
      conditions.push("normalizar(nombre) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(nombre));
    }
    if (apellido) {
      conditions.push("normalizar(apellido) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(apellido));
    }
    if (correo) {
      conditions.push("normalizar(correo) LIKE '%' || normalizar(?) || '%' ESCAPE '\\'");
      params.push(escapeLike(correo));
    }
    if (rol) {
      conditions.push('rol = ?');
      params.push(rol);
    }
    if (estado !== undefined && estado !== 'todos') {
      conditions.push('estado = ?');
      params.push(Number(estado));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id_usuario, nombre, apellido, correo, rol, estado, fecha_creacion
      FROM usuario
      ${where}
      ORDER BY id_usuario ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.rol, u.estado, u.fecha_creacion,
             p.id_profesional, p.matricula, p.consultorio, p.id_especialidad,
             pac.id_paciente, pac.dni AS paciente_dni
      FROM usuario u
      LEFT JOIN profesional p ON p.id_usuario = u.id_usuario
      LEFT JOIN paciente pac ON pac.id_usuario = u.id_usuario
      WHERE u.id_usuario = ?
    `).get(id);
  },

  findByCorreo(correo, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare(`
        SELECT id_usuario, correo, rol, estado
        FROM usuario
        WHERE normalizar(correo) = normalizar(?) AND id_usuario <> ?
      `).get(correo, excludeId);
    }
    return db.prepare(`
      SELECT id_usuario, correo, rol, estado
      FROM usuario
      WHERE normalizar(correo) = normalizar(?)
    `).get(correo);
  },

  create({ nombre, apellido, correo, clave_hash, rol }) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO usuario (nombre, apellido, correo, clave_hash, rol, estado)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(nombre, apellido, correo, clave_hash, rol);

    return result.lastInsertRowid;
  },

  update(id, { nombre, apellido, correo }) {
    const db = getDb();
    db.prepare(`
      UPDATE usuario
      SET nombre = ?, apellido = ?, correo = ?
      WHERE id_usuario = ?
    `).run(nombre, apellido, correo, id);
  },

  setEstado(id, estado) {
    const db = getDb();
    db.prepare(`
      UPDATE usuario
      SET estado = ?
      WHERE id_usuario = ?
    `).run(estado, id);
  },

  updateClave(id, clave_hash) {
    const db = getDb();
    db.prepare(`
      UPDATE usuario
      SET clave_hash = ?
      WHERE id_usuario = ?
    `).run(clave_hash, id);
  },

  deleteSessions(id_usuario) {
    const db = getDb();
    db.prepare('DELETE FROM sesion WHERE id_usuario = ?').run(id_usuario);
  }
};
```

## File: backend/src/routes/agendaRoutes.js
```javascript
import { Router } from 'express';
import { agendaController } from '../controllers/agendaController.js';
import { validate } from '../middleware/validate.js';
import { agendaQuerySchema } from '../schemas/agendaSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const agendaRouter = Router();
export const dashboardRouter = Router();

agendaRouter.use(requireAuth);
dashboardRouter.use(requireAuth);

// Agenda médica diaria o mensual (CU-04, D-38, Q9) - No accesible para PACIENTE (RFM-21)
agendaRouter.get(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'),
  validate({ query: agendaQuerySchema }),
  agendaController.getAgenda
);

// Panel principal / Dashboard (RFB-57, D-39, Q8)
dashboardRouter.get(
  '/',
  agendaController.getDashboard
);
```

## File: backend/src/routes/authRoutes.js
```javascript
import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema } from '../schemas/authSchema.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginSchema }), authController.login);
authRouter.post('/logout', requireAuth, authController.logout);
authRouter.get('/me', requireAuth, authController.me);
authRouter.put('/clave', requireAuth, validate({ body: changePasswordSchema }), authController.changePassword);
```

## File: backend/src/routes/especialidadRoutes.js
```javascript
import { Router } from 'express';
import { especialidadController } from '../controllers/especialidadController.js';
import { validate } from '../middleware/validate.js';
import {
  especialidadIdParamSchema,
  especialidadCreateSchema,
  especialidadUpdateSchema,
  especialidadFilterSchema
} from '../schemas/especialidadSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const especialidadRouter = Router();

// Todas las rutas requieren estar autenticado
especialidadRouter.use(requireAuth);

// Lectura de especialidades permitida para ADMINISTRADOR, RECEPCIONISTA y PACIENTE (RFM-08)
especialidadRouter.get(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'PACIENTE'),
  validate({ query: especialidadFilterSchema }),
  especialidadController.list
);

especialidadRouter.get(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'PACIENTE'),
  validate({ params: especialidadIdParamSchema }),
  especialidadController.getById
);

// Gestión (Crear, Modificar, Desactivar, Activar) exclusiva de ADMINISTRADOR (RF-04, RFB-18)
especialidadRouter.post(
  '/',
  requireRole('ADMINISTRADOR'),
  validate({ body: especialidadCreateSchema }),
  especialidadController.create
);

especialidadRouter.put(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: especialidadIdParamSchema, body: especialidadUpdateSchema }),
  especialidadController.update
);

especialidadRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: especialidadIdParamSchema }),
  especialidadController.deactivate
);

especialidadRouter.patch(
  '/:id/activar',
  requireRole('ADMINISTRADOR'),
  validate({ params: especialidadIdParamSchema }),
  especialidadController.activate
);
```

## File: backend/src/routes/pacienteRoutes.js
```javascript
import { Router } from 'express';
import { pacienteController } from '../controllers/pacienteController.js';
import { validate } from '../middleware/validate.js';
import {
  pacienteIdParamSchema,
  pacienteCreateSchema,
  pacienteUpdateSchema,
  pacienteFilterSchema
} from '../schemas/pacienteSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const pacienteRouter = Router();

pacienteRouter.use(requireAuth);

// Lectura y Búsqueda: Administrador y Recepcionista (RF-03, HU-09)
pacienteRouter.get(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ query: pacienteFilterSchema }),
  pacienteController.list
);

pacienteRouter.get(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ params: pacienteIdParamSchema }),
  pacienteController.getById
);

// Alta y Modificación: Administrador y Recepcionista (CU-02, RF-03)
pacienteRouter.post(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ body: pacienteCreateSchema }),
  pacienteController.create
);

pacienteRouter.put(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ params: pacienteIdParamSchema, body: pacienteUpdateSchema }),
  pacienteController.update
);

// Desactivación y Reactivación: Solo Administrador (D-16)
pacienteRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: pacienteIdParamSchema }),
  pacienteController.deactivate
);

pacienteRouter.patch(
  '/:id/activar',
  requireRole('ADMINISTRADOR'),
  validate({ params: pacienteIdParamSchema }),
  pacienteController.activate
);

// Restablecer contraseña de paciente: Administrador y Recepcionista (RFM-23)
pacienteRouter.post(
  '/:id/clave',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ params: pacienteIdParamSchema }),
  pacienteController.resetPassword
);
```

## File: backend/src/routes/turnoRoutes.js
```javascript
import { Router } from 'express';
import { turnoController } from '../controllers/turnoController.js';
import { validate } from '../middleware/validate.js';
import {
  turnoIdParamSchema,
  turnoCreateSchema,
  turnoUpdateSchema,
  turnoCambioEstadoSchema,
  turnoFilterSchema,
  turnosDisponiblesQuerySchema
} from '../schemas/turnoSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const turnoRouter = Router();

turnoRouter.use(requireAuth);

// Horarios disponibles (RF-06, CU-03, RFM-10)
turnoRouter.get(
  '/disponibles',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'PACIENTE'),
  validate({ query: turnosDisponiblesQuerySchema }),
  turnoController.getDisponibles
);

// Listado de turnos con filtros (RF-12, CU-04, HU-15, RFM-17)
turnoRouter.get(
  '/',
  validate({ query: turnoFilterSchema }),
  turnoController.list
);

turnoRouter.get(
  '/:id',
  validate({ params: turnoIdParamSchema }),
  turnoController.getById
);

// Alta de turno: Administrador, Recepcionista y Paciente (CU-03, RF-08, RFM-12)
turnoRouter.post(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'PACIENTE'),
  validate({ body: turnoCreateSchema }),
  turnoController.create
);

// Modificación de turno (RF-09, Q11): Administrador, Recepcionista y Profesional (observaciones)
turnoRouter.put(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'),
  validate({ params: turnoIdParamSchema, body: turnoUpdateSchema }),
  turnoController.update
);

// Cambio de estado (RF-11, Q1): Administrador, Recepcionista y Profesional
turnoRouter.patch(
  '/:id/estado',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'),
  validate({ params: turnoIdParamSchema, body: turnoCambioEstadoSchema }),
  turnoController.cambiarEstado
);

// Cancelación de turno (RF-10, Q1, D-04): Administrador, Recepcionista y Paciente (propios en PENDIENTE/CONFIRMADO)
turnoRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'PACIENTE'),
  validate({ params: turnoIdParamSchema }),
  turnoController.cancelar
);
```

## File: backend/src/routes/userRoutes.js
```javascript
import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';
import {
  userIdParamSchema,
  userCreateSchema,
  userUpdateSchema,
  userFilterSchema,
  profesionalIdParamSchema,
  profesionalUpdateSchema,
  profesionalFilterSchema,
  disponibilidadUpdateSchema
} from '../schemas/userSchema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

export const userRouter = Router();
export const profesionalRouter = Router();

// Todas requieren estar autenticado
userRouter.use(requireAuth);
profesionalRouter.use(requireAuth);

// -----------------------------------------------------------------------------
// RUTAS /api/usuarios (Exclusivas de ADMINISTRADOR, RF-02, RFB-13)
// -----------------------------------------------------------------------------
userRouter.get(
  '/',
  requireRole('ADMINISTRADOR'),
  validate({ query: userFilterSchema }),
  userController.listUsers
);

userRouter.get(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema }),
  userController.getUserById
);

userRouter.post(
  '/',
  requireRole('ADMINISTRADOR'),
  validate({ body: userCreateSchema }),
  userController.createUser
);

userRouter.put(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema, body: userUpdateSchema }),
  userController.updateUser
);

userRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema }),
  userController.deactivateUser
);

userRouter.patch(
  '/:id/activar',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema }),
  userController.activateUser
);

userRouter.post(
  '/:id/clave',
  requireRole('ADMINISTRADOR'),
  validate({ params: userIdParamSchema }),
  userController.resetPassword
);

// -----------------------------------------------------------------------------
// RUTAS /api/profesionales
// -----------------------------------------------------------------------------
// Lectura: Administrador, Recepcionista, y Profesional (este último solo a sí mismo)
profesionalRouter.get(
  '/',
  validate({ query: profesionalFilterSchema }),
  userController.listProfesionales
);

profesionalRouter.get(
  '/:id',
  validate({ params: profesionalIdParamSchema }),
  userController.getProfesionalById
);

// Modificación y baja lógica: Administrador (RF-05, RF-13)
profesionalRouter.put(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: profesionalIdParamSchema, body: profesionalUpdateSchema }),
  userController.updateProfesional
);

profesionalRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate({ params: profesionalIdParamSchema }),
  userController.deactivateProfesional
);

profesionalRouter.patch(
  '/:id/activar',
  requireRole('ADMINISTRADOR'),
  validate({ params: profesionalIdParamSchema }),
  userController.activateProfesional
);

// Disponibilidad
profesionalRouter.get(
  '/:id/disponibilidad',
  validate({ params: profesionalIdParamSchema }),
  userController.getDisponibilidad
);

profesionalRouter.put(
  '/:id/disponibilidad',
  requireRole('ADMINISTRADOR'),
  validate({ params: profesionalIdParamSchema, body: disponibilidadUpdateSchema }),
  userController.updateDisponibilidad
);
```

## File: backend/src/schemas/agendaSchema.js
```javascript
import { z } from 'zod';

export const agendaQuerySchema = z.object({
  id_profesional: z.coerce.number().int().positive().optional(),
  id_especialidad: z.coerce.number().int().positive().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  mes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mes inválido (YYYY-MM)').optional()
}).refine(data => data.fecha || data.mes, {
  message: 'Debe especificar fecha (YYYY-MM-DD) o mes (YYYY-MM)',
  path: ['fecha']
});
```

## File: backend/src/schemas/authSchema.js
```javascript
import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[#$@!%*?&]/, 'Debe incluir al menos un carácter especial (#$@!%*?&)');

export const loginSchema = z.object({
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  clave: z.string().min(1, 'Debe ingresar la contraseña')
}).strict();

export const changePasswordSchema = z.object({
  clave_actual: z.string().min(1, 'Debe ingresar su contraseña actual'),
  clave_nueva: passwordSchema
}).strict();
```

## File: backend/src/schemas/especialidadSchema.js
```javascript
import { z } from 'zod';

export const especialidadIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de especialidad inválido')
}).strict();

export const especialidadCreateSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(80, 'Máximo 80 caracteres'),
  descripcion: z.string().trim().max(255, 'Máximo 255 caracteres').optional().nullable()
}).strict();

export const especialidadUpdateSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(80, 'Máximo 80 caracteres'),
  descripcion: z.string().trim().max(255, 'Máximo 255 caracteres').optional().nullable()
}).strict();

export const especialidadFilterSchema = z.object({
  nombre: z.string().trim().optional(),
  estado: z.enum(['0', '1', 'todos']).optional()
}).strict();
```

## File: backend/src/schemas/pacienteSchema.js
```javascript
import { z } from 'zod';

export const pacienteIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de paciente inválido')
}).strict();

// DNI argentino (7 u 8 dígitos numéricos, D-18)
// Teléfono opcional (máx 12 dígitos numéricos, D-18)
// Correo obligatorio (D-17)
// Fecha nacimiento opcional (no futura y >= 1900-01-01, D-19)
// Obra social opcional (texto libre, D-19)
export const pacienteCreateSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe contener 7 u 8 dígitos numéricos sin puntos'),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  telefono: z.string().regex(/^\d{1,12}$/, 'El teléfono debe contener solo números y hasta 12 dígitos').optional().nullable(),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .refine(val => val >= '1900-01-01', 'La fecha de nacimiento no puede ser anterior al año 1900')
    .refine(val => {
      const hoy = new Date().toISOString().slice(0, 10);
      return val <= hoy;
    }, 'La fecha de nacimiento no puede ser una fecha futura')
    .optional().nullable(),
  obra_social: z.string().trim().max(100, 'Máximo 100 caracteres').optional().nullable()
}).strict();

export const pacienteUpdateSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe contener 7 u 8 dígitos numéricos sin puntos'),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  telefono: z.string().regex(/^\d{1,12}$/, 'El teléfono debe contener solo números y hasta 12 dígitos').optional().nullable(),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .refine(val => val >= '1900-01-01', 'La fecha de nacimiento no puede ser anterior al año 1900')
    .refine(val => {
      const hoy = new Date().toISOString().slice(0, 10);
      return val <= hoy;
    }, 'La fecha de nacimiento no puede ser una fecha futura')
    .optional().nullable(),
  obra_social: z.string().trim().max(100, 'Máximo 100 caracteres').optional().nullable()
}).strict();

export const pacienteFilterSchema = z.object({
  q: z.string().trim().optional(), // Búsqueda rápida unificada por DNI, nombre o apellido (TP2 front-end)
  dni: z.string().trim().optional(),
  nombre: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  correo: z.string().trim().optional(),
  estado: z.enum(['0', '1', 'todos']).optional()
}).strict();
```

## File: backend/src/schemas/turnoSchema.js
```javascript
import { z } from 'zod';

export const turnoIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de turno inválido')
}).strict();

export const turnoCreateSchema = z.object({
  id_paciente: z.number().int().positive('Debe seleccionar un paciente').optional(),
  id_profesional: z.number().int().positive('Debe seleccionar un profesional'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  hora: z.string().regex(/^(0[8-9]|1[0-9]|20):(00|30)$/, 'Horario inválido (debe ser entre 08:00 y 20:30 cada 30 min)'),
  motivo_consulta: z.string().trim().max(255, 'Máximo 255 caracteres').optional().nullable(),
  observaciones: z.string().trim().max(500, 'Máximo 500 caracteres').optional().nullable()
}).strict();

// Modificación de turno (Q11: reprogramar o editar observaciones)
export const turnoUpdateSchema = z.object({
  id_profesional: z.number().int().positive('Profesional inválido').optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  hora: z.string().regex(/^(0[8-9]|1[0-9]|20):(00|30)$/, 'Horario inválido').optional(),
  motivo_consulta: z.string().trim().max(255).optional().nullable(),
  observaciones: z.string().trim().max(500).optional().nullable()
}).strict();

// Cambio de estado (Q1: transición estricta)
export const turnoCambioEstadoSchema = z.object({
  estado: z.enum(['CONFIRMADO', 'EN_CONSULTORIO', 'ASISTIDO', 'AUSENTE', 'CANCELADO'])
}).strict();

export const turnoFilterSchema = z.object({
  fecha: z.string().trim().optional(),
  hora: z.string().trim().optional(),
  paciente: z.string().trim().optional(), // Filtro por nombre o DNI
  profesional: z.string().trim().optional(),
  estado: z.enum(['PENDIENTE', 'CONFIRMADO', 'EN_CONSULTORIO', 'ASISTIDO', 'AUSENTE', 'CANCELADO', 'todos']).optional()
}).strict();

export const turnosDisponiblesQuerySchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha requerida (YYYY-MM-DD)'),
  id_profesional: z.coerce.number().int().positive().optional(),
  id_especialidad: z.coerce.number().int().positive().optional()
}).refine(data => data.id_profesional || data.id_especialidad, {
  message: 'Debe especificar id_profesional o id_especialidad',
  path: ['id_profesional']
});
```

## File: backend/src/schemas/userSchema.js
```javascript
import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de usuario inválido')
}).strict();

export const profesionalIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de profesional inválido')
}).strict();

// Franja horaria para disponibilidad
export const franjaHorariaSchema = z.object({
  dia_semana: z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']),
  hora_inicio: z.string().regex(/^(0[8-9]|1[0-9]|20):(00|30)$/, 'Horario de inicio entre 08:00 y 20:30'),
  hora_fin: z.string().regex(/^(0[8-9]|1[0-9]|20|21):(00|30)$/, 'Horario de fin entre 08:30 y 21:00')
}).refine(data => data.hora_inicio < data.hora_fin, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['hora_fin']
});

// Datos de profesional requeridos si rol === 'PROFESIONAL' (Q4)
export const profesionalDataSchema = z.object({
  id_especialidad: z.number().int().positive('Debe seleccionar una especialidad válida'),
  matricula: z.string().regex(/^\d{5}$/, 'La matrícula debe tener exactamente 5 dígitos numéricos'),
  consultorio: z.string().trim().min(1, 'El consultorio es requerido').max(20, 'Máximo 20 caracteres')
}).strict();

// Datos de paciente si rol === 'PACIENTE'
export const pacienteDataSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos numéricos'),
  telefono: z.string().regex(/^\d{1,12}$/, 'El teléfono solo debe contener números (máximo 12)').optional().nullable(),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional().nullable(),
  obra_social: z.string().trim().max(100).optional().nullable()
}).strict();

// Creación de usuario (Q4: si es PROFESIONAL, se exige profesional y disponibilidad; si es PACIENTE, se exige ficha paciente)
export const userCreateSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  rol: z.enum(['RECEPCIONISTA', 'PROFESIONAL', 'PACIENTE'], {
    errorMap: () => ({ message: 'El rol debe ser RECEPCIONISTA, PROFESIONAL o PACIENTE' })
  }),
  profesional: profesionalDataSchema.optional(),
  disponibilidad: z.array(franjaHorariaSchema).optional(),
  paciente: pacienteDataSchema.optional()
}).strict().superRefine((data, ctx) => {
  if (data.rol === 'PROFESIONAL') {
    if (!data.profesional) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para el rol PROFESIONAL debe completar los datos del profesional',
        path: ['profesional']
      });
    }
    if (!data.disponibilidad || data.disponibilidad.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe configurar al menos una franja horaria de atención para el profesional',
        path: ['disponibilidad']
      });
    }
  }
  if (data.rol === 'PACIENTE') {
    if (!data.paciente || !data.paciente.dni) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para el rol PACIENTE debe ingresar los datos del paciente (DNI)',
        path: ['paciente']
      });
    }
  }
});

// Modificación de usuario (sin cambio de rol, según definición confirmada)
export const userUpdateSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase()
}).strict();

export const userFilterSchema = z.object({
  nombre: z.string().trim().optional(),
  apellido: z.string().trim().optional(),
  correo: z.string().trim().optional(),
  rol: z.enum(['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL', 'PACIENTE']).optional(),
  estado: z.enum(['0', '1', 'todos']).optional()
}).strict();

// Modificación de profesional (Administrador)
export const profesionalUpdateSchema = z.object({
  id_especialidad: z.number().int().positive('Especialidad inválida'),
  matricula: z.string().regex(/^\d{5}$/, 'La matrícula debe ser de 5 dígitos'),
  consultorio: z.string().trim().min(1, 'Consultorio requerido').max(20, 'Máximo 20 caracteres').nullable().optional()
}).strict();

export const profesionalFilterSchema = z.object({
  especialidad: z.string().trim().optional(),
  nombre: z.string().trim().optional(),
  estado: z.enum(['0', '1', 'todos']).optional()
}).strict();

// Configuración semanal de disponibilidad (reemplazo completo)
export const disponibilidadUpdateSchema = z.object({
  franjas: z.array(franjaHorariaSchema)
}).strict();
```

## File: backend/src/services/agendaService.js
```javascript
import { getDb } from '../db/connection.js';
import { profesionalRepository } from '../repositories/profesionalRepository.js';
import { turnoService } from './turnoService.js';
import { getDiaSemana, horaToMinutos, minutosToHora, getNowInArgentina } from '../core/time.js';
import { NotFoundError } from '../core/errors.js';

export const agendaService = {
  /**
   * Genera la grilla de agenda médica diaria o mensual (CU-04, D-38, Q9).
   * Diferencia visualmente horarios LIBRE y OCUPADO con detalle del turno.
   * Si es PROFESIONAL, se restringe estrictamente a su propia agenda (D-02, CA-17.2).
   */
  getAgenda({ id_profesional, id_especialidad, fecha, mes }, user) {
    turnoService.marcarAusentes();
    const db = getDb();

    // 1. Determinar profesional o profesionales a consultar
    let targetProfesionalId = id_profesional;
    if (user.rol === 'PROFESIONAL') {
      if (!user.id_profesional) {
        return []; // Corrección H-01: profesional sin vínculo válido no obtiene agenda
      }
      targetProfesionalId = user.id_profesional;
    }

    let docs = [];
    if (targetProfesionalId) {
      const p = profesionalRepository.findById(targetProfesionalId);
      if (!p) throw new NotFoundError('Profesional no encontrado');
      docs = [p];
    } else if (id_especialidad) {
      docs = db.prepare(`
        SELECT p.id_profesional, p.nombre, p.apellido, p.consultorio, p.estado, e.nombre AS especialidad_nombre
        FROM profesional p
        JOIN especialidad e ON p.id_especialidad = e.id_especialidad
        WHERE p.id_especialidad = ? AND p.estado = 1
      `).all(id_especialidad);
    } else {
      // Si no especificó profesional ni especialidad, traer profesionales activos
      docs = db.prepare(`
        SELECT p.id_profesional, p.nombre, p.apellido, p.consultorio, p.estado, e.nombre AS especialidad_nombre
        FROM profesional p
        JOIN especialidad e ON p.id_especialidad = e.id_especialidad
        WHERE p.estado = 1
      `).all();
    }

    // 2. Determinar rango de fechas (diario o mensual)
    const fechas = [];
    if (fecha) {
      fechas.push(fecha);
    } else if (mes) {
      const [y, m] = mes.split('-').map(Number);
      const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = String(day).padStart(2, '0');
        fechas.push(`${mes}-${dStr}`);
      }
    }

    const agenda = [];

    for (const doc of docs) {
      const franjas = profesionalRepository.getDisponibilidad(doc.id_profesional);
      const tieneAgenda = franjas.length > 0;

      const profItem = {
        id_profesional: doc.id_profesional,
        profesional: `${doc.nombre} ${doc.apellido}`,
        especialidad: doc.especialidad_nombre,
        consultorio: doc.consultorio,
        tiene_agenda: tieneAgenda,
        dias: []
      };

      if (!tieneAgenda) {
        profItem.mensaje = 'El profesional no posee agenda de atención activa configurada';
        agenda.push(profItem);
        continue;
      }

      for (const fDate of fechas) {
        const diaSemana = getDiaSemana(fDate);
        const franjasDelDia = franjas.filter(f => f.dia_semana === diaSemana);

        if (franjasDelDia.length === 0) {
          continue; // No atiende este día
        }

        // Consultar turnos programados en esa fecha para ese profesional
        const turnosDelDia = db.prepare(`
          SELECT 
            t.id_turno, t.hora, t.estado, t.motivo_consulta,
            pa.id_paciente, pa.dni AS paciente_dni, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido
          FROM turno t
          JOIN paciente pa ON t.id_paciente = pa.id_paciente
          WHERE t.id_profesional = ? AND t.fecha = ?
        `).all(doc.id_profesional, fDate);

        const slots = [];

        for (const franja of franjasDelDia) {
          let cursor = horaToMinutos(franja.hora_inicio);
          const fin = horaToMinutos(franja.hora_fin);

          while (cursor + 30 <= fin) {
            const horaStr = minutosToHora(cursor);
            // Buscar turno activo en este slot
            const turnoOcupado = turnosDelDia.find(t => t.hora === horaStr && t.estado !== 'CANCELADO');

            if (turnoOcupado) {
              slots.push({
                hora: horaStr,
                estado: 'OCUPADO',
                turno: {
                  id_turno: turnoOcupado.id_turno,
                  estado: turnoOcupado.estado,
                  motivo: turnoOcupado.motivo_consulta,
                  paciente: `${turnoOcupado.paciente_nombre} ${turnoOcupado.paciente_apellido}`,
                  paciente_dni: turnoOcupado.paciente_dni
                }
              });
            } else {
              slots.push({
                hora: horaStr,
                estado: 'LIBRE',
                turno: null
              });
            }

            cursor += 30;
          }
        }

        profItem.dias.push({
          fecha: fDate,
          dia_semana: diaSemana,
          slots
        });
      }

      agenda.push(profItem);
    }

    return agenda;
  },

  /**
   * Cálculo de métricas e indicadores para el Dashboard (RFB-57, D-39, Q8).
   * Período: fecha actual hasta +30 días.
   * Próximos turnos: primeros 5 ordenados cronológicamente desde el momento actual excluyendo CANCELADOS.
   */
  getDashboard(user) {
    turnoService.marcarAusentes();
    const db = getDb();
    const { fecha: hoy, hora: horaActual } = getNowInArgentina();

    // Fecha límite +30 días
    const [y, m, d] = hoy.split('-').map(Number);
    const dateMax = new Date(Date.UTC(y, m - 1, d + 30));
    const fechaLimite = dateMax.toISOString().slice(0, 10);

    // Filtro por profesional o paciente según el rol
    const isDoc = user.rol === 'PROFESIONAL';
    const isPac = user.rol === 'PACIENTE';

    const por_estado_vacio = {
      PENDIENTE: 0,
      CONFIRMADO: 0,
      EN_CONSULTORIO: 0,
      ASISTIDO: 0,
      AUSENTE: 0,
      CANCELADO: 0
    };

    // Aislamiento: si un médico o paciente no tiene ficha válida vinculada, no ve datos ajenos (RN-15, H-01)
    if (isDoc && !user.id_profesional) {
      return {
        ventana: { desde: hoy, hasta: fechaLimite },
        indicadores: { total: 0, confirmados: 0, cancelados: 0, por_estado: { ...por_estado_vacio } },
        proximos: []
      };
    }
    if (isPac && !user.id_paciente) {
      return {
        ventana: { desde: hoy, hasta: fechaLimite },
        indicadores: { total: 0, confirmados: 0, cancelados: 0, por_estado: { ...por_estado_vacio } },
        proximos: []
      };
    }

    let roleFilter = '';
    let params = [hoy, fechaLimite];

    if (isDoc) {
      roleFilter = 'AND t.id_profesional = ?';
      params.push(user.id_profesional);
    } else if (isPac) {
      roleFilter = 'AND t.id_paciente = ?';
      params.push(user.id_paciente);
    }

    // Contadores en la ventana [hoy, hoy+30]
    const turnosEnVentana = db.prepare(`
      SELECT t.estado, COUNT(*) as cantidad
      FROM turno t
      WHERE t.fecha >= ? AND t.fecha <= ? ${roleFilter}
      GROUP BY t.estado
    `).all(...params);

    const por_estado = {
      PENDIENTE: 0,
      CONFIRMADO: 0,
      EN_CONSULTORIO: 0,
      ASISTIDO: 0,
      AUSENTE: 0,
      CANCELADO: 0
    };

    let total = 0;
    for (const r of turnosEnVentana) {
      if (por_estado[r.estado] !== undefined) {
        por_estado[r.estado] = r.cantidad;
      }
      total += r.cantidad;
    }

    // Próximos turnos: desde ahora en adelante, no cancelados, máx 5 (CA-18.2, Q8, HU-M11)
    let proximosRoleFilter = '';
    const proximosParams = [hoy, hoy, horaActual];

    if (isDoc) {
      proximosRoleFilter = 'AND t.id_profesional = ?';
      proximosParams.push(user.id_profesional);
    } else if (isPac) {
      proximosRoleFilter = 'AND t.id_paciente = ?';
      proximosParams.push(user.id_paciente);
    }

    const proximos = db.prepare(`
      SELECT 
        t.id_turno, t.fecha, t.hora, t.estado, t.motivo_consulta,
        pa.id_paciente, pa.dni AS paciente_dni, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
        pr.id_profesional, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido, pr.consultorio,
        e.nombre AS especialidad_nombre
      FROM turno t
      JOIN paciente pa ON t.id_paciente = pa.id_paciente
      JOIN profesional pr ON t.id_profesional = pr.id_profesional
      JOIN especialidad e ON pr.id_especialidad = e.id_especialidad
      WHERE (t.fecha > ? OR (t.fecha = ? AND t.hora >= ?))
        AND t.estado <> 'CANCELADO'
        ${proximosRoleFilter}
      ORDER BY t.fecha ASC, t.hora ASC
      LIMIT 5
    `).all(...proximosParams);

    return {
      ventana: {
        desde: hoy,
        hasta: fechaLimite
      },
      indicadores: {
        total,
        confirmados: por_estado.CONFIRMADO,
        cancelados: por_estado.CANCELADO,
        por_estado
      },
      proximos
    };
  }
};
```

## File: backend/src/services/auditService.js
```javascript
import { getDb } from '../db/connection.js';

/**
 * Servicio centralizado de auditoría y trazabilidad (D-41).
 */
export const auditService = {
  /**
   * Registra una acción de auditoría en la base de datos dentro de la transacción activa.
   * @param {object} param0
   * @param {number|null} [param0.id_usuario] Usuario que ejecuta o null si es el SISTEMA
   * @param {string} param0.accion CREAR, MODIFICAR, CAMBIAR_ESTADO, etc.
   * @param {string} param0.entidad USUARIO, PACIENTE, TURNO, etc.
   * @param {number|null} [param0.id_entidad] ID del registro afectado
   * @param {object|null} [param0.antes] Estado previo (se eliminan campos sensibles como clave_hash)
   * @param {object|null} [param0.despues] Estado posterior
   */
  log({ id_usuario = null, accion, entidad, id_entidad = null, antes = null, despues = null }) {
    try {
      const db = getDb();

      // Sanitizar datos para no registrar nunca hashes de contraseñas (RNFB-01)
      const sanitize = (data) => {
        if (!data || typeof data !== 'object') return data;
        const copy = { ...data };
        delete copy.clave_hash;
        delete copy.clave;
        delete copy.clave_nueva;
        delete copy.clave_actual;
        return copy;
      };

      const antesJson = antes ? JSON.stringify(sanitize(antes)) : null;
      const despuesJson = despues ? JSON.stringify(sanitize(despues)) : null;

      db.prepare(`
        INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, datos_antes, datos_despues)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id_usuario, accion, entidad, id_entidad, antesJson, despuesJson);
    } catch (err) {
      console.error('[Auditoría Error]', err);
    }
  }
};
```

## File: backend/src/services/authService.js
```javascript
import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';
import { verifyPassword, hashPassword } from '../core/passwords.js';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../core/errors.js';
import { auditService } from './auditService.js';

export const authService = {
  /**
   * Inicia sesión validando credenciales y genera identificador de sesión.
   * Cierra automáticamente sesiones anteriores del mismo usuario (sesión única D-09).
   */
  async login(correo, clave) {
    const db = getDb();
    const user = db.prepare(`
      SELECT id_usuario, nombre, apellido, correo, clave_hash, rol, estado
      FROM usuario
      WHERE correo = ? COLLATE NOCASE
    `).get(correo);

    if (!user) {
      // Prevenir timing attack validando un hash dummy
      await verifyPassword('dummy', 'scrypt$16384$8$1$00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
      auditService.log({
        accion: 'LOGIN_FALLIDO',
        entidad: 'USUARIO',
        despues: { correo, motivo: 'Usuario no encontrado' }
      });
      throw new UnauthorizedError('Usuario o contraseña incorrectos');
    }

    const isValid = await verifyPassword(clave, user.clave_hash);
    if (!isValid) {
      auditService.log({
        id_usuario: user.id_usuario,
        accion: 'LOGIN_FALLIDO',
        entidad: 'USUARIO',
        id_entidad: user.id_usuario,
        despues: { correo, motivo: 'Contraseña incorrecta' }
      });
      throw new UnauthorizedError('Usuario o contraseña incorrectos');
    }

    if (!user.estado) {
      auditService.log({
        id_usuario: user.id_usuario,
        accion: 'LOGIN_RECHAZADO',
        entidad: 'USUARIO',
        id_entidad: user.id_usuario,
        despues: { motivo: 'Cuenta inactiva' }
      });
      throw new ForbiddenError('Acceso denegado. Comuníquese con el administrador del sistema');
    }

    // Generar token de sesión seguro
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Transacción: eliminar sesiones previas del usuario y registrar la nueva
    const createSession = db.transaction(() => {
      db.prepare('DELETE FROM sesion WHERE id_usuario = ?').run(user.id_usuario);
      db.prepare(`
        INSERT INTO sesion (id_sesion, id_usuario, fecha_creacion, ultima_actividad)
        VALUES (?, ?, DATETIME('now', 'localtime'), DATETIME('now', 'localtime'))
      `).run(tokenHash, user.id_usuario);

      auditService.log({
        id_usuario: user.id_usuario,
        accion: 'LOGIN',
        entidad: 'USUARIO',
        id_entidad: user.id_usuario,
        despues: { correo: user.correo, rol: user.rol }
      });
    });

    createSession();

    // Obtener si es profesional o paciente
    const profesional = db.prepare('SELECT id_profesional FROM profesional WHERE id_usuario = ? AND estado = 1').get(user.id_usuario);
    const paciente = db.prepare('SELECT id_paciente, dni, estado FROM paciente WHERE id_usuario = ?').get(user.id_usuario);

    if (user.rol === 'PACIENTE' && (!paciente || !paciente.estado)) {
      throw new ForbiddenError('Acceso denegado. Cuenta o ficha de paciente inactiva');
    }

    return {
      token,
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
        id_profesional: profesional ? profesional.id_profesional : null,
        id_paciente: paciente ? paciente.id_paciente : null,
        dni: paciente ? paciente.dni : null
      }
    };
  },

  /**
   * Cierra la sesión activa del usuario.
   */
  logout(token, id_usuario) {
    if (!token) return;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const db = getDb();

    db.prepare('DELETE FROM sesion WHERE id_sesion = ?').run(tokenHash);

    if (id_usuario) {
      auditService.log({
        id_usuario,
        accion: 'LOGOUT',
        entidad: 'USUARIO',
        id_entidad: id_usuario
      });
    }
  },

  /**
   * Permite al usuario autenticado cambiar su propia contraseña.
   */
  async changePassword(id_usuario, claveActual, claveNueva) {
    const db = getDb();
    const user = db.prepare('SELECT clave_hash FROM usuario WHERE id_usuario = ?').get(id_usuario);
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    const isValid = await verifyPassword(claveActual, user.clave_hash);
    if (!isValid) {
      throw new ValidationError('La contraseña actual no es correcta', {
        clave_actual: 'Contraseña actual incorrecta'
      });
    }

    const newHash = await hashPassword(claveNueva);
    db.prepare('UPDATE usuario SET clave_hash = ? WHERE id_usuario = ?').run(newHash, id_usuario);

    auditService.log({
      id_usuario,
      accion: 'CAMBIO_CLAVE',
      entidad: 'USUARIO',
      id_entidad: id_usuario
    });
  }
};
```

## File: backend/src/services/especialidadService.js
```javascript
import { especialidadRepository } from '../repositories/especialidadRepository.js';
import { NotFoundError, ConflictError } from '../core/errors.js';
import { auditService } from './auditService.js';
import { getDb } from '../db/connection.js';

export const especialidadService = {
  list(filters = {}, user) {
    if (user?.rol === 'PACIENTE') {
      filters = { ...filters, estado: 1 };
    }
    return especialidadRepository.findAll(filters);
  },

  getById(id) {
    const especialidad = especialidadRepository.findById(id);
    if (!especialidad) {
      throw new NotFoundError('Especialidad no encontrada');
    }
    return especialidad;
  },

  create(data, userId) {
    const existing = especialidadRepository.findByNombre(data.nombre);
    if (existing) {
      throw new ConflictError('Ya existe una especialidad registrada con ese nombre.', {
        nombre: 'El nombre ya se encuentra registrado'
      });
    }

    const db = getDb();
    let newId;

    const tx = db.transaction(() => {
      newId = especialidadRepository.create(data);
      auditService.log({
        id_usuario: userId,
        accion: 'CREAR',
        entidad: 'ESPECIALIDAD',
        id_entidad: Number(newId),
        despues: { id: newId, ...data }
      });
    });

    tx();
    return this.getById(newId);
  },

  update(id, data, userId) {
    const current = this.getById(id);

    const existing = especialidadRepository.findByNombre(data.nombre, id);
    if (existing) {
      throw new ConflictError('Ya existe otra especialidad registrada con ese nombre.', {
        nombre: 'El nombre ya se encuentra registrado'
      });
    }

    const db = getDb();
    const tx = db.transaction(() => {
      especialidadRepository.update(id, data);
      auditService.log({
        id_usuario: userId,
        accion: 'MODIFICAR',
        entidad: 'ESPECIALIDAD',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...data }
      });
    });

    tx();
    return this.getById(id);
  },

  deactivate(id, userId) {
    const current = this.getById(id);
    if (!current.estado) {
      return current; // Ya inactiva
    }

    // Regla D-15: verificar que no tenga dependencias activas (profesionales activos asociados)
    const activeDocs = especialidadRepository.countActiveProfesionales(id);
    if (activeDocs > 0) {
      throw new ConflictError(
        `No es posible desactivar la especialidad porque posee ${activeDocs} profesional(es) activo(s) asociado(s). Desactive primero los profesionales.`
      );
    }

    const db = getDb();
    const tx = db.transaction(() => {
      especialidadRepository.setEstado(id, 0);
      auditService.log({
        id_usuario: userId,
        accion: 'DESACTIVAR',
        entidad: 'ESPECIALIDAD',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 0 }
      });
    });

    tx();
    return this.getById(id);
  },

  activate(id, userId) {
    const current = this.getById(id);
    if (current.estado) {
      return current;
    }

    const db = getDb();
    const tx = db.transaction(() => {
      especialidadRepository.setEstado(id, 1);
      auditService.log({
        id_usuario: userId,
        accion: 'REACTIVAR',
        entidad: 'ESPECIALIDAD',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 1 }
      });
    });

    tx();
    return this.getById(id);
  }
};
```

## File: backend/src/services/pacienteService.js
```javascript
import { pacienteRepository } from '../repositories/pacienteRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { hashPassword, generatePassword } from '../core/passwords.js';
import { NotFoundError, ConflictError } from '../core/errors.js';
import { auditService } from './auditService.js';
import { getDb } from '../db/connection.js';
import { getNowInArgentina } from '../core/time.js';

export const pacienteService = {
  list(filters = {}) {
    return pacienteRepository.findAll(filters);
  },

  getById(id) {
    const paciente = pacienteRepository.findById(id);
    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }
    return paciente;
  },

  /**
   * Alta atómica de ficha de paciente y cuenta de usuario rol PACIENTE (RFM-03, RN-14, RN-17).
   * Genera contraseña inicial que cumple la política, la muestra por consola y la retorna una sola vez.
   */
  async create(data, userId) {
    // 1. Validar DNI único (CU-02 5b)
    const existingDni = pacienteRepository.findByDni(data.dni);
    if (existingDni) {
      throw new ConflictError('El DNI ingresado ya se encuentra registrado en el sistema.', {
        dni: 'El DNI ingresado ya se encuentra registrado en el sistema'
      });
    }

    // 2. Validar correo único entre todos los usuarios (DM-29, RN-20, CA-M03.3)
    const existingCorreo = userRepository.findByCorreo(data.correo);
    if (existingCorreo) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado.', {
        correo: 'El correo electrónico ya se encuentra registrado'
      });
    }

    // 3. Generar contraseña aleatoria según política
    const generatedPassword = generatePassword();
    const clave_hash = await hashPassword(generatedPassword);

    console.log(`[Seguridad] Contraseña generada para paciente ${data.correo}: ${generatedPassword}`);

    const db = getDb();
    let newUserId;
    let newPacienteId;

    const tx = db.transaction(() => {
      // 4. Crear cuenta de usuario con rol PACIENTE
      newUserId = userRepository.create({
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        clave_hash,
        rol: 'PACIENTE'
      });

      // 5. Crear ficha de paciente vinculada
      newPacienteId = pacienteRepository.create({
        ...data,
        id_usuario: newUserId
      });

      // 6. Auditoría de creación de ambas entidades
      auditService.log({
        id_usuario: userId,
        accion: 'CREAR',
        entidad: 'USUARIO',
        id_entidad: Number(newUserId),
        despues: { id: newUserId, correo: data.correo, rol: 'PACIENTE' }
      });

      auditService.log({
        id_usuario: userId,
        accion: 'CREAR',
        entidad: 'PACIENTE',
        id_entidad: Number(newPacienteId),
        despues: { id: newPacienteId, ...data, id_usuario: newUserId }
      });
    });

    tx();

    return {
      paciente: this.getById(newPacienteId),
      clave_generada: generatedPassword
    };
  },

  /**
   * Modificación de ficha de paciente con sincronización de cuenta de usuario (RFM-28, RN-18).
   */
  update(id, data, userId) {
    const current = this.getById(id);

    const existingDni = pacienteRepository.findByDni(data.dni, id);
    if (existingDni) {
      throw new ConflictError('El DNI ingresado ya pertenece a otro paciente.', {
        dni: 'El DNI ingresado ya se encuentra registrado en el sistema'
      });
    }

    // Validar correo único excluyendo la cuenta actual
    const existingCorreo = userRepository.findByCorreo(data.correo, current.id_usuario);
    if (existingCorreo) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado por otro usuario.', {
        correo: 'El correo electrónico ya se encuentra registrado'
      });
    }

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.update(id, data);

      if (current.id_usuario) {
        userRepository.update(current.id_usuario, {
          nombre: data.nombre,
          apellido: data.apellido,
          correo: data.correo
        });

        auditService.log({
          id_usuario: userId,
          accion: 'MODIFICAR',
          entidad: 'USUARIO',
          id_entidad: current.id_usuario,
          despues: { nombre: data.nombre, apellido: data.apellido, correo: data.correo }
        });
      }

      auditService.log({
        id_usuario: userId,
        accion: 'MODIFICAR',
        entidad: 'PACIENTE',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...data }
      });
    });

    tx();
    return this.getById(id);
  },

  /**
   * Desactivar paciente (D-15, D-16: solo Administrador).
   * Desactiva también la cuenta de usuario y cierra sus sesiones (RFM-06, RN-19).
   */
  deactivate(id, userId) {
    const current = this.getById(id);
    if (!current.estado) return current;

    const { fecha } = getNowInArgentina();
    const activeTurnos = pacienteRepository.countActiveFutureTurnos(id, fecha);
    if (activeTurnos > 0) {
      throw new ConflictError(
        `No es posible desactivar al paciente porque posee ${activeTurnos} turno(s) futuro(s) activo(s). Cancele o reprograme dichos turnos primero.`
      );
    }

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.setEstado(id, 0);

      if (current.id_usuario) {
        userRepository.setEstado(current.id_usuario, 0);
        userRepository.deleteSessions(current.id_usuario);

        auditService.log({
          id_usuario: userId,
          accion: 'DESACTIVAR',
          entidad: 'USUARIO',
          id_entidad: current.id_usuario,
          despues: { estado: 0 }
        });
      }

      auditService.log({
        id_usuario: userId,
        accion: 'DESACTIVAR',
        entidad: 'PACIENTE',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 0 }
      });
    });

    tx();
    return this.getById(id);
  },

  /**
   * Reactivar paciente y su cuenta vinculada (RFM-06, RN-19).
   */
  activate(id, userId) {
    const current = this.getById(id);
    if (current.estado) return current;

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.setEstado(id, 1);

      if (current.id_usuario) {
        userRepository.setEstado(current.id_usuario, 1);

        auditService.log({
          id_usuario: userId,
          accion: 'REACTIVAR',
          entidad: 'USUARIO',
          id_entidad: current.id_usuario,
          despues: { estado: 1 }
        });
      }

      auditService.log({
        id_usuario: userId,
        accion: 'REACTIVAR',
        entidad: 'PACIENTE',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 1 }
      });
    });

    tx();
    return this.getById(id);
  },

  /**
   * Restablecer contraseña de un paciente (RFM-23, CA-M14.1).
   * Disponible para Administrador y Recepcionista.
   */
  async resetPassword(id, userId) {
    const current = this.getById(id);
    if (!current.id_usuario) {
      throw new NotFoundError('El paciente no posee cuenta de usuario vinculada');
    }

    const newPassword = generatePassword();
    const clave_hash = await hashPassword(newPassword);

    console.log(`[Seguridad] Contraseña restablecida para paciente ${current.correo}: ${newPassword}`);

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.updateClave(current.id_usuario, clave_hash);
      userRepository.deleteSessions(current.id_usuario);

      auditService.log({
        id_usuario: userId,
        accion: 'RESTABLECER_CLAVE',
        entidad: 'USUARIO',
        id_entidad: current.id_usuario
      });

      auditService.log({
        id_usuario: userId,
        accion: 'RESTABLECER_CLAVE',
        entidad: 'PACIENTE',
        id_entidad: id
      });
    });

    tx();

    return { clave_generada: newPassword };
  }
};
```

## File: backend/src/services/turnoService.js
```javascript
import { turnoRepository } from '../repositories/turnoRepository.js';
import { pacienteRepository } from '../repositories/pacienteRepository.js';
import { profesionalRepository } from '../repositories/profesionalRepository.js';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../core/errors.js';
import { auditService } from './auditService.js';
import { getDb } from '../db/connection.js';
import { getNowInArgentina, getDiaSemana, horaToMinutos, minutosToHora, compareDateTime } from '../core/time.js';

export const turnoService = {
  /**
   * Ejecuta el pase automático a AUSENTE si pasaron 30 min desde el inicio (Q2 / D-30).
   * Se invoca de forma perezosa en consultas/escrituras para garantizar consistencia.
   */
  marcarAusentes() {
    const { fecha, hora } = getNowInArgentina();
    // hora actual menos 30 minutos
    const minActual = horaToMinutos(hora);
    const limiteMin = minActual - 30;

    let limiteFecha = fecha;
    let limiteHoraStr = minutosToHora(Math.max(0, limiteMin));

    if (limiteMin < 0) {
      // Cruzó medianoche: calcular fecha del día anterior
      const [y, m, d] = fecha.split('-').map(Number);
      const prevDay = new Date(Date.UTC(y, m - 1, d - 1));
      limiteFecha = prevDay.toISOString().slice(0, 10);
      limiteHoraStr = minutosToHora(1440 + limiteMin);
    }

    const fechaHoraLimite = `${limiteFecha} ${limiteHoraStr}`;
    const ausentes = turnoRepository.marcarTurnosAusentesAutomaticos(fechaHoraLimite);

    for (const t of ausentes) {
      auditService.log({
        id_usuario: null, // Acción automática del sistema
        accion: 'CAMBIAR_ESTADO',
        entidad: 'TURNO',
        id_entidad: t.id_turno,
        antes: { estado: t.estado },
        despues: { estado: 'AUSENTE', motivo: 'Pase automático por transcurso de 30 minutos sin cambio' }
      });
    }
  },

  list(filters = {}, user) {
    this.marcarAusentes();

    if (user.rol === 'PROFESIONAL') {
      if (!user.id_profesional) return []; // Corrección H-01
      return turnoRepository.findAll({ ...filters, id_profesional_scope: user.id_profesional });
    }

    if (user.rol === 'PACIENTE') {
      if (!user.id_paciente) return []; // Aislamiento estricto RN-15
      const list = turnoRepository.findAll({ ...filters, id_paciente_scope: user.id_paciente });

      // DM-21: Criterio de ordenación:
      // Primero los próximos activos (fecha futura o hoy >= horaActual, estado <> CANCELADO) fecha ASC, hora ASC
      // Luego los pasados o cancelados fecha DESC, hora DESC
      const { fecha: hoy, hora: horaActual } = getNowInArgentina();

      const isUpcomingActive = (t) => {
        if (t.estado === 'CANCELADO') return false;
        if (t.fecha > hoy) return true;
        if (t.fecha === hoy && t.hora >= horaActual) return true;
        return false;
      };

      const upcoming = [];
      const pastOrCancelled = [];

      for (const t of list) {
        // RFM-18: Omitir observaciones del profesional para el paciente
        const { observaciones, ...safeTurno } = t;
        if (isUpcomingActive(t)) {
          upcoming.push(safeTurno);
        } else {
          pastOrCancelled.push(safeTurno);
        }
      }

      upcoming.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
      pastOrCancelled.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));

      return [...upcoming, ...pastOrCancelled];
    }

    return turnoRepository.findAll(filters);
  },

  getById(id, user) {
    this.marcarAusentes();
    const turno = turnoRepository.findById(id);
    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }
    // Si es PROFESIONAL, solo puede consultar sus propios turnos (D-02, H-01)
    if (user.rol === 'PROFESIONAL' && (!user.id_profesional || turno.id_profesional !== user.id_profesional)) {
      throw new NotFoundError('Turno no encontrado');
    }
    // Si es PACIENTE, solo puede consultar sus propios turnos (RFM-19)
    if (user.rol === 'PACIENTE') {
      if (!user.id_paciente || turno.id_paciente !== user.id_paciente) {
        throw new NotFoundError('Turno no encontrado');
      }
      const { observaciones, ...safeTurno } = turno;
      return safeTurno;
    }
    return turno;
  },

  /**
   * Asignar nuevo turno (CU-03, RFB-40, D-26, D-27, D-28).
   * Estado inicial: PENDIENTE.
   */
  create(data, user) {
    this.marcarAusentes();

    // 0. Si es PACIENTE, forzar solicitud exclusiva para sí mismo (RFM-12)
    if (user.rol === 'PACIENTE') {
      if (!user.id_paciente) {
        throw new ForbiddenError('Ficha de paciente inactiva o no vinculada');
      }
      if (data.id_paciente && data.id_paciente !== user.id_paciente) {
        throw new ForbiddenError('El paciente solo puede solicitar turnos para sí mismo');
      }
      data.id_paciente = user.id_paciente;
      data.observaciones = null;
    } else {
      if (!data.id_paciente) {
        throw new ValidationError('Debe seleccionar un paciente', {
          id_paciente: 'Debe seleccionar un paciente'
        });
      }
    }

    // 1. Validar que el paciente exista y esté activo
    const paciente = pacienteRepository.findById(data.id_paciente);
    if (!paciente || !paciente.estado) {
      throw new ValidationError('El paciente no existe o está inactivo.', {
        id_paciente: 'Paciente inexistente o inactivo'
      });
    }

    // 2. Validar que el profesional exista, esté activo y tenga consultorio asignado
    const profesional = profesionalRepository.findById(data.id_profesional);
    if (!profesional || !profesional.estado) {
      throw new ValidationError('El profesional no existe o está inactivo.', {
        id_profesional: 'Profesional inexistente o inactivo'
      });
    }
    if (!profesional.consultorio) {
      throw new ValidationError('El profesional no tiene consultorio fijo asignado.', {
        id_profesional: 'Profesional sin consultorio asignado'
      });
    }

    // 3. No permitir turnos en fechas/horas pasadas (D-26)
    const { fecha: hoy, hora: horaActual } = getNowInArgentina();
    if (compareDateTime(data.fecha, data.hora, hoy, horaActual) <= 0) {
      throw new ValidationError('No se pueden asignar turnos para fechas u horarios pasados.', {
        fecha: 'Fecha u horario anterior al momento actual'
      });
    }

    // 4. Validar que el horario caiga dentro de la disponibilidad configurada del profesional
    const diaSemanaTurno = getDiaSemana(data.fecha);
    const disponibilidad = profesionalRepository.getDisponibilidad(data.id_profesional);
    const turnoMin = horaToMinutos(data.hora);

    const estaEnDisponibilidad = disponibilidad.some((f) => {
      if (f.dia_semana !== diaSemanaTurno) return false;
      const ini = horaToMinutos(f.hora_inicio);
      const fin = horaToMinutos(f.hora_fin);
      return turnoMin >= ini && turnoMin + 30 <= fin;
    });

    if (!estaEnDisponibilidad) {
      throw new ValidationError('El horario seleccionado se encuentra fuera de la agenda de atención del profesional.', {
        hora: 'Horario fuera de disponibilidad'
      });
    }

    // 5. Validar que el profesional no tenga otro turno activo en ese horario
    const conflictProf = turnoRepository.findConflictTurnoProfesional(data.id_profesional, data.fecha, data.hora);
    if (conflictProf) {
      throw new ConflictError('El horario dejó de estar disponible. Seleccione otro.');
    }

    // 6. Validar que el paciente no tenga otro turno activo en ese mismo horario (D-27)
    const conflictPac = turnoRepository.findConflictTurnoPaciente(data.id_paciente, data.fecha, data.hora);
    if (conflictPac) {
      throw new ConflictError('El paciente ya posee otro turno asignado en la misma fecha y horario.');
    }

    const db = getDb();
    let newId;

    const tx = db.transaction(() => {
      newId = turnoRepository.create({
        ...data,
        creado_por: user.id
      });

      auditService.log({
        id_usuario: user.id,
        accion: 'CREAR',
        entidad: 'TURNO',
        id_entidad: Number(newId),
        despues: { id: newId, ...data, estado: 'PENDIENTE' }
      });
    });

    tx();
    return this.getById(newId, user);
  },

  /**
   * Modificación de turno (Q11 / D-33).
   * - Profesional, fecha, hora, motivo: modificables mientras el turno esté PENDIENTE o CONFIRMADO y antes de iniciar.
   * - Observaciones: modificable mientras el turno esté EN_CONSULTORIO (por Recepción/Admin o el médico asignado).
   * - Estados finales (ASISTIDO, AUSENTE, CANCELADO): no permiten modificaciones.
   * - Paciente: no modificable jamás.
   */
  update(id, data, user) {
    if (user.rol === 'PACIENTE') {
      throw new ForbiddenError('Los pacientes no tienen permiso para modificar turnos.');
    }
    this.marcarAusentes();
    const current = this.getById(id, user);

    if (['ASISTIDO', 'AUSENTE', 'CANCELADO'].includes(current.estado)) {
      throw new ConflictError(`Un turno en estado ${current.estado} no puede ser modificado.`);
    }

    const { fecha: hoy, hora: horaActual } = getNowInArgentina();
    const yaInicio = compareDateTime(current.fecha, current.hora, hoy, horaActual) <= 0;

    const fieldsToUpdate = {};

    // Caso 1: Observaciones durante la consulta (EN_CONSULTORIO)
    if (data.observaciones !== undefined) {
      if (current.estado !== 'EN_CONSULTORIO') {
        throw new ValidationError('Las observaciones de consulta solo pueden registrarse mientras el turno esté En Consultorio.');
      }
      fieldsToUpdate.observaciones = data.observaciones;
    }

    // Caso 2: Reprogramación (profesional, fecha, hora, motivo)
    const intentaReprogramar = data.id_profesional !== undefined || data.fecha !== undefined || data.hora !== undefined || data.motivo_consulta !== undefined;
    if (intentaReprogramar) {
      if (user.rol === 'PROFESIONAL') {
        throw new ForbiddenError('Los profesionales no pueden reprogramar turnos.');
      }
      if (!['PENDIENTE', 'CONFIRMADO'].includes(current.estado) || yaInicio) {
        throw new ConflictError('Solo se pueden reprogramar o cambiar los datos del turno antes de su inicio.');
      }

      const targetProf = data.id_profesional || current.id_profesional;
      const targetFecha = data.fecha || current.fecha;
      const targetHora = data.hora || current.hora;

      // Si cambia fecha/hora/profesional, validar disponibilidad y solapamiento
      if (targetProf !== current.id_profesional || targetFecha !== current.fecha || targetHora !== current.hora) {
        if (compareDateTime(targetFecha, targetHora, hoy, horaActual) <= 0) {
          throw new ValidationError('La nueva fecha y horario no pueden ser anteriores al momento actual.');
        }

        const profesional = profesionalRepository.findById(targetProf);
        if (!profesional || !profesional.estado) {
          throw new ValidationError('El profesional seleccionado no existe o está inactivo.');
        }

        const diaSemana = getDiaSemana(targetFecha);
        const disp = profesionalRepository.getDisponibilidad(targetProf);
        const tMin = horaToMinutos(targetHora);

        const cubre = disp.some((f) => {
          if (f.dia_semana !== diaSemana) return false;
          const ini = horaToMinutos(f.hora_inicio);
          const fin = horaToMinutos(f.hora_fin);
          return tMin >= ini && tMin + 30 <= fin;
        });

        if (!cubre) {
          throw new ValidationError('El horario solicitado no se encuentra dentro de la disponibilidad del profesional.');
        }

        const confProf = turnoRepository.findConflictTurnoProfesional(targetProf, targetFecha, targetHora, id);
        if (confProf) {
          throw new ConflictError('El nuevo horario seleccionado no está disponible.');
        }

        const confPac = turnoRepository.findConflictTurnoPaciente(current.id_paciente, targetFecha, targetHora, id);
        if (confPac) {
          throw new ConflictError('El paciente ya posee otro turno en la nueva fecha y horario solicitado.');
        }

        fieldsToUpdate.id_profesional = targetProf;
        fieldsToUpdate.fecha = targetFecha;
        fieldsToUpdate.hora = targetHora;
      }

      if (data.motivo_consulta !== undefined) {
        fieldsToUpdate.motivo_consulta = data.motivo_consulta;
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return current;
    }

    const db = getDb();
    const tx = db.transaction(() => {
      turnoRepository.update(id, fieldsToUpdate);
      auditService.log({
        id_usuario: user.id,
        accion: 'MODIFICAR',
        entidad: 'TURNO',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...fieldsToUpdate }
      });
    });

    tx();
    return this.getById(id, user);
  },

  /**
   * Transición de estado (Q1, CU-06, D-03, D-04, D-32).
   * Matriz de transiciones:
   * PENDIENTE -> CONFIRMADO | CANCELADO
   * CONFIRMADO -> EN_CONSULTORIO | AUSENTE | CANCELADO
   * EN_CONSULTORIO -> ASISTIDO
   * ASISTIDO / AUSENTE / CANCELADO: finales
   */
  cambiarEstado(id, nuevoEstado, user) {
    this.marcarAusentes();
    const current = this.getById(id, user);

    // Si es PACIENTE, solo se permite cancelar turnos propios en estado PENDIENTE o CONFIRMADO
    if (user.rol === 'PACIENTE') {
      if (nuevoEstado !== 'CANCELADO') {
        throw new ForbiddenError('Los pacientes no tienen permiso para modificar el estado de turnos.');
      }
      if (current.estado !== 'PENDIENTE' && current.estado !== 'CONFIRMADO') {
        throw new ConflictError('Solo se pueden cancelar turnos en estado Pendiente o Confirmado.');
      }
    }

    // Cancelar turno: solo Recepción, Admin y Paciente (los profesionales no pueden cancelar directamente D-04)
    if (nuevoEstado === 'CANCELADO' && user.rol === 'PROFESIONAL') {
      throw new ForbiddenError('Los profesionales médicos no pueden cancelar turnos directamente.');
    }

    // Validar transición según la tabla de Q1
    const allowedTransitions = {
      PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
      CONFIRMADO: ['EN_CONSULTORIO', 'AUSENTE', 'CANCELADO'],
      EN_CONSULTORIO: ['ASISTIDO'],
      ASISTIDO: [],
      AUSENTE: [],
      CANCELADO: []
    };

    const validNextStates = allowedTransitions[current.estado] || [];
    if (!validNextStates.includes(nuevoEstado)) {
      throw new ConflictError(
        `Transición no permitida: no se puede pasar un turno de estado '${current.estado}' a '${nuevoEstado}'.`
      );
    }

    const extraFields = {};
    const { fecha: hoy, hora: horaActual, fechaHora } = getNowInArgentina();

    // Regla de registro de llegada a EN_CONSULTORIO (CU-06, D-32):
    // Solo turnos del día actual y dentro de su franja horaria de media hora [hora, hora+30)
    if (nuevoEstado === 'EN_CONSULTORIO') {
      if (current.fecha !== hoy) {
        throw new ValidationError('La llegada del paciente solo puede registrarse para turnos del día actual.');
      }
      const tMin = horaToMinutos(current.hora);
      const actMin = horaToMinutos(horaActual);
      if (actMin < tMin || actMin >= tMin + 30) {
        throw new ValidationError('La llegada del paciente solo puede registrarse durante la franja horaria correspondiente al turno.');
      }
      extraFields.fecha_hora_llegada = fechaHora;
    }

    if (nuevoEstado === 'CANCELADO') {
      extraFields.cancelado_por = user.id;
      extraFields.fecha_cancelacion = fechaHora;
    }

    const db = getDb();
    const tx = db.transaction(() => {
      turnoRepository.setEstado(id, nuevoEstado, extraFields);
      auditService.log({
        id_usuario: user.id,
        accion: 'CAMBIAR_ESTADO',
        entidad: 'TURNO',
        id_entidad: id,
        antes: { estado: current.estado },
        despues: { estado: nuevoEstado, ...extraFields }
      });
    });

    tx();
    return this.getById(id, user);
  },

  /**
   * Cancelar turno (equivalente a cambiar estado a CANCELADO).
   */
  cancelar(id, user) {
    return this.cambiarEstado(id, 'CANCELADO', user);
  },

  /**
   * Horarios libres para una fecha y profesional/especialidad (RF-06, CU-03, Q5).
   */
  getHorariosLibres({ fecha, id_profesional, id_especialidad }) {
    this.marcarAusentes();
    const db = getDb();

    // Obtener lista de profesionales a evaluar
    let docs = [];
    if (id_profesional) {
      const p = profesionalRepository.findById(id_profesional);
      if (p && p.estado && p.consultorio) docs = [p];
    } else if (id_especialidad) {
      docs = db.prepare(`
        SELECT id_profesional, nombre, apellido, consultorio
        FROM profesional
        WHERE id_especialidad = ? AND estado = 1 AND consultorio IS NOT NULL
      `).all(id_especialidad);
    }

    const { fecha: hoy, hora: horaActual } = getNowInArgentina();
    const esHoy = fecha === hoy;
    const minActual = horaToMinutos(horaActual);
    const diaSemana = getDiaSemana(fecha);

    const resultado = [];

    for (const doc of docs) {
      const franjas = profesionalRepository.getDisponibilidad(doc.id_profesional);
      const turnosOcupados = db.prepare(`
        SELECT hora FROM turno
        WHERE id_profesional = ? AND fecha = ? AND estado <> 'CANCELADO'
      `).all(doc.id_profesional, fecha).map(t => t.hora);

      const slotsLibres = [];

      for (const f of franjas) {
        if (f.dia_semana !== diaSemana) continue;

        let slot = horaToMinutos(f.hora_inicio);
        const fin = horaToMinutos(f.hora_fin);

        while (slot + 30 <= fin) {
          const slotHoraStr = minutosToHora(slot);

          // Si es hoy, no ofrecer horarios que ya pasaron
          const yaPaso = esHoy && slot <= minActual;
          const ocupado = turnosOcupados.includes(slotHoraStr);

          if (!yaPaso && !ocupado) {
            slotsLibres.push(slotHoraStr);
          }
          slot += 30;
        }
      }

      if (slotsLibres.length > 0) {
        resultado.push({
          id_profesional: doc.id_profesional,
          profesional: `${doc.nombre} ${doc.apellido}`,
          consultorio: doc.consultorio,
          horarios: slotsLibres
        });
      }
    }

    return resultado;
  }
};
```

## File: backend/src/services/userService.js
```javascript
import { userRepository } from '../repositories/userRepository.js';
import { profesionalRepository } from '../repositories/profesionalRepository.js';
import { pacienteRepository } from '../repositories/pacienteRepository.js';
import { especialidadRepository } from '../repositories/especialidadRepository.js';
import { hashPassword, generatePassword } from '../core/passwords.js';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../core/errors.js';
import { auditService } from './auditService.js';
import { getDb } from '../db/connection.js';
import { getNowInArgentina, getDiaSemana, horaToMinutos } from '../core/time.js';

export const userService = {
  listUsers(filters = {}) {
    return userRepository.findAll(filters);
  },

  getUserById(id) {
    const user = userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return user;
  },

  /**
   * Creación atómica de usuario y profesional con disponibilidad (Q4).
   * Genera contraseña inicial segura, la imprime por consola y la retorna una sola vez (D-10).
   */
  async createUser(data, adminUserId) {
    // 1. Validar unicidad de correo
    const existingCorreo = userRepository.findByCorreo(data.correo);
    if (existingCorreo) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado.', {
        correo: 'El correo electrónico ya se encuentra registrado'
      });
    }

    // 2. Si es PROFESIONAL, validar especialidad, matrícula, consultorio y franjas
    if (data.rol === 'PROFESIONAL') {
      const especialidad = especialidadRepository.findById(data.profesional.id_especialidad);
      if (!especialidad || !especialidad.estado) {
        throw new ValidationError('La especialidad seleccionada no existe o está inactiva.', {
          'profesional.id_especialidad': 'Especialidad inexistente o inactiva'
        });
      }

      const existingMatricula = profesionalRepository.findByMatricula(data.profesional.matricula);
      if (existingMatricula) {
        throw new ConflictError('La matrícula ingresada ya se encuentra registrada en el sistema.', {
          'profesional.matricula': 'Matrícula ya registrada'
        });
      }

      const existingConsultorio = profesionalRepository.findByConsultorio(data.profesional.consultorio);
      if (existingConsultorio) {
        throw new ConflictError('El consultorio ingresado ya se encuentra asignado a otro profesional.', {
          'profesional.consultorio': 'Consultorio ya asignado'
        });
      }

      // Validar solapamiento de franjas horarias dentro del mismo día (D-22 / Q5)
      this.validateFranjasOverlap(data.disponibilidad);
    }

    // 2b. Si es PACIENTE, validar DNI único
    if (data.rol === 'PACIENTE') {
      const existingDni = pacienteRepository.findByDni(data.paciente.dni);
      if (existingDni) {
        throw new ConflictError('El DNI ingresado ya se encuentra registrado en el sistema.', {
          'paciente.dni': 'DNI ya registrado'
        });
      }
    }

    // 3. Generar contraseña aleatoria que cumple la política
    const generatedPassword = generatePassword();
    const clave_hash = await hashPassword(generatedPassword);

    console.log(`[Seguridad] Contraseña generada para ${data.correo}: ${generatedPassword}`);

    const db = getDb();
    let newUserId;
    let newProfesionalId = null;

    const tx = db.transaction(() => {
      // Crear usuario
      newUserId = userRepository.create({
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        clave_hash,
        rol: data.rol
      });

      auditService.log({
        id_usuario: adminUserId,
        accion: 'CREAR',
        entidad: 'USUARIO',
        id_entidad: Number(newUserId),
        despues: { id: newUserId, nombre: data.nombre, apellido: data.apellido, correo: data.correo, rol: data.rol }
      });

      // Si es profesional, crear entidad y disponibilidad en la misma transacción
      if (data.rol === 'PROFESIONAL') {
        newProfesionalId = profesionalRepository.create({
          id_especialidad: data.profesional.id_especialidad,
          id_usuario: Number(newUserId),
          matricula: data.profesional.matricula,
          nombre: data.nombre,
          apellido: data.apellido,
          consultorio: data.profesional.consultorio
        });

        profesionalRepository.setDisponibilidad(Number(newProfesionalId), data.disponibilidad);

        auditService.log({
          id_usuario: adminUserId,
          accion: 'CREAR',
          entidad: 'PROFESIONAL',
          id_entidad: Number(newProfesionalId),
          despues: {
            id: newProfesionalId,
            id_usuario: newUserId,
            matricula: data.profesional.matricula,
            consultorio: data.profesional.consultorio,
            disponibilidad: data.disponibilidad
          }
        });
      }

      // Si es paciente, crear ficha vinculada
      if (data.rol === 'PACIENTE') {
        const newPacId = pacienteRepository.create({
          ...data.paciente,
          nombre: data.nombre,
          apellido: data.apellido,
          correo: data.correo,
          id_usuario: Number(newUserId)
        });

        auditService.log({
          id_usuario: adminUserId,
          accion: 'CREAR',
          entidad: 'PACIENTE',
          id_entidad: Number(newPacId),
          despues: { id: newPacId, id_usuario: newUserId, ...data.paciente }
        });
      }
    });

    tx();

    const createdUser = this.getUserById(newUserId);
    return {
      usuario: createdUser,
      clave_generada: generatedPassword
    };
  },

  updateUser(id, data, adminUserId) {
    const current = this.getUserById(id);

    // D-13: Un Administrador no puede modificar a otro administrador por API
    if (current.rol === 'ADMINISTRADOR' && current.id_usuario !== adminUserId) {
      throw new ForbiddenError('Los usuarios administradores solo pueden ser administrados directamente en la base de datos.');
    }

    const existing = userRepository.findByCorreo(data.correo, id);
    if (existing) {
      throw new ConflictError('El correo electrónico ya pertenece a otro usuario.', {
        correo: 'El correo electrónico ya se encuentra registrado'
      });
    }

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.update(id, data);

      // Si tiene profesional vinculado, mantener nombre y apellido sincronizados
      if (current.id_profesional) {
        db.prepare(`
          UPDATE profesional
          SET nombre = ?, apellido = ?
          WHERE id_profesional = ?
        `).run(data.nombre, data.apellido, current.id_profesional);
      }

      // Si tiene paciente vinculado, mantener nombre, apellido y correo sincronizados (RFM-28)
      if (current.rol === 'PACIENTE' && current.id_paciente) {
        db.prepare(`
          UPDATE paciente
          SET nombre = ?, apellido = ?, correo = ?
          WHERE id_paciente = ?
        `).run(data.nombre, data.apellido, data.correo, current.id_paciente);

        auditService.log({
          id_usuario: adminUserId,
          accion: 'MODIFICAR',
          entidad: 'PACIENTE',
          id_entidad: current.id_paciente,
          despues: { nombre: data.nombre, apellido: data.apellido, correo: data.correo }
        });
      }

      auditService.log({
        id_usuario: adminUserId,
        accion: 'MODIFICAR',
        entidad: 'USUARIO',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...data }
      });
    });

    tx();
    return this.getUserById(id);
  },

  deactivateUser(id, adminUserId) {
    const current = this.getUserById(id);

    // D-13: No autodesactivarse ni desactivar a otros administradores
    if (id === adminUserId) {
      throw new ForbiddenError('Un administrador no puede desactivar su propia cuenta.');
    }
    if (current.rol === 'ADMINISTRADOR') {
      throw new ForbiddenError('Los usuarios administradores no pueden ser desactivados mediante la aplicación.');
    }

    // Regla acordada: si está vinculado a un profesional, debe desactivarse primero el profesional
    if (current.id_profesional) {
      const prof = profesionalRepository.findById(current.id_profesional);
      if (prof && prof.estado) {
        throw new ConflictError('Desactive primero el profesional asociado antes de desactivar este usuario.');
      }
    }

    // Si es paciente, verificar que no tenga turnos futuros activos (RFM-06, RN-19)
    if (current.rol === 'PACIENTE' && current.id_paciente) {
      const { fecha } = getNowInArgentina();
      const activeTurnos = pacienteRepository.countActiveFutureTurnos(current.id_paciente, fecha);
      if (activeTurnos > 0) {
        throw new ConflictError(
          `No es posible desactivar al usuario porque posee ${activeTurnos} turno(s) futuro(s) activo(s). Cancele o reprograme dichos turnos primero.`
        );
      }
    }

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.setEstado(id, 0);
      userRepository.deleteSessions(id);

      if (current.rol === 'PACIENTE' && current.id_paciente) {
        pacienteRepository.setEstado(current.id_paciente, 0);
        auditService.log({
          id_usuario: adminUserId,
          accion: 'DESACTIVAR',
          entidad: 'PACIENTE',
          id_entidad: current.id_paciente,
          despues: { estado: 0 }
        });
      }

      auditService.log({
        id_usuario: adminUserId,
        accion: 'DESACTIVAR',
        entidad: 'USUARIO',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 0 }
      });
    });

    tx();
    return this.getUserById(id);
  },

  activateUser(id, adminUserId) {
    const current = this.getUserById(id);
    if (current.estado) return current;

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.setEstado(id, 1);

      if (current.rol === 'PACIENTE' && current.id_paciente) {
        pacienteRepository.setEstado(current.id_paciente, 1);
        auditService.log({
          id_usuario: adminUserId,
          accion: 'REACTIVAR',
          entidad: 'PACIENTE',
          id_entidad: current.id_paciente,
          despues: { estado: 1 }
        });
      }

      auditService.log({
        id_usuario: adminUserId,
        accion: 'REACTIVAR',
        entidad: 'USUARIO',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 1 }
      });
    });

    tx();
    return this.getUserById(id);
  },

  async resetPassword(id, adminUserId) {
    const current = this.getUserById(id);
    if (current.rol === 'ADMINISTRADOR' && current.id_usuario !== adminUserId) {
      throw new ForbiddenError('No se puede restablecer la contraseña de otro usuario Administrador.');
    }

    const newPassword = generatePassword();
    const clave_hash = await hashPassword(newPassword);

    console.log(`[Seguridad] Contraseña restablecida para ${current.correo}: ${newPassword}`);

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.updateClave(id, clave_hash);
      userRepository.deleteSessions(id); // Cierra sesiones activas para exigir login con nueva clave

      auditService.log({
        id_usuario: adminUserId,
        accion: 'RESTABLECER_CLAVE',
        entidad: 'USUARIO',
        id_entidad: id
      });
    });

    tx();

    return { clave_generada: newPassword };
  },

  // ---------------------------------------------------------------------------
  // GESTIÓN DE PROFESIONALES
  // ---------------------------------------------------------------------------
  listProfesionales(filters = {}, user) {
    // Si es PROFESIONAL, solo ve sus propios datos (D-02, D-07, H-01)
    if (user.rol === 'PROFESIONAL') {
      if (!user.id_profesional) return [];
      const p = profesionalRepository.findById(user.id_profesional);
      return p ? [p] : [];
    }

    // Si es PACIENTE, solo ve profesionales activos y datos sanitizados (RFM-09, CA-M04.2, CA-M04.3)
    if (user.rol === 'PACIENTE') {
      const activeFilters = { ...filters, estado: 1 };
      const list = profesionalRepository.findAll(activeFilters);
      return list.map(p => ({
        id_profesional: p.id_profesional,
        nombre: p.nombre,
        apellido: p.apellido,
        consultorio: p.consultorio,
        id_especialidad: p.id_especialidad,
        especialidad_nombre: p.especialidad_nombre
      }));
    }

    return profesionalRepository.findAll(filters);
  },

  getProfesionalById(id, user) {
    // Si es PROFESIONAL, solo puede consultar su propio ID (H-01)
    if (user.rol === 'PROFESIONAL' && (!user.id_profesional || user.id_profesional !== id)) {
      throw new NotFoundError('Profesional no encontrado');
    }

    const p = profesionalRepository.findById(id);
    if (!p) {
      throw new NotFoundError('Profesional no encontrado');
    }

    // Si es PACIENTE, solo consultar profesionales activos con datos sanitizados (RFM-09)
    if (user.rol === 'PACIENTE') {
      if (!p.estado) {
        throw new NotFoundError('Profesional no encontrado');
      }
      return {
        id_profesional: p.id_profesional,
        nombre: p.nombre,
        apellido: p.apellido,
        consultorio: p.consultorio,
        id_especialidad: p.id_especialidad,
        especialidad_nombre: p.especialidad_nombre
      };
    }

    return p;
  },

  updateProfesional(id, data, adminUserId) {
    const current = profesionalRepository.findById(id);
    if (!current) throw new NotFoundError('Profesional no encontrado');

    const especialidad = especialidadRepository.findById(data.id_especialidad);
    if (!especialidad || !especialidad.estado) {
      throw new ValidationError('La especialidad seleccionada no existe o está inactiva.', {
        id_especialidad: 'Especialidad inválida'
      });
    }

    const existingMat = profesionalRepository.findByMatricula(data.matricula, id);
    if (existingMat) {
      throw new ConflictError('La matrícula ya pertenece a otro profesional registrado.', {
        matricula: 'Matrícula duplicada'
      });
    }

    if (data.consultorio) {
      const existingCons = profesionalRepository.findByConsultorio(data.consultorio, id);
      if (existingCons) {
        throw new ConflictError('El consultorio ingresado ya se encuentra asignado a otro profesional.', {
          consultorio: 'Consultorio ya asignado'
        });
      }
    }

    const db = getDb();
    const tx = db.transaction(() => {
      profesionalRepository.update(id, data);
      auditService.log({
        id_usuario: adminUserId,
        accion: 'MODIFICAR',
        entidad: 'PROFESIONAL',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...data }
      });
    });

    tx();
    return this.getProfesionalById(id, { rol: 'ADMINISTRADOR' });
  },

  /**
   * Desactivar profesional (Q10, D-15, D-16).
   * Requiere que no tenga turnos futuros activos, que el consultorio haya sido liberado (puesto en null)
   * y que no tenga franjas de disponibilidad configuradas.
   * Al completarse con éxito, desactiva también el usuario vinculado y cierra sus sesiones.
   */
  deactivateProfesional(id, adminUserId) {
    const current = profesionalRepository.findById(id);
    if (!current) throw new NotFoundError('Profesional no encontrado');
    if (!current.estado) return current;

    const { fecha } = getNowInArgentina();
    const activeTurnos = profesionalRepository.countActiveFutureTurnos(id, fecha);
    const blockers = [];

    if (activeTurnos > 0) {
      blockers.push(`Posee ${activeTurnos} turno(s) futuro(s) activo(s). Debe cancelarlos o reprogramarlos.`);
    }
    if (current.consultorio !== null && current.consultorio !== '') {
      blockers.push('El consultorio debe ser liberado (actualizado a null/vacío) antes de desactivar.');
    }
    const disp = profesionalRepository.getDisponibilidad(id);
    if (disp.length > 0) {
      blockers.push('Debe eliminar la configuración de disponibilidad (agenda) antes de desactivar.');
    }

    if (blockers.length > 0) {
      throw new ConflictError(`No es posible desactivar el profesional: ${blockers.join(' ')}`);
    }

    const db = getDb();
    const tx = db.transaction(() => {
      profesionalRepository.setEstado(id, 0);

      // Desactivar también usuario vinculado y cerrar sesiones (Q10)
      if (current.id_usuario) {
        userRepository.setEstado(current.id_usuario, 0);
        userRepository.deleteSessions(current.id_usuario);
      }

      auditService.log({
        id_usuario: adminUserId,
        accion: 'DESACTIVAR',
        entidad: 'PROFESIONAL',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 0 }
      });
    });

    tx();
    return this.getProfesionalById(id, { rol: 'ADMINISTRADOR' });
  },

  activateProfesional(id, adminUserId) {
    const current = profesionalRepository.findById(id);
    if (!current) throw new NotFoundError('Profesional no encontrado');
    if (current.estado) return current;

    const db = getDb();
    const tx = db.transaction(() => {
      profesionalRepository.setEstado(id, 1);
      if (current.id_usuario) {
        userRepository.setEstado(current.id_usuario, 1);
      }

      auditService.log({
        id_usuario: adminUserId,
        accion: 'REACTIVAR',
        entidad: 'PROFESIONAL',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 1 }
      });
    });

    tx();
    return this.getProfesionalById(id, { rol: 'ADMINISTRADOR' });
  },

  // ---------------------------------------------------------------------------
  // GESTIÓN DE DISPONIBILIDAD
  // ---------------------------------------------------------------------------
  getDisponibilidad(id_profesional, user) {
    this.getProfesionalById(id_profesional, user);
    return profesionalRepository.getDisponibilidad(id_profesional);
  },

  /**
   * Modifica la disponibilidad de un profesional (RFB-26, RFB-30, D-23).
   * Si existen turnos futuros activos que quedan fuera del nuevo horario, se bloquea (409).
   */
  updateDisponibilidad(id_profesional, franjas, adminUserId) {
    const prof = profesionalRepository.findById(id_profesional);
    if (!prof) throw new NotFoundError('Profesional no encontrado');
    if (!prof.estado) {
      throw new ValidationError('No se puede configurar disponibilidad para un profesional inactivo.');
    }

    this.validateFranjasOverlap(franjas);

    // Verificar si existen turnos futuros activos que quedan fuera del nuevo cronograma (D-23)
    const { fecha, hora } = getNowInArgentina();
    const db = getDb();
    const turnosFuturos = db.prepare(`
      SELECT id_turno, fecha, hora, estado
      FROM turno
      WHERE id_profesional = ?
        AND (fecha > ? OR (fecha = ? AND hora >= ?))
        AND estado IN ('PENDIENTE', 'CONFIRMADO')
    `).all(id_profesional, fecha, fecha, hora);

    const turnosConflicto = [];
    for (const t of turnosFuturos) {
      const diaSemanaTurno = getDiaSemana(t.fecha);
      const turnoMin = horaToMinutos(t.hora);

      // Buscar si el turno cae en alguna de las nuevas franjas
      const cubre = franjas.some((f) => {
        if (f.dia_semana !== diaSemanaTurno) return false;
        const ini = horaToMinutos(f.hora_inicio);
        const fin = horaToMinutos(f.hora_fin);
        return turnoMin >= ini && turnoMin + 30 <= fin;
      });

      if (!cubre) {
        turnosConflicto.push(`Turno #${t.id_turno} (${t.fecha} ${t.hora})`);
      }
    }

    if (turnosConflicto.length > 0) {
      throw new ConflictError(
        `No es posible actualizar la agenda porque existen turnos futuros que quedarían fuera del nuevo horario: ${turnosConflicto.join(', ')}. Cancele o reprograme dichos turnos primero.`
      );
    }

    const tx = db.transaction(() => {
      profesionalRepository.setDisponibilidad(id_profesional, franjas);
      auditService.log({
        id_usuario: adminUserId,
        accion: 'MODIFICAR_DISPONIBILIDAD',
        entidad: 'DISPONIBILIDAD',
        id_entidad: id_profesional,
        despues: { franjas }
      });
    });

    tx();
    return profesionalRepository.getDisponibilidad(id_profesional);
  },

  // Validador de solapamiento de franjas por día
  validateFranjasOverlap(franjas) {
    if (!franjas || franjas.length === 0) return;

    const porDia = {};
    for (const f of franjas) {
      porDia[f.dia_semana] = porDia[f.dia_semana] || [];
      porDia[f.dia_semana].push(f);
    }

    for (const [dia, lista] of Object.entries(porDia)) {
      // Ordenar por inicio
      lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      for (let i = 0; i < lista.length - 1; i++) {
        const actual = lista[i];
        const siguiente = lista[i + 1];
        if (actual.hora_fin > siguiente.hora_inicio) {
          throw new ValidationError(
            `Existe solapamiento en las franjas horarias del día ${dia}: ${actual.hora_inicio}-${actual.hora_fin} se superpone con ${siguiente.hora_inicio}-${siguiente.hora_fin}.`
          );
        }
      }
    }
  }
};
```

## File: backend/src/app.js
```javascript
import express from 'express';
import { config } from './config/index.js';
import { authRouter } from './routes/authRoutes.js';
import { especialidadRouter } from './routes/especialidadRoutes.js';
import { userRouter, profesionalRouter } from './routes/userRoutes.js';
import { pacienteRouter } from './routes/pacienteRoutes.js';
import { turnoRouter } from './routes/turnoRoutes.js';
import { agendaRouter, dashboardRouter } from './routes/agendaRoutes.js';
import { errorHandler } from './core/errorHandler.js';

export function createApp() {
  const app = express();

  // Parsing JSON bodies
  app.use(express.json());

  // Log de todas las llamadas para ver que corno pasa
  app.use((req, res, next) => {
    console.log("===== LLEGÓ UNA NUEVA PETICIÓN =====");
    const inicio = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - inicio;
      console.log(`[${req.method}] ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
      if (req.method !== 'GET' && req.body && Object.keys(req.body).length) {
        console.log('  body:', req.body);
      }
      if (req.query && Object.keys(req.query).length) {
        console.log('  query:', req.query);
      }
      console.log("================================");
    });
    next();
  });

  // Servir frontend unificado (HTMLs, estilos en css/, scripts en js/)
  app.use(express.static(config.frontendDir));

  // Rutas API
  app.use('/api/auth', authRouter);
  app.use('/api/especialidades', especialidadRouter);
  app.use('/api/usuarios', userRouter);
  app.use('/api/profesionales', profesionalRouter);
  app.use('/api/pacientes', pacienteRouter);
  app.use('/api/turnos', turnoRouter);
  app.use('/api/agenda', agendaRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Endpoint de verificación inicial / salud
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, mensaje: 'Salud Turnos API en línea' });
  });

  // Manejador centralizado de errores
  app.use(errorHandler);

  return app;
}
```

## File: backend/test/auth.test.js
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../scripts/db-reset.js';
import { closeDb } from '../src/db/connection.js';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.resolve(__dirname, '../data/test_auth.db');

test('Flujo completo de Autenticación y Sesiones', async (t) => {
  // Inicializar base de datos limpia para pruebas
  resetDatabase(testDbPath);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
    closeDb();
  });

  let sessionCookie = '';

  // 1. Intento con credenciales vacías -> 400
  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: '', clave: '' })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
    assert.ok(data.campos?.correo);
  }

  // 2. Intento con credenciales incorrectas -> 401 sin revelar cuál falló
  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@saludturnos.com', clave: 'WrongPass#123' })
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Usuario o contraseña incorrectos');
  }

  // 3. Inicio de sesión exitoso como Administrador -> 200 y Set-Cookie
  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@saludturnos.com', clave: 'SaludTurnos#2026' })
    });
    assert.equal(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.match(setCookie, /st_sid=/);
    sessionCookie = setCookie.split(';')[0];

    const data = await res.json();
    assert.equal(data.usuario.rol, 'ADMINISTRADOR');
    assert.equal(data.usuario.correo, 'admin@saludturnos.com');
  }

  // 4. Consulta de identidad /api/auth/me con la cookie de sesión -> 200
  {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: sessionCookie }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.usuario.rol, 'ADMINISTRADOR');
  }

  // 5. Consulta sin cookie -> 401
  {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  }

  // 6. Cierre de sesión -> 200 y expiración de cookie
  {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie }
    });
    assert.equal(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.match(setCookie, /Max-Age=0/);
  }

  // 7. Acceso a /api/auth/me posterior al logout -> 401
  {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: sessionCookie }
    });
    assert.equal(res.status, 401);
  }
});
```

## File: backend/test/core.test.js
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizar, claveConsultorio, escapeLike } from '../src/core/text.js';
import { hashPassword, verifyPassword, generatePassword } from '../src/core/passwords.js';
import { horaToMinutos, minutosToHora, getDiaSemana } from '../src/core/time.js';
import { parseCookies, serializeCookie } from '../src/core/cookies.js';

test('Normalización de texto y clave de consultorio', () => {
  assert.equal(normalizar('Médico Clínico'), 'medico clinico');
  assert.equal(normalizar('  ÁéÍóÚñ  '), 'aeioun');
  assert.equal(claveConsultorio('Consultorio 1'), 'consultorio1');
  assert.equal(claveConsultorio('  consultorio   1  '), 'consultorio1');
  assert.equal(claveConsultorio('CONSULTORIO 102'), 'consultorio102');
  assert.equal(escapeLike('50%_off'), '50\\%\\_off');
});

test('Hashing y verificación de contraseñas con scrypt', async () => {
  const password = 'TestPassword#2026';
  const hash = await hashPassword(password);
  assert.match(hash, /^scrypt\$16384\$8\$1\$[a-f0-9]+\$[a-f0-9]+$/);

  const isValid = await verifyPassword(password, hash);
  assert.equal(isValid, true);

  const isInvalid = await verifyPassword('WrongPassword#2026', hash);
  assert.equal(isInvalid, false);

  const generated = generatePassword();
  assert.equal(generated.length >= 8, true);
  assert.match(generated, /[A-Z]/);
  assert.match(generated, /[a-z]/);
  assert.match(generated, /[#$@!%*?&]/);
});

test('Cálculo de tiempos y días de la semana', () => {
  assert.equal(horaToMinutos('08:30'), 510);
  assert.equal(minutosToHora(510), '08:30');
  assert.equal(horaToMinutos('21:00'), 1260);
  assert.equal(minutosToHora(1260), '21:00');
  // 2026-10-06 fue Martes
  assert.equal(getDiaSemana('2026-10-06'), 'MARTES');
});

test('Serialización y parseo de cookies', () => {
  const cookie = serializeCookie('st_sid', 'token123', { httpOnly: true, sameSite: 'Lax', path: '/' });
  assert.match(cookie, /st_sid=token123/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);

  const parsed = parseCookies('st_sid=token123; other=val');
  assert.equal(parsed.st_sid, 'token123');
  assert.equal(parsed.other, 'val');
});
```

## File: backend/server.js
```javascript
import { createApp } from './src/app.js';
import { config } from './src/config/index.js';
import { turnoService } from './src/services/turnoService.js';
import { closeDb } from './src/db/connection.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[Salud Turnos] Servidor escuchando en http://localhost:${config.port}`);
  
  // Tarea periódica de fondo cada 60 segundos para marcar turnos AUSENTES expirados (Q2 / D-30)
  const interval = setInterval(() => {
    try {
      turnoService.marcarAusentes();
    } catch (err) {
      console.error('[Auto-Ausente Error]', err);
    }
  }, 60000);

  const shutdown = () => {
    console.log('\n[Salud Turnos] Cerrando servidor...');
    clearInterval(interval);
    server.close(() => {
      closeDb();
      console.log('[Salud Turnos] Servidor y base de datos cerrados.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
```

## File: frontend/images/eye-key-look-password-security-see-svgrepo-com.svg
```xml
<?xml version="1.0" ?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="800px" height="800px" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M17.7469 15.4149C17.9855 14.8742 18.1188 14.2724 18.1188 14.0016C18.1188 11.6544 16.2952 9.7513 14.046 9.7513C11.7969 9.7513 9.97332 11.6544 9.97332 14.0016C9.97332 16.3487 12.0097 17.8886 14.046 17.8886C15.3486 17.8886 16.508 17.2515 17.2517 16.2595C17.4466 16.0001 17.6137 15.7168 17.7469 15.4149ZM14.046 15.7635C14.5551 15.7635 15.0205 15.5684 15.3784 15.2457C15.81 14.8566 16 14.2807 16 14.0016C16 12.828 15.1716 11.8764 14.046 11.8764C12.9205 11.8764 12 12.8264 12 14C12 14.8104 12.9205 15.7635 14.046 15.7635Z" fill="#000000" fill-rule="evenodd"/><path clip-rule="evenodd" d="M1.09212 14.2724C1.07621 14.2527 1.10803 14.2931 1.09212 14.2724C0.96764 14.1021 0.970773 13.8996 1.09268 13.7273C1.10161 13.7147 1.11071 13.7016 1.11993 13.6882C4.781 8.34319 9.32105 5.5 14.0142 5.5C18.7025 5.5 23.2385 8.33554 26.8956 13.6698C26.965 13.771 27 13.875 27 13.9995C27 14.1301 26.9593 14.2399 26.8863 14.3461C23.2302 19.6702 18.6982 22.5 14.0142 22.5C9.30912 22.5 4.75717 19.6433 1.09212 14.2724ZM3.93909 13.3525C3.6381 13.7267 3.6381 14.2722 3.93908 14.6465C7.07417 18.5443 10.6042 20.3749 14.0142 20.3749C17.4243 20.3749 20.9543 18.5443 24.0894 14.6465C24.3904 14.2722 24.3904 13.7267 24.0894 13.3525C20.9543 9.45475 17.4243 7.62513 14.0142 7.62513C10.6042 7.62513 7.07417 9.45475 3.93909 13.3525Z" fill="#000000" fill-rule="evenodd"/></svg>
```

## File: frontend/images/eye-password-see-view-svgrepo-com.svg
```xml
<?xml version="1.0" ?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="800px" height="800px" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M22.6928 1.55018C22.3102 1.32626 21.8209 1.45915 21.6 1.84698L19.1533 6.14375C17.4864 5.36351 15.7609 4.96457 14.0142 4.96457C9.32104 4.96457 4.781 7.84644 1.11993 13.2641L1.10541 13.2854L1.09271 13.3038C0.970762 13.4784 0.967649 13.6837 1.0921 13.8563C3.79364 17.8691 6.97705 20.4972 10.3484 21.6018L8.39935 25.0222C8.1784 25.4101 8.30951 25.906 8.69214 26.1299L9.03857 26.3326C9.4212 26.5565 9.91046 26.4237 10.1314 26.0358L23.332 2.86058C23.553 2.47275 23.4219 1.97684 23.0392 1.75291L22.6928 1.55018ZM18.092 8.00705C16.7353 7.40974 15.3654 7.1186 14.0142 7.1186C10.6042 7.1186 7.07416 8.97311 3.93908 12.9239C3.63812 13.3032 3.63812 13.8561 3.93908 14.2354C6.28912 17.197 8.86102 18.9811 11.438 19.689L12.7855 17.3232C11.2462 16.8322 9.97333 15.4627 9.97333 13.5818C9.97333 11.2026 11.7969 9.27368 14.046 9.27368C15.0842 9.27368 16.0317 9.68468 16.7511 10.3612L18.092 8.00705ZM15.639 12.3137C15.2926 11.7767 14.7231 11.4277 14.046 11.4277C12.9205 11.4277 12 12.3906 12 13.5802C12 14.3664 12.8432 15.2851 13.9024 15.3624L15.639 12.3137Z" fill="#000000" fill-rule="evenodd"/><path d="M14.6873 22.1761C19.1311 21.9148 23.4056 19.0687 26.8864 13.931C26.9593 13.8234 27 13.7121 27 13.5797C27 13.4535 26.965 13.3481 26.8956 13.2455C25.5579 11.2677 24.1025 9.62885 22.5652 8.34557L21.506 10.2052C22.3887 10.9653 23.2531 11.87 24.0894 12.9239C24.3904 13.3032 24.3904 13.8561 24.0894 14.2354C21.5676 17.4135 18.7903 19.2357 16.0254 19.827L14.6873 22.1761Z" fill="#000000"/></svg>
```

## File: frontend/js/agenda.js
```javascript
/* =============================================================
   js/agenda.js
   -------------------------------------------------------------
   Lógica de la Agenda Médica:
   - Vista Diaria (por fecha) y Mensual (por mes, agrupada por día - DUDA-12a).
   - Filtros de especialidad y profesional (ocultos para rol PROFESIONAL).
   - Horarios LIBRE vs OCUPADO (con diferenciación de vencidos - FE-AGE-08).
   - Clic en slot LIBRE -> Redirige a solicitar turno pre-cargado.
   - Clic en slot OCUPADO -> Modal de detalle y acciones directas (A10).
   ============================================================= */

(function () {
  'use strict';

  let currentMode = 'daily'; // 'daily' | 'monthly'
  let currentAbortController = null;
  let cachedDoctors = [];

  // Referencias DOM
  const btnModeDaily = document.getElementById('btnModeDaily');
  const btnModeMonthly = document.getElementById('btnModeMonthly');
  const agendaDateInput = document.getElementById('agendaDate');
  const agendaDateLabel = document.getElementById('agendaDateLabel');
  const agendaSpecialty = document.getElementById('agendaSpecialty');
  const agendaDoctor = document.getElementById('agendaDoctor');
  const specialtyField = document.getElementById('agendaSpecialtyField');
  const doctorField = document.getElementById('agendaDoctorField');
  const agendaGrid = document.getElementById('agendaGrid');
  const refreshBtn = document.getElementById('refreshAgendaBtn');

  /**
   * Carga la grilla de agenda desde la API.
   */
  async function loadAgenda() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const isDoctor = window.AppSession.isDoctor();
    const query = {};

    if (currentMode === 'daily') {
      query.fecha = agendaDateInput.value || window.AppHelpers.todayLocal();
    } else {
      query.mes = agendaDateInput.value || window.AppHelpers.todayLocal().slice(0, 7);
    }

    if (!isDoctor) {
      const docId = Number(agendaDoctor.value);
      const espId = Number(agendaSpecialty.value);
      if (docId) query.id_profesional = docId;
      if (espId) query.id_especialidad = espId;
    }

    agendaGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 24px 0;">Cargando agenda médica...</p>';

    try {
      const res = await window.Api.agenda.get(query, currentAbortController.signal);
      renderAgenda(res.data || []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar agenda:', err);
      agendaGrid.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 24px 0;">${window.AppHelpers.esc(err.message || 'Error al cargar la agenda')}</p>`;
    }
  }

  /**
   * Renderiza los profesionales y sus franjas/días.
   */
  function renderAgenda(profesionales) {
    if (!profesionales || profesionales.length === 0) {
      agendaGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 30px 0;">No se registraron agendas médicas para los filtros seleccionados.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    const isRecepOrAdmin = window.AppSession.isAdmin() || window.AppSession.isRecep();
    const hoyLocal = window.AppHelpers.todayLocal();
    const now = new Date();
    const currMin = now.getHours() * 60 + now.getMinutes();

    profesionales.forEach((doc) => {
      const card = document.createElement('section');
      card.className = 'panel-card';
      card.style.marginBottom = '20px';

      const consultorioText = doc.consultorio ? `Consultorio ${window.AppHelpers.esc(doc.consultorio)}` : 'Sin consultorio fijo';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="margin: 0; color: var(--navy-dark); font-size: 1.15rem;">
              Dr./Dra. ${window.AppHelpers.esc(doc.profesional)}
            </h3>
            <span class="muted" style="font-size: 0.88rem;">
              ${window.AppHelpers.esc(doc.especialidad)} · ${consultorioText}
            </span>
          </div>
          <span class="badge" style="background: #edf4fa; color: var(--blue);">
            ${doc.tiene_agenda ? 'Agenda Activa' : 'Sin Agenda'}
          </span>
        </div>
        <div class="doctor-days-container"></div>
      `;

      const daysContainer = card.querySelector('.doctor-days-container');

      if (!doc.tiene_agenda) {
        daysContainer.innerHTML = `
          <div style="padding: 16px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 6px; color: #7a5a18; font-size: 0.92rem;">
            ⚠️ ${window.AppHelpers.esc(doc.mensaje || 'El profesional no posee agenda de atención activa configurada.')}
          </div>
        `;
        fragment.appendChild(card);
        return;
      }

      if (!doc.dias || doc.dias.length === 0) {
        daysContainer.innerHTML = '<p class="muted" style="font-style: italic; margin: 8px 0;">No se registran días de atención para el período seleccionado.</p>';
        fragment.appendChild(card);
        return;
      }

      // Renderizar días
      doc.dias.forEach((dia) => {
        const daySection = document.createElement('div');
        daySection.style.marginBottom = '18px';

        daySection.innerHTML = `
          <h4 style="margin: 0 0 10px; color: var(--navy-dark); font-size: 0.96rem; border-left: 3px solid var(--blue); padding-left: 8px;">
            ${window.AppHelpers.esc(dia.dia_semana)} ${window.AppHelpers.formatDate(dia.fecha)}
          </h4>
          <div class="agenda-slots-list" style="display: grid; gap: 8px;"></div>
        `;

        const slotsList = daySection.querySelector('.agenda-slots-list');

        dia.slots.forEach((slot) => {
          const slotRow = document.createElement('div');
          slotRow.className = 'agenda-slot';

          const [h, m] = slot.hora.split(':').map(Number);
          const slotMin = h * 60 + m;
          const esHoy = dia.fecha === hoyLocal;
          const yaPaso = esHoy && slotMin < currMin;

          if (slot.estado === 'LIBRE') {
            slotRow.classList.add('free');
            if (yaPaso) {
              slotRow.style.opacity = '0.5';
              slotRow.style.cursor = 'not-allowed';
              slotRow.title = 'Horario vencido en el día de hoy';
            }

            slotRow.innerHTML = `
              <strong>${window.AppHelpers.esc(slot.hora)}</strong>
              <span style="color: var(--success); font-weight: 600;">DISPONIBLE</span>
              ${
                isRecepOrAdmin && !yaPaso
                  ? '<button type="button" class="btn btn-secondary btn-xs">Reservar turno</button>'
                  : '<span class="muted" style="font-size: 0.84rem;">Libre</span>'
              }
            `;

            if (isRecepOrAdmin && !yaPaso) {
              slotRow.style.cursor = 'pointer';
              slotRow.addEventListener('click', () => {
                window.location.href = `turno.html?id_profesional=${doc.id_profesional}&fecha=${dia.fecha}&hora=${slot.hora}`;
              });
            }
          } else {
            // Estado OCUPADO
            slotRow.classList.add('busy');
            slotRow.style.cursor = 'pointer';

            const turno = slot.turno || {};
            const pacienteNombre = turno.paciente ? window.AppHelpers.esc(turno.paciente) : 'Paciente asignado';
            const motivoText = turno.motivo ? ` · Motivo: "${window.AppHelpers.esc(turno.motivo)}"` : '';

            slotRow.innerHTML = `
              <strong>${window.AppHelpers.esc(slot.hora)}</strong>
              <div>
                <span><strong>${pacienteNombre}</strong> (DNI ${window.AppHelpers.esc(turno.paciente_dni || '-')})</span>
                <small class="muted" style="display: block;">${motivoText}</small>
              </div>
              <div>${window.AppHelpers.statusBadge(turno.estado)}</div>
            `;

            // Clic en slot OCUPADO -> Modal de Detalle y Acciones del Turno (A10)
            slotRow.addEventListener('click', () => {
              openTurnoDetailModal(turno.id_turno, doc, dia, slot);
            });
          }

          slotsList.appendChild(slotRow);
        });

        daysContainer.appendChild(daySection);
      });

      fragment.appendChild(card);
    });

    agendaGrid.innerHTML = '';
    agendaGrid.appendChild(fragment);
  }

  /**
   * Modal de Detalle y Acciones del Turno abierto directamente desde la Agenda (A10).
   */
  async function openTurnoDetailModal(id_turno, doc, dia, slot) {
    let turnoDetalle = null;
    try {
      const res = await window.Api.turnos.getById(id_turno);
      turnoDetalle = res.data || res;
    } catch (err) {
      console.warn('Cargando con datos de slot...', err);
      turnoDetalle = slot.turno;
    }

    const t = turnoDetalle;
    const isDoctor = window.AppSession.isDoctor();
    const isRecepOrAdmin = window.AppSession.isAdmin() || window.AppSession.isRecep();
    const hoyLocal = window.AppHelpers.todayLocal();

    const [h, m] = slot.hora.split(':').map(Number);
    const slotMin = h * 60 + m;
    const now = new Date();
    const currMin = now.getHours() * 60 + now.getMinutes();
    const enFranja = dia.fecha === hoyLocal && currMin >= slotMin && currMin < slotMin + 30;

    const contentHtml = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; color: var(--navy-dark);">Turno #${t.id_turno || id_turno}</h3>
            <span class="muted" style="font-size: 0.88rem;">${window.AppHelpers.formatDate(t.fecha || dia.fecha)} a las ${window.AppHelpers.esc(t.hora || slot.hora)} hs</span>
          </div>
          <div>${window.AppHelpers.statusBadge(t.estado)}</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid var(--line); border-radius: 6px; padding: 14px; margin-bottom: 16px;">
          <p style="margin: 0 0 6px;"><strong>Paciente:</strong> ${window.AppHelpers.esc(t.paciente_nombre || t.paciente)} (DNI ${window.AppHelpers.esc(t.paciente_dni || '-')})</p>
          <p style="margin: 0 0 6px;"><strong>Profesional:</strong> Dr./Dra. ${window.AppHelpers.esc(doc.profesional)} (${window.AppHelpers.esc(doc.especialidad)} - Cons. ${window.AppHelpers.esc(doc.consultorio || '-')})</p>
          <p style="margin: 0 0 6px;"><strong>Motivo:</strong> ${window.AppHelpers.esc(t.motivo_consulta || t.motivo || 'No especificado')}</p>
          ${t.observaciones ? `<p style="margin: 0;"><strong>Observaciones:</strong> <em>${window.AppHelpers.esc(t.observaciones)}</em></p>` : ''}
        </div>
      </div>
    `;

    // Acciones dinámicas según el estado
    const actions = [
      { label: 'Cerrar', className: 'btn btn-light', onClick: (_, c) => c() }
    ];

    if (t.estado === 'PENDIENTE' && isRecepOrAdmin) {
      actions.push({
        label: 'Confirmar turno',
        className: 'btn btn-primary',
        onClick: async (_, close) => {
          try {
            await window.Api.turnos.changeStatus(id_turno, 'CONFIRMADO');
            window.AppUI.showToast('Turno confirmado correctamente.', 'ok');
            close();
            loadAgenda();
          } catch (err) {
            window.AppUI.showToast(err.message, 'bad');
          }
        }
      });
      actions.push({
        label: 'Cancelar turno',
        className: 'btn btn-danger',
        onClick: async (_, close) => {
          const ok = await window.AppUI.confirm({
            title: 'Cancelar turno',
            message: '¿Desea cancelar este turno médico?',
            isDanger: true
          });
          if (!ok) return;
          try {
            await window.Api.turnos.cancel(id_turno);
            window.AppUI.showToast('Turno cancelado.', 'ok');
            close();
            loadAgenda();
          } catch (err) {
            window.AppUI.showToast(err.message, 'bad');
          }
        }
      });
    } else if (t.estado === 'CONFIRMADO') {
      if (isDoctor && enFranja) {
        actions.push({
          label: 'Registrar llegada (En consultorio)',
          className: 'btn btn-primary',
          onClick: async (_, close) => {
            try {
              await window.Api.turnos.changeStatus(id_turno, 'EN_CONSULTORIO');
              window.AppUI.showToast('Llegada registrada.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        });
      }
      if (isRecepOrAdmin) {
        actions.push({
          label: 'Marcar Ausente',
          className: 'btn btn-light',
          onClick: async (_, close) => {
            try {
              await window.Api.turnos.changeStatus(id_turno, 'AUSENTE');
              window.AppUI.showToast('Turno marcado como Ausente.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        });
        actions.push({
          label: 'Cancelar turno',
          className: 'btn btn-danger',
          onClick: async (_, close) => {
            const ok = await window.AppUI.confirm({
              title: 'Cancelar turno',
              message: '¿Desea cancelar este turno médico?',
              isDanger: true
            });
            if (!ok) return;
            try {
              await window.Api.turnos.cancel(id_turno);
              window.AppUI.showToast('Turno cancelado.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        });
      }
    } else if (t.estado === 'EN_CONSULTORIO') {
      actions.push({
        label: 'Observaciones ✎',
        className: 'btn btn-light',
        onClick: (_, close) => {
          close();
          openObservacionesModalAgenda(id_turno, t.observaciones);
        }
      });
      if (isDoctor) {
        actions.push({
          label: 'Marcar Asistido',
          className: 'btn btn-primary',
          onClick: async (_, close) => {
            try {
              await window.Api.turnos.changeStatus(id_turno, 'ASISTIDO');
              window.AppUI.showToast('Turno finalizado como Asistido.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        });
      }
    }

    window.AppUI.modal({
      title: `Detalle del Turno`,
      size: 'md',
      content: contentHtml,
      actions
    });
  }

  /**
   * Modal auxiliar de observaciones desde la agenda.
   */
  function openObservacionesModalAgenda(id_turno, currentObs = '') {
    window.AppUI.modal({
      title: 'Observaciones Médicas',
      size: 'md',
      content: `
        <div class="field">
          <label for="agendaObsText">Observaciones de consulta:</label>
          <textarea id="agendaObsText" rows="5" maxlength="500">${window.AppHelpers.esc(currentObs || '')}</textarea>
        </div>
      `,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, c) => c() },
        {
          label: 'Guardar',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const val = document.getElementById('agendaObsText').value.trim();
            try {
              await window.Api.turnos.update(id_turno, { observaciones: val || null });
              window.AppUI.showToast('Observaciones guardadas.', 'ok');
              close();
              loadAgenda();
            } catch (err) {
              window.AppUI.showToast(err.message, 'bad');
            }
          }
        }
      ]
    });
  }

  /**
   * Alterna entre modo diario y mensual (DUDA-12a).
   */
  function setMode(mode) {
    currentMode = mode;
    if (mode === 'daily') {
      btnModeDaily.classList.add('active');
      btnModeMonthly.classList.remove('active');
      agendaDateLabel.textContent = 'Fecha de atención';
      agendaDateInput.type = 'date';
      agendaDateInput.value = window.AppHelpers.todayLocal();
    } else {
      btnModeMonthly.classList.add('active');
      btnModeDaily.classList.remove('active');
      agendaDateLabel.textContent = 'Mes de atención';
      agendaDateInput.type = 'month';
      agendaDateInput.value = window.AppHelpers.todayLocal().slice(0, 7);
    }
    loadAgenda();
  }

  /**
   * Inicializa la interfaz y filtros.
   */
  async function initEvents(usuario) {
    const isDoctor = usuario.rol === 'PROFESIONAL';

    if (isDoctor) {
      if (specialtyField) specialtyField.classList.add('hidden');
      if (doctorField) doctorField.classList.add('hidden');
    } else {
      // Cargar selectores de especialidad y médico
      try {
        const [espRes, docRes] = await Promise.all([
          window.Api.especialidades.list({ estado: 1 }),
          window.Api.profesionales.list({ estado: 1 })
        ]);

        const especialidades = espRes.data || [];
        cachedDoctors = docRes.data || [];

        agendaSpecialty.innerHTML = '<option value="">Todas las especialidades</option>' +
          especialidades.map((e) => `<option value="${e.id_especialidad}">${window.AppHelpers.esc(e.nombre)}</option>`).join('');

        populateDoctorSelect();

        agendaSpecialty.addEventListener('change', () => {
          populateDoctorSelect();
          loadAgenda();
        });

        agendaDoctor.addEventListener('change', () => loadAgenda());
      } catch (err) {
        console.error('Error cargando filtros de agenda:', err);
      }
    }

    btnModeDaily.addEventListener('click', () => setMode('daily'));
    btnModeMonthly.addEventListener('click', () => setMode('monthly'));
    agendaDateInput.addEventListener('change', () => loadAgenda());
    refreshBtn.addEventListener('click', () => loadAgenda());

    // Inicializar con fecha local de hoy
    agendaDateInput.value = window.AppHelpers.todayLocal();
  }

  function populateDoctorSelect() {
    const espId = Number(agendaSpecialty.value);
    const docs = espId
      ? cachedDoctors.filter((d) => d.id_especialidad === espId)
      : cachedDoctors;

    agendaDoctor.innerHTML = '<option value="">Todos los profesionales</option>' +
      docs.map((d) => `<option value="${d.id_profesional}">${window.AppHelpers.esc(d.apellido)}, ${window.AppHelpers.esc(d.nombre)}</option>`).join('');
  }

  window.AppSession.ready.then((usuario) => {
    initEvents(usuario);
    loadAgenda();
  });
})();
```

## File: frontend/js/api.js
```javascript
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
      activate: (id) => request(`/api/pacientes/${id}/activar`, { method: 'PATCH' }),
      resetPassword: (id) => request(`/api/pacientes/${id}/clave`, { method: 'POST' })
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
```

## File: frontend/js/common.js
```javascript
/* =============================================================
   js/common.js
   -------------------------------------------------------------
   Lógica central compartida de pantallas privadas:
   - Control asíncrono de sesión con /api/auth/me (AppSession.ready).
   - Protección H-01 para cuentas profesionales sin médico activo.
   - Generación dinámica de la navegación del Sidebar según rol.
   - Guard de acceso por pantalla.
   - Cierre de sesión real con cookie HttpOnly (POST /api/auth/logout).
   - Menú responsive hamburguesa.
   ============================================================= */

(function () {
  'use strict';

  // Configuración de rutas permitidas y navegación por rol
  const NAV_ITEMS = [
    {
      href: 'dashboard.html',
      label: 'Panel',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL', 'PACIENTE']
    },
    {
      href: 'pacientes.html',
      label: 'Pacientes',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
    },
    {
      href: 'turno.html',
      label: 'Turnos',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL', 'PACIENTE']
    },
    {
      href: 'agenda.html',
      label: 'Agenda',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL']
    },
    {
      href: 'profesionales.html',
      label: 'Profesionales',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
    },
    {
      href: 'especialidades.html',
      label: 'Especialidades',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
    },
    {
      href: 'usuarios.html',
      label: 'Usuarios',
      roles: ['ADMINISTRADOR']
    },
    {
      href: 'cuenta.html',
      label: 'Mi cuenta',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL', 'PACIENTE']
    }
  ];

  let currentUser = null;
  let sessionReadyResolve;
  let sessionReadyReject;

  const sessionReadyPromise = new Promise((resolve, reject) => {
    sessionReadyResolve = resolve;
    sessionReadyReject = reject;
  });

  window.AppSession = {
    ready: sessionReadyPromise,
    getUser: () => currentUser,
    getUsuario: () => currentUser,
    isAdmin: () => currentUser?.rol === 'ADMINISTRADOR',
    isRecep: () => currentUser?.rol === 'RECEPCIONISTA',
    isDoctor: () => currentUser?.rol === 'PROFESIONAL',
    isPaciente: () => currentUser?.rol === 'PACIENTE'
  };

  /**
   * Obtiene el nombre del archivo HTML actual (ej: "pacientes.html").
   */
  function getCurrentPageName() {
    const path = window.location.pathname;
    const segments = path.split('/');
    const file = segments.pop() || 'dashboard.html';
    return file === '' ? 'dashboard.html' : file;
  }

  /**
   * Renderiza el sidebar según el rol del usuario autenticado (DT-05).
   */
  function renderSidebar(usuario) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const currentPage = getCurrentPageName();
    sidebar.innerHTML = '';

    // Perfil de usuario en el menú
    const userCard = document.createElement('div');
    userCard.className = 'sidebar-user-card';
    const rolLegible =
      usuario.rol === 'ADMINISTRADOR'
        ? 'Administrador'
        : usuario.rol === 'RECEPCIONISTA'
        ? 'Recepcionista'
        : usuario.rol === 'PROFESIONAL'
        ? 'Profesional'
        : 'Paciente';

    userCard.innerHTML = `
      <div class="user-avatar" aria-hidden="true">${window.AppHelpers.esc(usuario.nombre.charAt(0))}${window.AppHelpers.esc(usuario.apellido.charAt(0))}</div>
      <div class="user-info">
        <span class="user-name">${window.AppHelpers.esc(usuario.nombre)} ${window.AppHelpers.esc(usuario.apellido)}</span>
        <span class="user-role">${window.AppHelpers.esc(rolLegible)}</span>
      </div>
    `;
    sidebar.appendChild(userCard);

    // Enlaces de navegación
    const navLinksContainer = document.createElement('div');
    navLinksContainer.className = 'sidebar-links';

    NAV_ITEMS.forEach((item) => {
      if (item.roles.includes(usuario.rol)) {
        const link = document.createElement('a');
        link.href = item.href;
        link.textContent = item.label;

        // Label adaptada para el rol profesional y paciente
        if (item.href === 'turno.html' && (usuario.rol === 'PROFESIONAL' || usuario.rol === 'PACIENTE')) {
          link.textContent = 'Mis turnos';
        }

        if (currentPage === item.href) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }

        navLinksContainer.appendChild(link);
      }
    });

    sidebar.appendChild(navLinksContainer);

    // Botón de cerrar sesión
    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'nav-button logout-btn';
    logoutBtn.innerHTML = 'Cerrar sesión';
    logoutBtn.addEventListener('click', handleLogout);
    sidebar.appendChild(logoutBtn);
  }

  /**
   * Valida si el rol tiene acceso a la página actual.
   */
  function checkPageAccess(usuario) {
    const currentPage = getCurrentPageName();
    const item = NAV_ITEMS.find((nav) => nav.href === currentPage);

    if (item && !item.roles.includes(usuario.rol)) {
      if (window.AppUI && window.AppUI.showToast) {
        window.AppUI.showToast('No tiene permisos para acceder a esta pantalla.', 'bad');
      }
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 300);
      return false;
    }
    return true;
  }

  /**
   * Cierre de sesión centralizado (FE-NAV-03).
   */
  async function handleLogout() {
    try {
      if (window.Api && window.Api.auth) {
        await window.Api.auth.logout();
      }
    } catch (err) {
      console.warn('Error al cerrar sesión:', err);
    } finally {
      sessionStorage.removeItem('saludturnos_user');
      window.location.href = 'login.html';
    }
  }

  /**
   * Inicialización del shell privado.
   */
  async function initSession() {
    // Si la pantalla es index o login, no ejecutar guard privado
    const currentPage = getCurrentPageName();
    if (currentPage === 'index.html' || currentPage === 'login.html') {
      return;
    }

    try {
      if (!window.Api || !window.Api.auth) {
        throw new Error('El módulo api.js no fue cargado correctamente.');
      }

      const res = await window.Api.auth.me();
      currentUser = res.usuario;

      // H-01 Mitigación: Profesional con id_profesional null (cuenta médica inactiva)
      if (currentUser.rol === 'PROFESIONAL' && !currentUser.id_profesional) {
        sessionStorage.setItem(
          'saludturnos_motivo_logout',
          'Su cuenta médica se encuentra inactiva. Comuníquese con el administrador.'
        );
        try {
          await window.Api.auth.logout();
        } catch {
          // ignore
        }
        window.location.href = 'login.html';
        return;
      }

      // Mitigación Paciente con id_paciente null (cuenta o ficha inactiva) (RN-15)
      if (currentUser.rol === 'PACIENTE' && !currentUser.id_paciente) {
        sessionStorage.setItem(
          'saludturnos_motivo_logout',
          'Su ficha de paciente se encuentra inactiva o no vinculada. Comuníquese con la administración.'
        );
        try {
          await window.Api.auth.logout();
        } catch {
          // ignore
        }
        window.location.href = 'login.html';
        return;
      }

      // Validar acceso por rol
      const hasAccess = checkPageAccess(currentUser);
      if (!hasAccess) return;

      // Renderizar sidebar dinámico
      renderSidebar(currentUser);
      initMobileMenu();

      // Resolver promesa de sesión lista
      sessionReadyResolve(currentUser);
    } catch (err) {
      console.warn('Fallo en la validación de sesión:', err);
      sessionReadyReject(err);
      if (!currentPage.endsWith('login.html')) {
        window.location.href = 'login.html';
      }
    }
  }

  /**
   * Inicialización del menú hamburguesa responsive (FE-NAV-04).
   */
  function initMobileMenu() {
    const topbar = document.querySelector('.topbar');
    const appLayout = document.querySelector('.app-layout');
    const sidebar = document.querySelector('.sidebar');

    if (!topbar || !sidebar || !appLayout) return;

    let menuBtn = document.getElementById('mobileMenuBtn');
    if (!menuBtn) {
      menuBtn = document.createElement('button');
      menuBtn.id = 'mobileMenuBtn';
      menuBtn.className = 'mobile-menu-btn';
      menuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.innerHTML = '☰';
      topbar.appendChild(menuBtn);
    }

    function toggleMenu() {
      const isOpen = appLayout.classList.toggle('menu-open');
      sidebar.classList.toggle('open', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuBtn.innerHTML = isOpen ? '✕' : '☰';

      if (window.innerWidth <= 768) {
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }
    }

    menuBtn.onclick = function (e) {
      e.stopPropagation();
      toggleMenu();
    };

    sidebar.querySelectorAll('a, .nav-button').forEach((el) => {
      el.addEventListener('click', () => {
        if (appLayout.classList.contains('menu-open')) {
          toggleMenu();
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (
        appLayout.classList.contains('menu-open') &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)
      ) {
        toggleMenu();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && appLayout.classList.contains('menu-open')) {
        appLayout.classList.remove('menu-open');
        sidebar.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = '☰';
        document.body.style.overflow = '';
      }
    });
  }

  // Helpers compartidos
  window.AppHelpers = window.AppHelpers || {};
  Object.assign(window.AppHelpers, {
    patientName(patient) {
      if (!patient) return 'Paciente no disponible';
      return `${patient.nombre} ${patient.apellido}`;
    },
    doctorName(doctor) {
      if (!doctor) return 'Profesional no disponible';
      if (doctor.nombre && doctor.apellido) {
        return `${doctor.nombre} ${doctor.apellido}`;
      }
      return doctor.name || 'Profesional no disponible';
    }
  });

  // Ejecución al cargar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSession);
  } else {
    initSession();
  }
})();
```

## File: frontend/js/cuenta.js
```javascript
/* =============================================================
   js/cuenta.js
   -------------------------------------------------------------
   Lógica de la pantalla Mi cuenta:
   - Visualización de datos de perfil.
   - Si es PROFESIONAL: matrícula, consultorio, especialidad y disponibilidad (A8).
   - Formulario de cambio de contraseña con validación de política estricta.
   ============================================================= */

(function () {
  'use strict';

  const form = document.getElementById('changePasswordForm');
  const saveBtn = document.getElementById('savePasswordBtn');

  /**
   * Carga y muestra los datos del perfil y del profesional (si corresponde).
   */
  async function loadProfile(usuario) {
    const profileLoading = document.getElementById('profileLoading');
    const profileContent = document.getElementById('profileContent');

    document.getElementById('userName').textContent = `${usuario.nombre} ${usuario.apellido}`;
    document.getElementById('userEmail').textContent = usuario.correo;

    const rolTexto =
      usuario.rol === 'ADMINISTRADOR'
        ? 'Administrador General'
        : usuario.rol === 'RECEPCIONISTA'
        ? 'Recepcionista'
        : usuario.rol === 'PROFESIONAL'
        ? 'Profesional Médico'
        : 'Paciente';
    document.getElementById('userRole').textContent = rolTexto;

    if (usuario.rol === 'PACIENTE') {
      const dniField = document.getElementById('patientDniField');
      if (dniField) {
        dniField.classList.remove('hidden');
        document.getElementById('userDni').textContent = usuario.dni || '-';
      }
    }

    profileLoading.classList.add('hidden');
    profileContent.classList.remove('hidden');

    // Si es profesional médico, cargar datos médicos y agenda semanal (A8)
    if (usuario.rol === 'PROFESIONAL' && usuario.id_profesional) {
      const doctorBlock = document.getElementById('doctorProfileBlock');
      doctorBlock.classList.remove('hidden');

      try {
        const [profRes, dispRes] = await Promise.all([
          window.Api.profesionales.getById(usuario.id_profesional),
          window.Api.profesionales.getDisponibilidad(usuario.id_profesional)
        ]);

        const prof = profRes.data;
        document.getElementById('doctorSpecialty').textContent = prof.especialidad_nombre || '-';
        document.getElementById('doctorLicense').textContent = prof.matricula || '-';
        document.getElementById('doctorOffice').textContent = prof.consultorio || 'Sin consultorio asignado';

        renderAvailability(dispRes.data || []);
      } catch (err) {
        console.error('Error al cargar datos del profesional:', err);
        window.AppUI.showToast('No se pudieron cargar los datos profesionales completos.', 'bad');
      }
    }
  }

  /**
   * Renderiza la tabla de disponibilidad semanal de atención (A8).
   */
  function renderAvailability(franjas) {
    const tbody = document.getElementById('doctorAvailabilityTable');
    if (!tbody) return;

    if (!franjas || franjas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="empty-row">No registra franjas horarias configuradas.</td></tr>';
      return;
    }

    // Orden de los días de la semana
    const ordenDias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    const agrupado = {};

    franjas.forEach((f) => {
      agrupado[f.dia_semana] = agrupado[f.dia_semana] || [];
      agrupado[f.dia_semana].push(`${f.hora_inicio} a ${f.hora_fin}`);
    });

    let html = '';
    ordenDias.forEach((dia) => {
      if (agrupado[dia] && agrupado[dia].length > 0) {
        html += `
          <tr>
            <td><strong>${window.AppHelpers.esc(dia)}</strong></td>
            <td>${window.AppHelpers.esc(agrupado[dia].join(' | '))}</td>
          </tr>
        `;
      }
    });

    tbody.innerHTML = html || '<tr><td colspan="2" class="empty-row">Sin horarios activos.</td></tr>';
  }

  /**
   * Valida la política de seguridad de la nueva contraseña (FE-CTA-02).
   */
  function validatePasswordPolicy(password) {
    if (!password || password.length < 8) {
      return 'Debe tener al menos 8 caracteres.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Debe incluir al menos una letra mayúscula.';
    }
    if (!/[a-z]/.test(password)) {
      return 'Debe incluir al menos una letra minúscula.';
    }
    if (!/[#$@!%*?&]/.test(password)) {
      return 'Debe incluir al menos un símbolo del conjunto (# $ @ ! % * ? &).';
    }
    return null;
  }

  /**
   * Manejador del cambio de contraseña.
   */
  async function handleChangePassword(e) {
    e.preventDefault();

    const claveActualEl = document.getElementById('clave_actual');
    const claveNuevaEl = document.getElementById('clave_nueva');
    const claveConfirmEl = document.getElementById('clave_confirm');

    const clave_actual = claveActualEl.value;
    const clave_nueva = claveNuevaEl.value;
    const clave_confirm = claveConfirmEl.value;

    // Limpieza de errores previos
    window.AppUI.renderFieldErrors(form, {});

    let hasErrors = false;

    if (!clave_actual) {
      document.getElementById('clave_actualError').textContent = 'Debe ingresar su contraseña actual.';
      claveActualEl.classList.add('input-error');
      hasErrors = true;
    }

    const policyError = validatePasswordPolicy(clave_nueva);
    if (policyError) {
      document.getElementById('clave_nuevaError').textContent = policyError;
      claveNuevaEl.classList.add('input-error');
      hasErrors = true;
    }

    if (clave_nueva && clave_confirm !== clave_nueva) {
      document.getElementById('clave_confirmError').textContent = 'Las contraseñas no coinciden.';
      claveConfirmEl.classList.add('input-error');
      hasErrors = true;
    }

    if (hasErrors) return;

    window.AppUI.setLoading(saveBtn, true, 'Actualizando...');

    try {
      const res = await window.Api.auth.changePassword({ clave_actual, clave_nueva });
      window.AppUI.showToast(res.mensaje || 'Contraseña actualizada correctamente.', 'ok');
      form.reset();
    } catch (err) {
      if (err.status === 400) {
        window.AppUI.renderFieldErrors(form, err.campos);
      } else if (err.status === 401) {
        document.getElementById('clave_actualError').textContent = err.message || 'Contraseña actual incorrecta.';
        claveActualEl.classList.add('input-error');
      } else {
        window.AppUI.showToast(err.message || 'No se pudo actualizar la contraseña.', 'bad');
      }
    } finally {
      window.AppUI.setLoading(saveBtn, false);
    }
  }

  // Inicialización tras resolver la sesión
  window.AppSession.ready.then((usuario) => {
    loadProfile(usuario);
    if (form) {
      form.addEventListener('submit', handleChangePassword);
    }
  });
})();
```

## File: frontend/js/dashboard.js
```javascript
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

    const isPac = window.AppSession.isPaciente ? window.AppSession.isPaciente() : false;
    const fragment = document.createDocumentFragment();

    proximos.forEach((t) => {
      const tr = document.createElement('tr');

      const pacienteNombre = `${window.AppHelpers.esc(t.paciente_apellido)}, ${window.AppHelpers.esc(t.paciente_nombre)}`;
      const pacienteInfo = `${pacienteNombre} <br><small class="muted">DNI ${window.AppHelpers.esc(t.paciente_dni)}</small>`;
      const col3Content = isPac
        ? `<strong>${window.AppHelpers.esc(t.especialidad_nombre || 'Medicina')}</strong>`
        : pacienteInfo;
      const profesionalNombre = `${window.AppHelpers.esc(t.profesional_nombre)} ${window.AppHelpers.esc(t.profesional_apellido)}`;
      const consultorioLabel = t.consultorio ? window.AppHelpers.esc(t.consultorio) : '-';

      tr.innerHTML = `
        <td><strong>${window.AppHelpers.formatDate(t.fecha)}</strong></td>
        <td><code>${window.AppHelpers.esc(t.hora)}</code></td>
        <td>${col3Content}</td>
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
    } else if (usuario.rol === 'PACIENTE') {
      dashSubtitle.textContent = 'Métricas y próximos turnos programados para su atención.';
      const sectionTitle = document.getElementById('dashSectionTitle');
      if (sectionTitle) {
        sectionTitle.textContent = 'Mis próximos turnos';
      }
      if (newTurnBtn) {
        newTurnBtn.textContent = '+ Solicitar turno';
      }
      const thPaciente = document.getElementById('thDashPaciente');
      if (thPaciente) {
        thPaciente.textContent = 'Especialidad';
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
```

## File: frontend/js/especialidades.js
```javascript
/* =============================================================
   js/especialidades.js
   -------------------------------------------------------------
   Lógica de Gestión de Especialidades conectada a la API:
   - Visualización para ADMINISTRADOR y RECEPCIONISTA (solo lectura).
   - Filtro por nombre con debounce y por estado con pills.
   - Modal de Alta y Edición para ADMINISTRADOR.
   - Desactivación y Reactivación protegida (ADMINISTRADOR).
   ============================================================= */

(function () {
  'use strict';

  let currentAbortController = null;
  let activeEstado = '1'; // Default: Activas

  const tableBody = document.getElementById('specialtiesTable');
  const searchInput = document.getElementById('specialtySearch');
  const newBtn = document.getElementById('newSpecialtyBtn');
  const actionsHeader = document.getElementById('actionsHeader');

  /**
   * Carga el listado de especialidades desde la API.
   */
  async function loadSpecialties() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const nombre = searchInput.value.trim();
    const query = {
      nombre: nombre || undefined,
      estado: activeEstado !== 'todos' ? activeEstado : 'todos'
    };

    const isAdmin = window.AppSession.isAdmin();
    const colCount = isAdmin ? 5 : 4;

    tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row">Cargando especialidades...</td></tr>`;

    try {
      const res = await window.Api.especialidades.list(query, currentAbortController.signal);
      renderTable(res.data || []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar especialidades:', err);
      tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar especialidades')}</td></tr>`;
    }
  }

  /**
   * Renderiza la tabla de especialidades.
   */
  function renderTable(especialidades) {
    const isAdmin = window.AppSession.isAdmin();
    const colCount = isAdmin ? 5 : 4;

    if (!especialidades || especialidades.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row">No se encontraron especialidades.</td></tr>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    especialidades.forEach((esp) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>#${esp.id_especialidad}</td>
        <td><strong>${window.AppHelpers.esc(esp.nombre)}</strong></td>
        <td>${window.AppHelpers.esc(esp.descripcion || '-')}</td>
        <td>${window.AppHelpers.activeBadge(esp.estado)}</td>
        ${isAdmin ? '<td class="actions-cell"></td>' : ''}
      `;

      if (isAdmin) {
        const actionsCell = tr.querySelector('.actions-cell');

        // Botón Editar
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-light btn-xs';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openModalForm(esp));
        actionsCell.appendChild(editBtn);

        // Desactivar / Reactivar
        if (esp.estado === 1) {
          const deactBtn = document.createElement('button');
          deactBtn.type = 'button';
          deactBtn.className = 'btn btn-danger btn-xs';
          deactBtn.textContent = 'Desactivar';
          deactBtn.addEventListener('click', () => handleDeactivate(esp));
          actionsCell.appendChild(deactBtn);
        } else {
          const actBtn = document.createElement('button');
          actBtn.type = 'button';
          actBtn.className = 'btn btn-light btn-xs';
          actBtn.style.color = 'var(--success)';
          actBtn.textContent = 'Reactivar';
          actBtn.addEventListener('click', () => handleActivate(esp));
          actionsCell.appendChild(actBtn);
        }
      }

      fragment.appendChild(tr);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
  }

  /**
   * Abre el modal para crear o editar una especialidad.
   */
  function openModalForm(esp = null) {
    const isEdit = Boolean(esp);
    const title = isEdit ? `Editar Especialidad: ${esp.nombre}` : 'Nueva Especialidad';

    const formHtml = `
      <form id="modalSpecialtyForm" novalidate>
        <div class="field" style="margin-bottom: 14px;">
          <label for="modalEspNombre">Nombre * (3 a 80 caracteres)</label>
          <input id="modalEspNombre" name="nombre" value="${isEdit ? window.AppHelpers.esc(esp.nombre) : ''}" maxlength="80" required>
          <small class="error" id="modalEspNombreError"></small>
        </div>
        <div class="field">
          <label for="modalEspDesc">Descripción (opcional, hasta 255 caracteres)</label>
          <textarea id="modalEspDesc" name="descripcion" rows="3" maxlength="255">${isEdit ? window.AppHelpers.esc(esp.descripcion || '') : ''}</textarea>
          <small class="error" id="modalEspDescError"></small>
        </div>
      </form>
    `;

    const modal = window.AppUI.modal({
      title,
      size: 'md',
      content: formHtml,
      actions: [
        {
          label: 'Cancelar',
          className: 'btn btn-light',
          onClick: (_, close) => close()
        },
        {
          label: isEdit ? 'Guardar cambios' : 'Crear especialidad',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const modalForm = document.getElementById('modalSpecialtyForm');
            const nombreInput = document.getElementById('modalEspNombre');
            const descInput = document.getElementById('modalEspDesc');
            const nombre = nombreInput.value.trim();
            const descripcion = descInput.value.trim() || null;

            // Validación cliente
            const nombreError = document.getElementById('modalEspNombreError');
            nombreError.textContent = '';
            nombreInput.classList.remove('input-error');

            if (!nombre || nombre.length < 3 || nombre.length > 80) {
              nombreError.textContent = 'El nombre debe tener entre 3 y 80 caracteres.';
              nombreInput.classList.add('input-error');
              return;
            }

            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Guardando...');

            try {
              if (isEdit) {
                await window.Api.especialidades.update(esp.id_especialidad, { nombre, descripcion });
                window.AppUI.showToast('Especialidad actualizada correctamente.', 'ok');
              } else {
                await window.Api.especialidades.create({ nombre, descripcion });
                window.AppUI.showToast('Especialidad creada correctamente.', 'ok');
              }
              close();
              loadSpecialties();
            } catch (err) {
              if (err.status === 400 || err.status === 409) {
                if (err.campos?.nombre) {
                  nombreError.textContent = err.campos.nombre;
                  nombreInput.classList.add('input-error');
                } else {
                  window.AppUI.showToast(err.message, 'bad');
                }
              } else {
                window.AppUI.showToast(err.message || 'Error al guardar la especialidad.', 'bad');
              }
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });
  }

  /**
   * Desactivar especialidad.
   */
  async function handleDeactivate(esp) {
    const ok = await window.AppUI.confirm({
      title: 'Desactivar especialidad',
      message: `¿Está seguro de desactivar la especialidad "${esp.nombre}"?`,
      confirmText: 'Desactivar',
      isDanger: true
    });

    if (!ok) return;

    try {
      await window.Api.especialidades.deactivate(esp.id_especialidad);
      window.AppUI.showToast('Especialidad desactivada correctamente.', 'ok');
      loadSpecialties();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo desactivar la especialidad.', 'bad');
    }
  }

  /**
   * Reactivar especialidad.
   */
  async function handleActivate(esp) {
    const ok = await window.AppUI.confirm({
      title: 'Reactivar especialidad',
      message: `¿Desea reactivar la especialidad "${esp.nombre}"?`,
      confirmText: 'Reactivar'
    });

    if (!ok) return;

    try {
      await window.Api.especialidades.activate(esp.id_especialidad);
      window.AppUI.showToast('Especialidad reactivada correctamente.', 'ok');
      loadSpecialties();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo reactivar la especialidad.', 'bad');
    }
  }

  /**
   * Configura eventos y adapta UI según el rol.
   */
  function initEvents(usuario) {
    const isAdmin = usuario.rol === 'ADMINISTRADOR';

    if (!isAdmin) {
      if (newBtn) newBtn.classList.add('hidden');
      if (actionsHeader) actionsHeader.classList.add('hidden');
    } else {
      if (newBtn) {
        newBtn.addEventListener('click', () => openModalForm(null));
      }
    }

    searchInput.addEventListener(
      'input',
      window.AppHelpers.debounce(() => loadSpecialties(), 300)
    );

    document.querySelectorAll('.pill-group .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-group .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeEstado = btn.dataset.estado;
        loadSpecialties();
      });
    });
  }

  window.AppSession.ready.then((usuario) => {
    initEvents(usuario);
    loadSpecialties();
  });
})();
```

## File: frontend/js/pacientes.js
```javascript
/* =============================================================
   js/pacientes.js
   -------------------------------------------------------------
   Lógica de Gestión de Pacientes conectada a la API:
   - Búsqueda en tiempo real con debounce y AbortController.
   - Filtro por estado: Activos (default), Inactivos, Todos.
   - Alta (POST) y Edición (PUT) con validaciones cliente/servidor.
   - Desactivación y Reactivación protegida (solo ADMIN) con confirmación.
   ============================================================= */

(function () {
  'use strict';

  let currentAbortController = null;
  let activeEstado = '1'; // Default: Activos (FE-PAC-02)

  // Referencias DOM
  const tableBody = document.getElementById('patientsTable');
  const searchInput = document.getElementById('patientSearch');
  const toggleFormBtn = document.getElementById('toggleFormBtn');
  const formCard = document.getElementById('patientFormCard');
  const formTitle = document.getElementById('patientFormTitle');
  const patientForm = document.getElementById('patientForm');
  const cancelBtn = document.getElementById('cancelPatientBtn');
  const saveBtn = document.getElementById('savePatientBtn');

  // Inputs del formulario
  const patientIdInput = document.getElementById('patientId');
  const dniInput = document.getElementById('dni');
  const correoInput = document.getElementById('correo');
  const nombreInput = document.getElementById('nombre');
  const apellidoInput = document.getElementById('apellido');
  const telefonoInput = document.getElementById('telefono');
  const fechaNacInput = document.getElementById('fecha_nacimiento');
  const obraSocialInput = document.getElementById('obra_social');

  /**
   * Carga el listado de pacientes desde la API con filtros y cancelación de peticiones previas.
   */
  async function loadPatients() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const q = searchInput.value.trim();
    const query = {
      q: q || undefined,
      estado: activeEstado !== 'todos' ? activeEstado : 'todos'
    };

    tableBody.innerHTML = '<tr><td colspan="8" class="empty-row">Cargando pacientes...</td></tr>';

    try {
      const res = await window.Api.pacientes.list(query, currentAbortController.signal);
      renderTable(res.data || []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar pacientes:', err);
      tableBody.innerHTML = `<tr><td colspan="8" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar pacientes')}</td></tr>`;
    }
  }

  /**
   * Renderiza las filas de la tabla de pacientes con sus acciones según el rol.
   */
  function renderTable(pacientes) {
    if (!pacientes || pacientes.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="empty-row">No se encontraron pacientes para los criterios seleccionados.</td></tr>';
      return;
    }

    const isAdmin = window.AppSession.isAdmin();
    const fragment = document.createDocumentFragment();

    pacientes.forEach((p) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td><strong>${window.AppHelpers.esc(p.dni)}</strong></td>
        <td>${window.AppHelpers.esc(p.apellido)}, ${window.AppHelpers.esc(p.nombre)}</td>
        <td>${window.AppHelpers.esc(p.telefono || '-')}</td>
        <td>${window.AppHelpers.esc(p.correo)}</td>
        <td>${window.AppHelpers.formatDate(p.fecha_nacimiento)}</td>
        <td>${window.AppHelpers.esc(p.obra_social || '-')}</td>
        <td>${window.AppHelpers.activeBadge(p.estado)}</td>
        <td class="actions-cell"></td>
      `;

      const actionsCell = tr.querySelector('.actions-cell');

      // Botón Editar (Admin y Recep)
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-light btn-xs';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => openEditForm(p));
      actionsCell.appendChild(editBtn);

      // Botón Restablecer Clave (Admin y Recep - RFM-23)
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'btn btn-light btn-xs';
      resetBtn.textContent = 'Clave';
      resetBtn.title = 'Restablecer contraseña del paciente';
      resetBtn.addEventListener('click', () => handleResetPassword(p));
      actionsCell.appendChild(resetBtn);

      // Botones de Desactivar / Reactivar (Solo ADMIN)
      if (isAdmin) {
        if (p.estado === 1) {
          const deactBtn = document.createElement('button');
          deactBtn.type = 'button';
          deactBtn.className = 'btn btn-danger btn-xs';
          deactBtn.textContent = 'Desactivar';
          deactBtn.addEventListener('click', () => handleDeactivate(p));
          actionsCell.appendChild(deactBtn);
        } else {
          const actBtn = document.createElement('button');
          actBtn.type = 'button';
          actBtn.className = 'btn btn-light btn-xs';
          actBtn.style.color = 'var(--success)';
          actBtn.textContent = 'Reactivar';
          actBtn.addEventListener('click', () => handleActivate(p));
          actionsCell.appendChild(actBtn);
        }
      }

      fragment.appendChild(tr);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
  }

  /**
   * Abre el formulario en modo creación.
   */
  function openCreateForm() {
    formTitle.textContent = 'Registrar nuevo paciente';
    patientIdInput.value = '';
    patientForm.reset();
    window.AppUI.renderFieldErrors(patientForm, {});
    formCard.classList.remove('hidden');
    dniInput.focus();
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Abre el formulario en modo edición.
   */
  function openEditForm(p) {
    formTitle.textContent = `Editar paciente: ${p.nombre} ${p.apellido}`;
    patientIdInput.value = p.id_paciente;
    dniInput.value = p.dni || '';
    correoInput.value = p.correo || '';
    nombreInput.value = p.nombre || '';
    apellidoInput.value = p.apellido || '';
    telefonoInput.value = p.telefono || '';
    fechaNacInput.value = p.fecha_nacimiento || '';
    obraSocialInput.value = p.obra_social || '';

    window.AppUI.renderFieldErrors(patientForm, {});
    formCard.classList.remove('hidden');
    nombreInput.focus();
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Cierra el formulario y limpia campos.
   */
  function closeForm() {
    formCard.classList.add('hidden');
    patientForm.reset();
    patientIdInput.value = '';
    window.AppUI.renderFieldErrors(patientForm, {});
  }

  /**
   * Validaciones del formulario en cliente previo al envío.
   */
  function validateForm() {
    const campos = {};
    const dni = dniInput.value.trim();
    const correo = correoInput.value.trim();
    const nombre = nombreInput.value.trim();
    const apellido = apellidoInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const fechaNac = fechaNacInput.value.trim();
    const obraSocial = obraSocialInput.value.trim();

    if (!/^\d{7,8}$/.test(dni)) {
      campos.dni = 'El DNI debe contener 7 u 8 dígitos numéricos sin puntos.';
    }

    if (!nombre || nombre.length < 2 || nombre.length > 50) {
      campos.nombre = 'El nombre debe tener entre 2 y 50 caracteres.';
    }

    if (!apellido || apellido.length < 2 || apellido.length > 50) {
      campos.apellido = 'El apellido debe tener entre 2 y 50 caracteres.';
    }

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      campos.correo = 'Formato de correo electrónico inválido.';
    }

    // Teléfono: solo dígitos numéricos hasta 12 (A3)
    if (telefono && !/^\d{1,12}$/.test(telefono)) {
      campos.telefono = 'El teléfono debe contener solo números y hasta 12 dígitos.';
    }

    if (fechaNac) {
      if (fechaNac < '1900-01-01') {
        campos.fecha_nacimiento = 'La fecha de nacimiento no puede ser anterior al año 1900.';
      } else if (fechaNac > window.AppHelpers.todayLocal()) {
        campos.fecha_nacimiento = 'La fecha de nacimiento no puede ser una fecha futura.';
      }
    }

    if (obraSocial && obraSocial.length > 100) {
      campos.obra_social = 'Máximo 100 caracteres.';
    }

    return {
      isValid: Object.keys(campos).length === 0,
      campos,
      data: {
        dni,
        nombre,
        apellido,
        correo: correo.toLowerCase(),
        telefono: telefono || null,
        fecha_nacimiento: fechaNac || null,
        obra_social: obraSocial || null
      }
    };
  }

  /**
   * Muestra el modal con la contraseña autogenerada (RFM-03, RN-17).
   */
  function showGeneratedPasswordModal(clave, correo) {
    const contentHtml = `
      <p style="margin-top: 0;">Se ha generado una nueva contraseña segura para el paciente con correo <strong>${window.AppHelpers.esc(correo)}</strong>:</p>
      <div class="password-box">
        <span class="password-code" id="modalPasswordCode">${window.AppHelpers.esc(clave)}</span>
        <button type="button" class="btn btn-secondary btn-xs" id="copyPasswordBtn">Copiar</button>
      </div>
      <p style="color: var(--danger); font-size: 0.88rem; font-weight: 600; margin-bottom: 0;">
        ⚠️ Esta contraseña se muestra una sola vez. Asegúrese de copiarla y entregarla al paciente para su primer ingreso al sistema.
      </p>
    `;

    const modal = window.AppUI.modal({
      title: 'Contraseña generada',
      size: 'sm',
      content: contentHtml,
      actions: [
        {
          label: 'Entendido y cerrar',
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
   * Restablecimiento de contraseña de un paciente (RFM-23, CA-M14.1).
   */
  async function handleResetPassword(p) {
    const ok = await window.AppUI.confirm({
      title: 'Restablecer contraseña de paciente',
      message: `Se generará una nueva contraseña para ${p.nombre} ${p.apellido} (${p.correo}) y se cerrarán sus sesiones activas. ¿Desea continuar?`,
      confirmText: 'Restablecer clave'
    });

    if (!ok) return;

    try {
      const res = await window.Api.pacientes.resetPassword(p.id_paciente);
      window.AppUI.showToast('Contraseña restablecida con éxito.', 'ok');
      showGeneratedPasswordModal(res.clave_generada, p.correo);
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo restablecer la contraseña.', 'bad');
    }
  }

  /**
   * Manejador del submit de alta o edición.
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    const { isValid, campos, data } = validateForm();
    if (!isValid) {
      window.AppUI.renderFieldErrors(patientForm, campos);
      return;
    }

    const isEdit = Boolean(patientIdInput.value);
    const id = Number(patientIdInput.value);

    window.AppUI.setLoading(saveBtn, true, 'Guardando...');

    try {
      if (isEdit) {
        await window.Api.pacientes.update(id, data);
        window.AppUI.showToast('Paciente actualizado correctamente.', 'ok');
        closeForm();
        loadPatients();
      } else {
        const res = await window.Api.pacientes.create(data);
        closeForm();
        loadPatients();

        if (res.clave_generada) {
          showGeneratedPasswordModal(res.clave_generada, data.correo);
        } else {
          window.AppUI.showToast('Paciente registrado correctamente.', 'ok');
        }
      }
    } catch (err) {
      if (err.status === 400 || err.status === 409) {
        window.AppUI.renderFieldErrors(patientForm, err.campos);
        window.AppUI.showToast(err.message, 'bad');
      } else {
        window.AppUI.showToast(err.message || 'Error al guardar el paciente.', 'bad');
      }
    } finally {
      window.AppUI.setLoading(saveBtn, false);
    }
  }

  /**
   * Desactivar paciente (solo Administrador).
   */
  async function handleDeactivate(p) {
    const ok = await window.AppUI.confirm({
      title: 'Desactivar paciente',
      message: `¿Está seguro de que desea desactivar a ${p.nombre} ${p.apellido} (DNI ${p.dni})?`,
      confirmText: 'Desactivar',
      isDanger: true
    });

    if (!ok) return;

    try {
      await window.Api.pacientes.deactivate(p.id_paciente);
      window.AppUI.showToast('Paciente desactivado correctamente.', 'ok');
      loadPatients();
    } catch (err) {
      // 409: turnos futuros activos u otros bloqueos
      window.AppUI.showToast(err.message || 'No se pudo desactivar al paciente.', 'bad');
    }
  }

  /**
   * Reactivar paciente (solo Administrador).
   */
  async function handleActivate(p) {
    const ok = await window.AppUI.confirm({
      title: 'Reactivar paciente',
      message: `¿Desea reactivar a ${p.nombre} ${p.apellido} (DNI ${p.dni})?`,
      confirmText: 'Reactivar'
    });

    if (!ok) return;

    try {
      await window.Api.pacientes.activate(p.id_paciente);
      window.AppUI.showToast('Paciente reactivado correctamente.', 'ok');
      loadPatients();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo reactivar al paciente.', 'bad');
    }
  }

  /**
   * Configuración de eventos de UI y filtros.
   */
  function initEvents() {
    // Búsqueda rápida con debounce
    searchInput.addEventListener(
      'input',
      window.AppHelpers.debounce(() => {
        loadPatients();
      }, 300)
    );

    // Filtros de estado por pills
    document.querySelectorAll('.pill-group .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-group .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeEstado = btn.dataset.estado;
        loadPatients();
      });
    });

    toggleFormBtn.addEventListener('click', () => {
      if (formCard.classList.contains('hidden')) {
        openCreateForm();
      } else {
        closeForm();
      }
    });

    cancelBtn.addEventListener('click', closeForm);
    patientForm.addEventListener('submit', handleFormSubmit);
  }

  // Inicialización tras resolver la sesión
  window.AppSession.ready.then(() => {
    initEvents();
    loadPatients();
  });
})();
```

## File: frontend/js/profesionales.js
```javascript
/* =============================================================
   js/profesionales.js
   -------------------------------------------------------------
   Lógica de Gestión de Profesionales Médicos:
   - Visualización para ADMINISTRADOR y RECEPCIONISTA (solo lectura).
   - Edición de especialidad, matrícula y consultorio (liberación con null).
   - Editor de Disponibilidad Semanal (reemplazo completo con validación).
   - Modal de Baja Guiada con checklist de bloqueos (FE-PRO-04).
   - Reactivación con advertencia guiada (FE-PRO-05).
   ============================================================= */

(function () {
  'use strict';

  let currentAbortController = null;
  let activeEstado = '1';
  let cachedEspecialidades = [];

  const tableBody = document.getElementById('doctorsTable');
  const searchInput = document.getElementById('docSearch');
  const specialtySearchInput = document.getElementById('docSpecialtySearch');
  const actionsHeader = document.getElementById('docActionsHeader');
  const createDocHelp = document.getElementById('createDocHelp');

  /**
   * Carga el listado de profesionales médicos desde la API.
   */
  async function loadDoctors() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const nombre = searchInput.value.trim();
    const especialidad = specialtySearchInput.value.trim();

    const query = {
      nombre: nombre || undefined,
      especialidad: especialidad || undefined,
      estado: activeEstado !== 'todos' ? activeEstado : 'todos'
    };

    const isAdmin = window.AppSession.isAdmin();
    const colCount = isAdmin ? 7 : 6;

    tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row">Cargando profesionales...</td></tr>`;

    try {
      const res = await window.Api.profesionales.list(query, currentAbortController.signal);
      renderTable(res.data || []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar profesionales:', err);
      tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar profesionales')}</td></tr>`;
    }
  }

  /**
   * Renderiza las filas de la tabla de profesionales.
   */
  function renderTable(doctores) {
    const isAdmin = window.AppSession.isAdmin();
    const colCount = isAdmin ? 7 : 6;

    if (!doctores || doctores.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${colCount}" class="empty-row">No se encontraron profesionales médicos.</td></tr>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    doctores.forEach((doc) => {
      const tr = document.createElement('tr');

      const consultorioLabel = doc.consultorio
        ? window.AppHelpers.esc(doc.consultorio)
        : '<span class="muted" style="font-style: italic;">Sin asignar</span>';

      tr.innerHTML = `
        <td><strong>${window.AppHelpers.esc(doc.apellido)}, ${window.AppHelpers.esc(doc.nombre)}</strong></td>
        <td>${window.AppHelpers.esc(doc.especialidad_nombre || '-')}</td>
        <td><code>${window.AppHelpers.esc(doc.matricula)}</code></td>
        <td>${consultorioLabel}</td>
        <td>${window.AppHelpers.esc(doc.usuario_correo || '-')}</td>
        <td>${window.AppHelpers.activeBadge(doc.estado)}</td>
        ${isAdmin ? '<td class="actions-cell"></td>' : ''}
      `;

      if (isAdmin) {
        const actionsCell = tr.querySelector('.actions-cell');

        // Botón Editar datos médicos
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-light btn-xs';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openEditDoctorModal(doc));
        actionsCell.appendChild(editBtn);

        // Botón Disponibilidad
        const dispBtn = document.createElement('button');
        dispBtn.type = 'button';
        dispBtn.className = 'btn btn-light btn-xs';
        dispBtn.textContent = 'Agenda';
        dispBtn.title = 'Editar disponibilidad semanal';
        dispBtn.addEventListener('click', () => openAvailabilityModal(doc));
        actionsCell.appendChild(dispBtn);

        // Desactivación guiada / Reactivación
        if (doc.estado === 1) {
          const deactBtn = document.createElement('button');
          deactBtn.type = 'button';
          deactBtn.className = 'btn btn-danger btn-xs';
          deactBtn.textContent = 'Baja';
          deactBtn.title = 'Baja lógica guiada del profesional';
          deactBtn.addEventListener('click', () => openDeactivateDoctorChecklist(doc));
          actionsCell.appendChild(deactBtn);
        } else {
          const actBtn = document.createElement('button');
          actBtn.type = 'button';
          actBtn.className = 'btn btn-light btn-xs';
          actBtn.style.color = 'var(--success)';
          actBtn.textContent = 'Reactivar';
          actBtn.addEventListener('click', () => handleActivateDoctor(doc));
          actionsCell.appendChild(actBtn);
        }
      }

      fragment.appendChild(tr);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
  }

  /**
   * Modal de Edición de Profesional (FE-PRO-02).
   */
  async function openEditDoctorModal(doc) {
    if (cachedEspecialidades.length === 0) {
      try {
        const res = await window.Api.especialidades.list({ estado: 1 });
        cachedEspecialidades = res.data || [];
      } catch (err) {
        console.error('Error al cargar especialidades:', err);
      }
    }

    const especialidadesOptions = cachedEspecialidades
      .map(
        (e) =>
          `<option value="${e.id_especialidad}" ${e.id_especialidad === doc.id_especialidad ? 'selected' : ''}>${window.AppHelpers.esc(e.nombre)}</option>`
      )
      .join('');

    const formHtml = `
      <form id="modalEditDoctorForm" novalidate>
        <p style="margin-top: 0;">Profesional: <strong>${window.AppHelpers.esc(doc.nombre)} ${window.AppHelpers.esc(doc.apellido)}</strong></p>
        <div class="field" style="margin-bottom: 12px;">
          <label for="edEspecialidad">Especialidad médica *</label>
          <select id="edEspecialidad" name="id_especialidad" required>
            ${especialidadesOptions}
          </select>
          <small class="error" id="edEspecialidadError"></small>
        </div>
        <div class="field" style="margin-bottom: 12px;">
          <label for="edMatricula">Matrícula (5 dígitos) *</label>
          <input id="edMatricula" name="matricula" value="${window.AppHelpers.esc(doc.matricula)}" maxlength="5" required>
          <small class="error" id="edMatriculaError"></small>
        </div>
        <div class="field" style="margin-bottom: 12px;">
          <label for="edConsultorio">Consultorio asignado (dejar vacío para liberar consultorio)</label>
          <input id="edConsultorio" name="consultorio" value="${window.AppHelpers.esc(doc.consultorio || '')}" maxlength="20" placeholder="Ej: 101 o vacío para liberar">
          <small class="error" id="edConsultorioError"></small>
        </div>
        <p class="muted" style="font-size: 0.84rem; margin: 0;">
          Para liberar el consultorio (requisito previo a una baja médica), borre el texto del campo consultorio.
        </p>
      </form>
    `;

    window.AppUI.modal({
      title: `Editar Profesional: ${doc.nombre} ${doc.apellido}`,
      size: 'md',
      content: formHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, close) => close() },
        {
          label: 'Guardar cambios',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const idEsp = Number(document.getElementById('edEspecialidad').value);
            const matricula = document.getElementById('edMatricula').value.trim();
            const consultorio = document.getElementById('edConsultorio').value.trim();

            const matError = document.getElementById('edMatriculaError');
            matError.textContent = '';

            if (!/^\d{5}$/.test(matricula)) {
              matError.textContent = 'La matrícula debe tener exactamente 5 dígitos numéricos.';
              return;
            }

            const payload = {
              id_especialidad: idEsp,
              matricula,
              consultorio: consultorio || null
            };

            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Guardando...');

            try {
              await window.Api.profesionales.update(doc.id_profesional, payload);
              window.AppUI.showToast('Profesional actualizado correctamente.', 'ok');
              close();
              loadDoctors();
            } catch (err) {
              if (err.campos?.matricula) {
                document.getElementById('edMatriculaError').textContent = err.campos.matricula;
              }
              if (err.campos?.consultorio) {
                document.getElementById('edConsultorioError').textContent = err.campos.consultorio;
              }
              window.AppUI.showToast(err.message || 'Error al actualizar el profesional.', 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });
  }

  /**
   * Modal Editor de Disponibilidad Semanal (FE-PRO-03).
   */
  async function openAvailabilityModal(doc) {
    let currentFranjas = [];
    try {
      const res = await window.Api.profesionales.getDisponibilidad(doc.id_profesional);
      currentFranjas = res.data || [];
    } catch (err) {
      console.error('Error al cargar disponibilidad:', err);
      window.AppUI.showToast('No se pudo cargar la disponibilidad actual.', 'bad');
      return;
    }

    const contentHtml = `
      <form id="modalAvailabilityForm" novalidate>
        <p style="margin-top: 0;">Disponibilidad semanal de atención para <strong>${window.AppHelpers.esc(doc.nombre)} ${window.AppHelpers.esc(doc.apellido)}</strong>:</p>
        <div id="avFranjasList" class="franjas-list" style="max-height: 360px; overflow-y: auto;"></div>
        <button type="button" class="btn btn-light btn-xs" id="avAddFranjaBtn" style="margin-top: 10px;">+ Agregar franja horaria</button>
        <small class="error" id="avError" style="display: block; margin-top: 8px;"></small>
        <p class="muted" style="font-size: 0.84rem; margin: 12px 0 0;">
          Nota: puede eliminar todas las franjas únicamente si está preparando la baja médica del profesional.
        </p>
      </form>
    `;

    const modal = window.AppUI.modal({
      title: `Disponibilidad semanal - ${doc.nombre} ${doc.apellido}`,
      size: 'lg',
      content: contentHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, close) => close() },
        {
          label: 'Guardar agenda',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const listEl = document.getElementById('avFranjasList');
            const errorEl = document.getElementById('avError');
            errorEl.textContent = '';

            const franjas = [];
            const rows = listEl.querySelectorAll('.franja-row');
            rows.forEach((r) => {
              const dia = r.querySelector('.franja-dia').value;
              const inicio = r.querySelector('.franja-inicio').value;
              const fin = r.querySelector('.franja-fin').value;
              franjas.push({ dia_semana: dia, hora_inicio: inicio, hora_fin: fin });
            });

            // Validar que inicio < fin y no se solapen dentro del mismo día
            for (const f of franjas) {
              if (f.hora_inicio >= f.hora_fin) {
                errorEl.textContent = `En ${f.dia_semana}, el horario de fin (${f.hora_fin}) debe ser posterior al de inicio (${f.hora_inicio}).`;
                return;
              }
            }

            // Validar solapamiento por día
            const porDia = {};
            for (const f of franjas) {
              porDia[f.dia_semana] = porDia[f.dia_semana] || [];
              porDia[f.dia_semana].push(f);
            }
            for (const [dia, lista] of Object.entries(porDia)) {
              lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
              for (let i = 0; i < lista.length - 1; i++) {
                if (lista[i].hora_fin > lista[i + 1].hora_inicio) {
                  errorEl.textContent = `Existe superposición horaria en el día ${dia}: ${lista[i].hora_inicio}-${lista[i].hora_fin} con ${lista[i + 1].hora_inicio}-${lista[i + 1].hora_fin}.`;
                  return;
                }
              }
            }

            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Guardando...');

            try {
              await window.Api.profesionales.updateDisponibilidad(doc.id_profesional, franjas);
              window.AppUI.showToast('Disponibilidad actualizada exitosamente.', 'ok');
              close();
              loadDoctors();
            } catch (err) {
              // Conflicto 409 con turnos futuros existentes fuera del nuevo horario
              errorEl.textContent = err.message;
              window.AppUI.showToast(err.message, 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });

    const franjasList = modal.dialog.querySelector('#avFranjasList');
    const addBtn = modal.dialog.querySelector('#avAddFranjaBtn');

    // Cargar franjas existentes o mensaje
    if (currentFranjas.length > 0) {
      currentFranjas.forEach((f) => {
        addFranjaRow(franjasList, f.dia_semana, f.hora_inicio, f.hora_fin);
      });
    }

    addBtn.addEventListener('click', () => {
      addFranjaRow(franjasList, 'LUNES', '08:00', '12:00');
    });
  }

  /**
   * Helper para generar filas de franjas horarias con intervalos de 30 min.
   */
  function addFranjaRow(container, defaultDia = 'LUNES', defaultInicio = '08:00', defaultFin = '12:00') {
    const row = document.createElement('div');
    row.className = 'franja-row';

    const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    const diasOptions = dias
      .map((d) => `<option value="${d}" ${d === defaultDia ? 'selected' : ''}>${d}</option>`)
      .join('');

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

    row.querySelector('.franja-remove-btn').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  /**
   * Modal de Baja Médica Guiada con Checklist de Bloqueos (FE-PRO-04 / DUDA-23).
   */
  async function openDeactivateDoctorChecklist(doc) {
    // Consultar disponibilidad actual
    let franjas = [];
    try {
      const dispRes = await window.Api.profesionales.getDisponibilidad(doc.id_profesional);
      franjas = dispRes.data || [];
    } catch {
      franjas = [];
    }

    const isConsultorioLiberado = !doc.consultorio;
    const isAgendaVacia = franjas.length === 0;

    const contentHtml = `
      <div>
        <p style="margin-top: 0;">
          Para dar de baja al profesional <strong>${window.AppHelpers.esc(doc.nombre)} ${window.AppHelpers.esc(doc.apellido)}</strong>, el sistema exige cumplir las siguientes 3 condiciones de seguridad:
        </p>

        <div class="checklist-card">
          <!-- Paso 1: Consultorio liberado -->
          <div class="checklist-item ${isConsultorioLiberado ? 'ready' : 'blocked'}" id="checkStepConsultorio">
            <div>
              <span class="checklist-icon">${isConsultorioLiberado ? '✓' : '⚠️'}</span>
              <strong>1. Consultorio liberado:</strong> ${isConsultorioLiberado ? 'Consultorio liberado (sin asignar)' : `Asignado a: "${window.AppHelpers.esc(doc.consultorio)}"`}
            </div>
            ${
              !isConsultorioLiberado
                ? '<button type="button" class="btn btn-light btn-xs" id="btnActionLiberarCons">Liberar ahora</button>'
                : '<span style="font-size: 0.84rem; font-weight: 600;">Completado</span>'
            }
          </div>

          <!-- Paso 2: Agenda vacía -->
          <div class="checklist-item ${isAgendaVacia ? 'ready' : 'blocked'}" id="checkStepAgenda">
            <div>
              <span class="checklist-icon">${isAgendaVacia ? '✓' : '⚠️'}</span>
              <strong>2. Agenda de atención vacía:</strong> ${isAgendaVacia ? 'Sin franjas configuradas' : `Tiene ${franjas.length} franja(s) activa(s)`}
            </div>
            ${
              !isAgendaVacia
                ? '<button type="button" class="btn btn-light btn-xs" id="btnActionVaciarAgenda">Vaciar agenda</button>'
                : '<span style="font-size: 0.84rem; font-weight: 600;">Completado</span>'
            }
          </div>

          <!-- Paso 3: Turnos futuros -->
          <div class="checklist-item ready" id="checkStepTurnos">
            <div>
              <span class="checklist-icon">ℹ</span>
              <strong>3. Sin turnos futuros activos:</strong> Si posee turnos pendientes o confirmados, deberá cancelarlos o reprogramarlos.
            </div>
          </div>
        </div>

        <p class="muted" style="font-size: 0.84rem; margin-bottom: 0;">
          Al completarse la baja, también se desactivará la cuenta de usuario asociada y se cerrarán sus sesiones activas.
        </p>
      </div>
    `;

    const modal = window.AppUI.modal({
      title: `Baja Médica - Checklist de Bloqueos`,
      size: 'lg',
      content: contentHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, close) => close() },
        {
          label: 'Confirmar baja del profesional',
          className: 'btn btn-danger',
          onClick: async (e, close) => {
            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Procesando baja...');

            try {
              await window.Api.profesionales.deactivate(doc.id_profesional);
              window.AppUI.showToast('Profesional dado de baja exitosamente.', 'ok');
              close();
              loadDoctors();
            } catch (err) {
              window.AppUI.showToast(err.message || 'No se pudo dar de baja al profesional.', 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });

    // Acción rápida: Liberar consultorio
    const btnLibCons = modal.dialog.querySelector('#btnActionLiberarCons');
    if (btnLibCons) {
      btnLibCons.addEventListener('click', async () => {
        window.AppUI.setLoading(btnLibCons, true, 'Liberando...');
        try {
          await window.Api.profesionales.update(doc.id_profesional, {
            id_especialidad: doc.id_especialidad,
            matricula: doc.matricula,
            consultorio: null
          });
          window.AppUI.showToast('Consultorio liberado.', 'ok');
          modal.close();
          // Reabrir modal con estado actualizado
          const updatedDoc = { ...doc, consultorio: null };
          openDeactivateDoctorChecklist(updatedDoc);
        } catch (err) {
          window.AppUI.showToast(err.message, 'bad');
          window.AppUI.setLoading(btnLibCons, false);
        }
      });
    }

    // Acción rápida: Vaciar agenda
    const btnVacAgenda = modal.dialog.querySelector('#btnActionVaciarAgenda');
    if (btnVacAgenda) {
      btnVacAgenda.addEventListener('click', async () => {
        window.AppUI.setLoading(btnVacAgenda, true, 'Vaciando...');
        try {
          await window.Api.profesionales.updateDisponibilidad(doc.id_profesional, []);
          window.AppUI.showToast('Agenda de atención vaciada.', 'ok');
          modal.close();
          openDeactivateDoctorChecklist(doc);
        } catch (err) {
          window.AppUI.showToast(err.message, 'bad');
          window.AppUI.setLoading(btnVacAgenda, false);
        }
      });
    }
  }

  /**
   * Reactivar profesional con aviso guiado (FE-PRO-05).
   */
  async function handleActivateDoctor(doc) {
    const ok = await window.AppUI.confirm({
      title: 'Reactivar profesional',
      message: `¿Desea reactivar al Dr./Dra. ${doc.nombre} ${doc.apellido}? También se reactivará su usuario asociado.`,
      confirmText: 'Reactivar'
    });

    if (!ok) return;

    try {
      await window.Api.profesionales.activate(doc.id_profesional);
      window.AppUI.showToast('Profesional reactivado exitosamente.', 'ok');

      // Advertencia de consultorio y agenda vacíos (FE-PRO-05)
      window.AppUI.modal({
        title: 'Profesional reactivado',
        size: 'sm',
        content: `
          <p>El profesional <strong>${window.AppHelpers.esc(doc.nombre)} ${window.AppHelpers.esc(doc.apellido)}</strong> ha sido reactivado.</p>
          <p style="color: var(--warning-text); font-weight: 600;">
            ⚠️ Recuerde que el profesional queda actualmente <em>sin consultorio asignado</em> y <em>sin agenda de atención</em>. Asigne un consultorio y configure su disponibilidad para poder emitir turnos.
          </p>
        `,
        actions: [{ label: 'Entendido', className: 'btn btn-primary', onClick: (_, c) => c() }]
      });

      loadDoctors();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo reactivar al profesional.', 'bad');
    }
  }

  /**
   * Inicialización de eventos y adaptaciones por rol.
   */
  function initEvents(usuario) {
    const isAdmin = usuario.rol === 'ADMINISTRADOR';

    if (!isAdmin) {
      if (actionsHeader) actionsHeader.classList.add('hidden');
      if (createDocHelp) createDocHelp.classList.add('hidden');
    }

    const debouncedSearch = window.AppHelpers.debounce(() => loadDoctors(), 300);
    searchInput.addEventListener('input', debouncedSearch);
    specialtySearchInput.addEventListener('input', debouncedSearch);

    document.querySelectorAll('.pill-group .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-group .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeEstado = btn.dataset.estado;
        loadDoctors();
      });
    });
  }

  window.AppSession.ready.then((usuario) => {
    initEvents(usuario);
    loadDoctors();
  });
})();
```

## File: frontend/js/turnos.js
```javascript
/* =============================================================
   js/turnos.js
   -------------------------------------------------------------
   Lógica integral de Turnos Médicos:
   - Solicitud de nuevo turno con selector de paciente reactivo (combobox).
   - Cálculo dinámico de horarios libres desde la API (/disponibles).
   - Filtros avanzados (fecha hoy por defecto, estados, paciente, médico).
   - Paginación en cliente de 20 registros por página.
   - Transiciones estrictas de estado según matriz de permisos (A1).
   - Modal de reprogramación (con inclusión de slot actual - FE-TUR-22).
   - Modal de observaciones de consulta en estado EN_CONSULTORIO (A2).
   - Refresco al enfocar la ventana y sondeo cada 60s (FE-GEN-10).
   ============================================================= */

(function () {
  'use strict';

  const PAGE_SIZE = 20;
  let currentPage = 1;
  let allLoadedTurnos = [];
  let currentAbortController = null;

  // Caché de datos para el formulario de alta
  let cachedDoctors = [];
  let cachedSpecialties = [];

  // Referencias DOM principales
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const toggleNewTurnBtn = document.getElementById('toggleNewTurnBtn');
  const turnFormCard = document.getElementById('turnFormCard');
  const cancelTurnBtn = document.getElementById('cancelTurnBtn');
  const submitTurnBtn = document.getElementById('submitTurnBtn');
  const refreshTurnsBtn = document.getElementById('refreshTurnsBtn');

  // Inputs del formulario de alta
  const turnForm = document.getElementById('turnForm');
  const patientSearchInput = document.getElementById('patientSearchInput');
  const patientSelect = document.getElementById('patientSelect');
  const patientDropdown = document.getElementById('patientDropdown');
  const specialtySelect = document.getElementById('specialtySelect');
  const doctorSelect = document.getElementById('doctorSelect');
  const turnDateInput = document.getElementById('turnDate');
  const turnTimeSelect = document.getElementById('turnTime');
  const motivoInput = document.getElementById('motivo');

  // Filtros de listado
  const filterDate = document.getElementById('filterDate');
  const filterAllDates = document.getElementById('filterAllDates');
  const filterStatus = document.getElementById('filterStatus');
  const filterPatient = document.getElementById('filterPatient');
  const filterDoctor = document.getElementById('filterDoctor');
  const filterDoctorField = document.getElementById('filterDoctorField');

  // Tabla y paginación
  const turnsTable = document.getElementById('turnsTable');
  const paginationInfo = document.getElementById('paginationInfo');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  /**
   * Carga el listado de turnos desde la API con filtros combinados.
   */
  async function loadTurnos() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    const isAllDates = filterAllDates.checked;
    const dateVal = isAllDates ? undefined : filterDate.value || undefined;
    const statusVal = filterStatus.value;
    const patientVal = filterPatient.value.trim();
    const doctorVal = filterDoctor.value.trim();

    const query = {
      fecha: dateVal,
      estado: statusVal !== 'todos' ? statusVal : undefined,
      paciente: patientVal || undefined,
      profesional: window.AppSession.isDoctor() ? undefined : (doctorVal || undefined)
    };

    const isPaciente = window.AppSession.isPaciente ? window.AppSession.isPaciente() : false;
    const colSpan = isPaciente ? 7 : 9;

    turnsTable.innerHTML = `<tr><td colspan="${colSpan}" class="empty-row">Cargando turnos...</td></tr>`;

    try {
      const res = await window.Api.turnos.list(query, currentAbortController.signal);
      allLoadedTurnos = res.data || [];
      currentPage = 1;
      renderCurrentPage();
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error al cargar turnos:', err);
      turnsTable.innerHTML = `<tr><td colspan="${colSpan}" class="empty-row" style="color: var(--danger);">${window.AppHelpers.esc(err.message || 'Error al cargar turnos')}</td></tr>`;
      updatePagination(0, 0, 0);
    }
  }

  /**
   * Renderiza la página actual de turnos (paginación de 20 filas).
   */
  function renderCurrentPage() {
    const isPaciente = window.AppSession.isPaciente ? window.AppSession.isPaciente() : false;
    const colSpan = isPaciente ? 8 : 9;
    const total = allLoadedTurnos.length;
    if (total === 0) {
      turnsTable.innerHTML = `<tr><td colspan="${colSpan}" class="empty-row">${isPaciente ? 'No registra turnos solicitados.' : 'No se registraron turnos para los filtros seleccionados.'}</td></tr>`;
      updatePagination(0, 0, 0);
      return;
    }

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, total);
    const pageItems = allLoadedTurnos.slice(startIdx, endIdx);

    const currentUser = window.AppSession.getUser();
    const isDoctor = window.AppSession.isDoctor();
    const isRecepOrAdmin = window.AppSession.isAdmin() || window.AppSession.isRecep();

    const fragment = document.createDocumentFragment();

    pageItems.forEach((t) => {
      const tr = document.createElement('tr');

      const pacienteInfo = `${window.AppHelpers.esc(t.paciente_apellido)}, ${window.AppHelpers.esc(t.paciente_nombre)} <br><small class="muted">DNI ${window.AppHelpers.esc(t.paciente_dni)}</small>`;
      const profesionalInfo = `${window.AppHelpers.esc(t.profesional_nombre)} ${window.AppHelpers.esc(t.profesional_apellido)}`;
      const motivoLabel = t.motivo_consulta ? window.AppHelpers.esc(t.motivo_consulta) : '<span class="muted">-</span>';

      if (isPaciente) {
        tr.innerHTML = `
          <td><strong>${window.AppHelpers.formatDate(t.fecha)}</strong></td>
          <td><code>${window.AppHelpers.esc(t.hora)}</code></td>
          <td>${profesionalInfo}</td>
          <td>${window.AppHelpers.esc(t.especialidad_nombre || '-')}</td>
          <td>${window.AppHelpers.esc(t.consultorio || '-')}</td>
          <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${window.AppHelpers.esc(t.motivo_consulta || '')}">${motivoLabel}</td>
          <td>${window.AppHelpers.statusBadge(t.estado)}</td>
          <td class="actions-cell"></td>
        `;

        const actionsCell = tr.querySelector('.actions-cell');
        renderRowActions(actionsCell, t, currentUser, isDoctor, isRecepOrAdmin);
      } else {
        tr.innerHTML = `
          <td><strong>${window.AppHelpers.formatDate(t.fecha)}</strong></td>
          <td><code>${window.AppHelpers.esc(t.hora)}</code></td>
          <td>${pacienteInfo}</td>
          <td>${profesionalInfo}</td>
          <td>${window.AppHelpers.esc(t.especialidad_nombre || '-')}</td>
          <td>${window.AppHelpers.esc(t.consultorio || '-')}</td>
          <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${window.AppHelpers.esc(t.motivo_consulta || '')}">${motivoLabel}</td>
          <td>${window.AppHelpers.statusBadge(t.estado)}</td>
          <td class="actions-cell"></td>
        `;

        const actionsCell = tr.querySelector('.actions-cell');
        renderRowActions(actionsCell, t, currentUser, isDoctor, isRecepOrAdmin);
      }

      fragment.appendChild(tr);
    });

    turnsTable.innerHTML = '';
    turnsTable.appendChild(fragment);

    updatePagination(startIdx + 1, endIdx, total);
  }

  /**
   * Renderiza los botones de acción por turno según la matriz de estados A1 y A2.
   */
  function renderRowActions(container, t, user, isDoctor, isRecepOrAdmin) {
    const estado = t.estado;
    const hoyLocal = window.AppHelpers.todayLocal();
    const isPaciente = window.AppSession.isPaciente ? window.AppSession.isPaciente() : false;

    // 1. ESTADO: PENDIENTE
    if (estado === 'PENDIENTE') {
      if (isPaciente) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-danger btn-xs';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.addEventListener('click', () => handleCancelTurno(t.id_turno));
        container.appendChild(cancelBtn);
      } else if (isRecepOrAdmin) {
        // Confirmar turno
        const confBtn = document.createElement('button');
        confBtn.type = 'button';
        confBtn.className = 'btn btn-light btn-xs';
        confBtn.style.color = 'var(--blue)';
        confBtn.textContent = 'Confirmar';
        confBtn.addEventListener('click', () => handleStatusChange(t.id_turno, 'CONFIRMADO'));
        container.appendChild(confBtn);

        // Reprogramar
        const reprogBtn = document.createElement('button');
        reprogBtn.type = 'button';
        reprogBtn.className = 'btn btn-light btn-xs';
        reprogBtn.textContent = 'Reprogramar';
        reprogBtn.addEventListener('click', () => openRescheduleModal(t));
        container.appendChild(reprogBtn);

        // Cancelar
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-danger btn-xs';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.addEventListener('click', () => handleCancelTurno(t.id_turno));
        container.appendChild(cancelBtn);
      }
    }

    // 2. ESTADO: CONFIRMADO
    else if (estado === 'CONFIRMADO') {
      if (isPaciente) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-danger btn-xs';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.addEventListener('click', () => handleCancelTurno(t.id_turno));
        container.appendChild(cancelBtn);
      }
      if (isDoctor) {
        // Registrar llegada a consultorio (solo médico asignado, hoy y en franja horaria)
        const llegadaBtn = document.createElement('button');
        llegadaBtn.type = 'button';
        llegadaBtn.className = 'btn btn-primary btn-xs';
        llegadaBtn.textContent = 'Registrar llegada';

        const esHoy = t.fecha === hoyLocal;
        const enFranja = isTimeInSlot(t.hora);

        if (!esHoy || !enFranja) {
          llegadaBtn.disabled = true;
          llegadaBtn.title = 'La llegada solo puede registrarse para turnos de hoy durante su franja horaria (hora de inicio a +30 min).';
        } else {
          llegadaBtn.addEventListener('click', () => handleStatusChange(t.id_turno, 'EN_CONSULTORIO'));
        }
        container.appendChild(llegadaBtn);
      }

      if (isRecepOrAdmin) {
        // Marcar Ausente
        const ausBtn = document.createElement('button');
        ausBtn.type = 'button';
        ausBtn.className = 'btn btn-light btn-xs';
        ausBtn.style.color = '#7a5a18';
        ausBtn.textContent = 'Ausente';
        ausBtn.addEventListener('click', () => handleStatusChange(t.id_turno, 'AUSENTE'));
        container.appendChild(ausBtn);

        // Reprogramar
        const reprogBtn = document.createElement('button');
        reprogBtn.type = 'button';
        reprogBtn.className = 'btn btn-light btn-xs';
        reprogBtn.textContent = 'Reprogramar';
        reprogBtn.addEventListener('click', () => openRescheduleModal(t));
        container.appendChild(reprogBtn);

        // Cancelar
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-danger btn-xs';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.addEventListener('click', () => handleCancelTurno(t.id_turno));
        container.appendChild(cancelBtn);
      }
    }

    // 3. ESTADO: EN_CONSULTORIO
    else if (estado === 'EN_CONSULTORIO') {
      // Observaciones (Admin, Recep y el Médico asignado - A2)
      const obsBtn = document.createElement('button');
      obsBtn.type = 'button';
      obsBtn.className = 'btn btn-light btn-xs';
      obsBtn.textContent = t.observaciones ? 'Observaciones ✎' : '+ Observaciones';
      obsBtn.title = 'Registrar o editar observaciones clínicas';
      obsBtn.addEventListener('click', () => openObservationsModal(t));
      container.appendChild(obsBtn);

      // Marcar Asistido (solo PROFESIONAL - A1)
      if (isDoctor) {
        const asistBtn = document.createElement('button');
        asistBtn.type = 'button';
        asistBtn.className = 'btn btn-primary btn-xs';
        asistBtn.textContent = 'Atendido / Asistido';
        asistBtn.addEventListener('click', () => handleStatusChange(t.id_turno, 'ASISTIDO'));
        container.appendChild(asistBtn);
      }
    }

    // 4. ESTADOS FINALES (ASISTIDO, AUSENTE, CANCELADO)
    else {
      if (t.observaciones) {
        const verObsBtn = document.createElement('button');
        verObsBtn.type = 'button';
        verObsBtn.className = 'btn btn-light btn-xs';
        verObsBtn.textContent = 'Ver notas';
        verObsBtn.addEventListener('click', () => {
          window.AppUI.modal({
            title: `Observaciones - Turno #${t.id_turno}`,
            size: 'sm',
            content: `<p style="white-space: pre-wrap; margin: 0;">${window.AppHelpers.esc(t.observaciones)}</p>`,
            actions: [{ label: 'Cerrar', className: 'btn btn-light', onClick: (_, c) => c() }]
          });
        });
        container.appendChild(verObsBtn);
      }
    }

    if (container.children.length === 0) {
      container.innerHTML = '<span class="muted">-</span>';
    }
  }

  /**
   * Determina si la hora actual cae dentro de la franja [hora, hora + 30 min).
   */
  function isTimeInSlot(horaTurno) {
    const now = new Date();
    const currMin = now.getHours() * 60 + now.getMinutes();

    const [h, m] = horaTurno.split(':').map(Number);
    const turnoMin = h * 60 + m;

    return currMin >= turnoMin && currMin < turnoMin + 30;
  }

  /**
   * Cambia el estado de un turno mediante la API (PATCH /api/turnos/:id/estado).
   */
  async function handleStatusChange(id_turno, nuevoEstado) {
    try {
      await window.Api.turnos.changeStatus(id_turno, nuevoEstado);
      window.AppUI.showToast(`Estado actualizado a ${nuevoEstado}.`, 'ok');
      loadTurnos();
    } catch (err) {
      window.AppUI.showToast(err.message || 'Error al actualizar el estado del turno.', 'bad');
    }
  }

  /**
   * Cancela un turno con confirmación modal (DELETE /api/turnos/:id).
   */
  async function handleCancelTurno(id_turno) {
    const ok = await window.AppUI.confirm({
      title: 'Cancelar turno',
      message: '¿Está seguro de que desea cancelar este turno médico? El horario quedará liberado.',
      confirmText: 'Cancelar turno',
      isDanger: true
    });

    if (!ok) return;

    try {
      await window.Api.turnos.cancel(id_turno);
      window.AppUI.showToast('Turno cancelado correctamente.', 'ok');
      loadTurnos();
    } catch (err) {
      window.AppUI.showToast(err.message || 'No se pudo cancelar el turno.', 'bad');
    }
  }

  /**
   * Modal de Edición de Observaciones (FE-TUR-23 / A2).
   */
  function openObservationsModal(t) {
    const formHtml = `
      <form id="modalObsForm" novalidate>
        <p style="margin-top: 0;">
          Paciente: <strong>${window.AppHelpers.esc(t.paciente_nombre)} ${window.AppHelpers.esc(t.paciente_apellido)}</strong> (${window.AppHelpers.esc(t.fecha)} ${window.AppHelpers.esc(t.hora)})
        </p>
        <div class="field">
          <label for="obsTextarea">Observaciones médicas / diagnóstico / indicaciones (máximo 500 caracteres):</label>
          <textarea id="obsTextarea" rows="5" maxlength="500" placeholder="Escriba las observaciones clínicas...">${window.AppHelpers.esc(t.observaciones || '')}</textarea>
          <small class="error" id="obsError"></small>
        </div>
      </form>
    `;

    window.AppUI.modal({
      title: 'Observaciones de Consulta',
      size: 'md',
      content: formHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, c) => c() },
        {
          label: 'Guardar observaciones',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const obsVal = document.getElementById('obsTextarea').value.trim();
            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Guardando...');

            try {
              await window.Api.turnos.update(t.id_turno, { observaciones: obsVal || null });
              window.AppUI.showToast('Observaciones guardadas exitosamente.', 'ok');
              close();
              loadTurnos();
            } catch (err) {
              window.AppUI.showToast(err.message || 'Error al guardar observaciones.', 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });
  }

  /**
   * Modal de Reprogramación de Turno (FE-TUR-22 / DUDA-21).
   */
  async function openRescheduleModal(t) {
    // Cargar médicos activos
    const docs = cachedDoctors.filter((d) => d.estado === 1);
    const doctorOptions = docs
      .map(
        (d) =>
          `<option value="${d.id_profesional}" ${d.id_profesional === t.id_profesional ? 'selected' : ''}>${window.AppHelpers.esc(d.apellido)}, ${window.AppHelpers.esc(d.nombre)} — Cons. ${window.AppHelpers.esc(d.consultorio || '-')}</option>`
      )
      .join('');

    const formHtml = `
      <form id="modalRescheduleForm" novalidate>
        <p style="margin-top: 0;">
          Paciente: <strong>${window.AppHelpers.esc(t.paciente_nombre)} ${window.AppHelpers.esc(t.paciente_apellido)}</strong> (DNI ${window.AppHelpers.esc(t.paciente_dni)})
        </p>
        <div class="grid-form" style="gap: 12px; margin-bottom: 12px;">
          <div class="field span-2">
            <label for="repDoctor">Profesional médico *</label>
            <select id="repDoctor" required>${doctorOptions}</select>
            <small class="error" id="repDoctorError"></small>
          </div>
          <div class="field">
            <label for="repDate">Nueva fecha *</label>
            <input type="date" id="repDate" value="${t.fecha}" min="${window.AppHelpers.todayLocal()}" required>
            <small class="error" id="repDateError"></small>
          </div>
          <div class="field">
            <label for="repTime">Nuevo horario *</label>
            <select id="repTime" required>
              <option value="">Cargando horarios...</option>
            </select>
            <small class="error" id="repTimeError"></small>
          </div>
          <div class="field span-2">
            <label for="repMotivo">Motivo de consulta</label>
            <textarea id="repMotivo" rows="2" maxlength="255">${window.AppHelpers.esc(t.motivo_consulta || '')}</textarea>
          </div>
        </div>
      </form>
    `;

    const modal = window.AppUI.modal({
      title: `Reprogramar Turno #${t.id_turno}`,
      size: 'md',
      content: formHtml,
      actions: [
        { label: 'Cancelar', className: 'btn btn-light', onClick: (_, c) => c() },
        {
          label: 'Confirmar reprogramación',
          className: 'btn btn-primary',
          onClick: async (e, close) => {
            const docId = Number(document.getElementById('repDoctor').value);
            const fechaVal = document.getElementById('repDate').value;
            const horaVal = document.getElementById('repTime').value;
            const motivoVal = document.getElementById('repMotivo').value.trim();

            const timeError = document.getElementById('repTimeError');
            timeError.textContent = '';

            if (!horaVal) {
              timeError.textContent = 'Debe seleccionar un horario de atención.';
              return;
            }

            const payload = {};
            if (docId !== t.id_profesional) payload.id_profesional = docId;
            if (fechaVal !== t.fecha) payload.fecha = fechaVal;
            if (horaVal !== t.hora) payload.hora = horaVal;
            if (motivoVal !== (t.motivo_consulta || '')) payload.motivo_consulta = motivoVal || null;

            if (Object.keys(payload).length === 0) {
              window.AppUI.showToast('No se realizaron cambios en el turno.', 'info');
              close();
              return;
            }

            const btn = e.target;
            window.AppUI.setLoading(btn, true, 'Reprogramando...');

            try {
              await window.Api.turnos.update(t.id_turno, payload);
              window.AppUI.showToast('Turno reprogramado exitosamente.', 'ok');
              close();
              loadTurnos();
            } catch (err) {
              window.AppUI.showToast(err.message || 'Error al reprogramar el turno.', 'bad');
            } finally {
              window.AppUI.setLoading(btn, false);
            }
          }
        }
      ]
    });

    const repDocSelect = modal.dialog.querySelector('#repDoctor');
    const repDateInput = modal.dialog.querySelector('#repDate');
    const repTimeSelect = modal.dialog.querySelector('#repTime');

    // Cargar horarios libres para la combinación seleccionada (incluyendo el actual si coincide médico y fecha - FE-TUR-22)
    async function loadRepSlots() {
      const docId = Number(repDocSelect.value);
      const fecha = repDateInput.value;

      if (!docId || !fecha) {
        repTimeSelect.innerHTML = '<option value="">Seleccione médico y fecha</option>';
        repTimeSelect.disabled = true;
        return;
      }

      repTimeSelect.innerHTML = '<option value="">Cargando horarios...</option>';
      repTimeSelect.disabled = true;

      try {
        const res = await window.Api.turnos.getDisponibles({ id_profesional: docId, fecha });
        const data = res.data || [];
        const horarios = (data[0] && data[0].horarios) ? [...data[0].horarios] : [];

        // FE-TUR-22: si médico y fecha no cambian, agregar manualmente el horario actual del turno
        if (docId === t.id_profesional && fecha === t.fecha && !horarios.includes(t.hora)) {
          horarios.push(t.hora);
          horarios.sort();
        }

        if (horarios.length === 0) {
          repTimeSelect.innerHTML = '<option value="">Sin horarios disponibles</option>';
          repTimeSelect.disabled = true;
          return;
        }

        repTimeSelect.innerHTML = horarios
          .map((h) => `<option value="${h}" ${h === t.hora ? 'selected' : ''}>${h}</option>`)
          .join('');
        repTimeSelect.disabled = false;
      } catch (err) {
        repTimeSelect.innerHTML = '<option value="">Error al obtener horarios</option>';
      }
    }

    repDocSelect.addEventListener('change', loadRepSlots);
    repDateInput.addEventListener('change', loadRepSlots);
    loadRepSlots();
  }

  /**
   * Actualiza los controles visuales de paginación.
   */
  function updatePagination(from, to, total) {
    paginationInfo.textContent = `Mostrando ${from} - ${to} de ${total} turnos`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = to >= total;
  }

  /* -------------------------------------------------------------
     LÓGICA DEL FORMULARIO DE ALTA DE TURNO (ADMIN/RECEP)
     ------------------------------------------------------------- */
  async function initCreateForm() {
    turnDateInput.min = window.AppHelpers.todayLocal();
    turnDateInput.value = window.AppHelpers.todayLocal();

    // Cargar especialidades y médicos
    try {
      const [espRes, docRes] = await Promise.all([
        window.Api.especialidades.list({ estado: 1 }),
        window.Api.profesionales.list({ estado: 1 })
      ]);

      cachedSpecialties = espRes.data || [];
      cachedDoctors = docRes.data || [];

      specialtySelect.innerHTML = '<option value="">Seleccione especialidad...</option>' +
        cachedSpecialties.map((e) => `<option value="${e.id_especialidad}">${window.AppHelpers.esc(e.nombre)}</option>`).join('');
    } catch (err) {
      console.error('Error al inicializar formulario de turnos:', err);
    }

    // Cascada especialidad -> profesionales
    specialtySelect.addEventListener('change', () => {
      const espId = Number(specialtySelect.value);
      if (!espId) {
        doctorSelect.innerHTML = '<option value="">Primero elija una especialidad</option>';
        doctorSelect.disabled = true;
        resetAvailableSlots();
        return;
      }

      const filteredDocs = cachedDoctors.filter((d) => d.id_especialidad === espId && d.consultorio);
      if (filteredDocs.length === 0) {
        doctorSelect.innerHTML = '<option value="">Sin médicos con consultorio en esta rama</option>';
        doctorSelect.disabled = true;
        resetAvailableSlots();
        return;
      }

      doctorSelect.innerHTML = '<option value="">Seleccione médico...</option>' +
        filteredDocs.map((d) => `<option value="${d.id_profesional}">${window.AppHelpers.esc(d.apellido)}, ${window.AppHelpers.esc(d.nombre)} — Cons. ${window.AppHelpers.esc(d.consultorio)}</option>`).join('');
      doctorSelect.disabled = false;
      resetAvailableSlots();
    });

    doctorSelect.addEventListener('change', fetchAvailableSlots);
    turnDateInput.addEventListener('change', fetchAvailableSlots);

    // Combobox de búsqueda de paciente (FE-TUR-01)
    initPatientCombobox();

    // Toggle de formulario
    toggleNewTurnBtn.addEventListener('click', () => {
      turnFormCard.classList.toggle('hidden');
      if (!turnFormCard.classList.contains('hidden')) {
        patientSearchInput.focus();
        turnFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    cancelTurnBtn.addEventListener('click', () => {
      turnFormCard.classList.add('hidden');
      turnForm.reset();
      patientSelect.value = '';
      patientSearchInput.value = '';
      resetAvailableSlots();
    });

    turnForm.addEventListener('submit', handleCreateTurnSubmit);
  }

  /**
   * Combobox reactivo de búsqueda de paciente (FE-TUR-01 / DUDA-20).
   */
  function initPatientCombobox() {
    let comboboxAbort = null;

    const handlePatientSearch = window.AppHelpers.debounce(async () => {
      const q = patientSearchInput.value.trim();
      if (!q) {
        patientDropdown.classList.add('hidden');
        patientSelect.value = '';
        return;
      }

      if (comboboxAbort) comboboxAbort.abort();
      comboboxAbort = new AbortController();

      try {
        const res = await window.Api.pacientes.list({ q, estado: 1 }, comboboxAbort.signal);
        const pacientes = res.data || [];

        if (pacientes.length === 0) {
          patientDropdown.innerHTML = '<div class="autocomplete-item" style="color: var(--muted); cursor: default;">Sin coincidencias</div>';
          patientDropdown.classList.remove('hidden');
          return;
        }

        patientDropdown.innerHTML = '';
        pacientes.forEach((p) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.innerHTML = `
            <strong>${window.AppHelpers.esc(p.apellido)}, ${window.AppHelpers.esc(p.nombre)}</strong>
            <span class="item-sub">DNI: ${window.AppHelpers.esc(p.dni)} · ${window.AppHelpers.esc(p.correo)}</span>
          `;
          item.addEventListener('click', () => {
            patientSelect.value = p.id_paciente;
            patientSearchInput.value = `${p.apellido}, ${p.nombre} (DNI ${p.dni})`;
            patientDropdown.classList.add('hidden');
            document.getElementById('id_pacienteError').textContent = '';
            specialtySelect.focus();
          });
          patientDropdown.appendChild(item);
        });

        patientDropdown.classList.remove('hidden');
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }, 250);

    patientSearchInput.addEventListener('input', handlePatientSearch);

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!patientSearchInput.contains(e.target) && !patientDropdown.contains(e.target)) {
        patientDropdown.classList.add('hidden');
      }
    });
  }

  /**
   * Reinicia el selector de horarios disponibles.
   */
  function resetAvailableSlots() {
    turnTimeSelect.innerHTML = '<option value="">Seleccione médico y fecha</option>';
    turnTimeSelect.disabled = true;
  }

  /**
   * Consulta horarios libres a /api/turnos/disponibles (FE-TUR-03).
   */
  async function fetchAvailableSlots() {
    const docId = Number(doctorSelect.value);
    const fecha = turnDateInput.value;

    if (!docId || !fecha) {
      resetAvailableSlots();
      return;
    }

    turnTimeSelect.innerHTML = '<option value="">Consultando disponibilidad...</option>';
    turnTimeSelect.disabled = true;

    try {
      const res = await window.Api.turnos.getDisponibles({ id_profesional: docId, fecha });
      const data = res.data || [];
      const horarios = (data[0] && data[0].horarios) ? data[0].horarios : [];

      if (horarios.length === 0) {
        turnTimeSelect.innerHTML = '<option value="">Sin turnos libres para esta fecha</option>';
        turnTimeSelect.disabled = true;
        return;
      }

      turnTimeSelect.innerHTML = '<option value="">Seleccione hora...</option>' +
        horarios.map((h) => `<option value="${h}">${h}</option>`).join('');
      turnTimeSelect.disabled = false;
    } catch (err) {
      turnTimeSelect.innerHTML = '<option value="">Error al obtener disponibilidad</option>';
    }
  }

  /**
   * Envío del formulario de alta de turno.
   */
  async function handleCreateTurnSubmit(e) {
    e.preventDefault();

    const isPaciente = window.AppSession.isPaciente ? window.AppSession.isPaciente() : false;
    const id_paciente = isPaciente ? undefined : Number(patientSelect.value);
    const id_profesional = Number(doctorSelect.value);
    const fecha = turnDateInput.value;
    const hora = turnTimeSelect.value;
    const motivo_consulta = motivoInput.value.trim() || null;

    // Validación cliente
    const errorMap = {};
    if (!isPaciente && !id_paciente) errorMap.id_paciente = 'Debe seleccionar un paciente de la lista de búsqueda.';
    if (!id_profesional) errorMap.id_profesional = 'Debe seleccionar un profesional.';
    if (!fecha) errorMap.fecha = 'Fecha requerida.';
    if (!hora) errorMap.hora = 'Debe seleccionar un horario disponible.';

    window.AppUI.renderFieldErrors(turnForm, errorMap);
    if (Object.keys(errorMap).length > 0) return;

    window.AppUI.setLoading(submitTurnBtn, true, 'Confirmando...');

    try {
      const payload = {
        id_profesional,
        fecha,
        hora,
        motivo_consulta
      };
      if (!isPaciente) {
        payload.id_paciente = id_paciente;
      }

      const res = await window.Api.turnos.create(payload);
      const nuevoTurno = res.data;

      turnFormCard.classList.add('hidden');
      turnForm.reset();
      if (patientSelect) patientSelect.value = '';
      if (patientSearchInput) patientSearchInput.value = '';
      resetAvailableSlots();

      loadTurnos();

      if (isPaciente) {
        // Modal de confirmación para paciente (RFM-16, HU-M07, CA-M07.1, CA-M07.2)
        const docName = nuevoTurno.profesional_nombre
          ? `${nuevoTurno.profesional_nombre} ${nuevoTurno.profesional_apellido}`
          : (doctorSelect.selectedOptions[0]?.text || '-');
        const specName = nuevoTurno.especialidad_nombre || (specialtySelect.selectedOptions[0]?.text || '-');
        const consultorioVal = nuevoTurno.consultorio || '-';
        const fechaFormateada = window.AppHelpers.formatDate(nuevoTurno.fecha || fecha);
        const horaVal = nuevoTurno.hora || hora;

        window.AppUI.modal({
          title: '¡Solicitud de Turno Registrada!',
          size: 'md',
          content: `
            <div style="text-align: center; margin-bottom: 16px;">
              <div style="font-size: 2.2rem; color: var(--success); margin-bottom: 8px;">✓</div>
              <h3 style="margin: 0 0 4px;">Turno #${nuevoTurno.id_turno}</h3>
              <span class="badge" style="background: #fff3e0; color: #e65100; font-size: 0.85rem; padding: 4px 10px;">Estado: PENDIENTE</span>
            </div>
            <div style="background: var(--bg); padding: 14px; border-radius: 8px; margin-bottom: 16px; font-size: 0.95rem; line-height: 1.6;">
              <div><strong>Profesional:</strong> ${window.AppHelpers.esc(docName)}</div>
              <div><strong>Especialidad:</strong> ${window.AppHelpers.esc(specName)}</div>
              <div><strong>Consultorio:</strong> ${window.AppHelpers.esc(consultorioVal)}</div>
              <div><strong>Fecha:</strong> ${fechaFormateada}</div>
              <div><strong>Horario:</strong> ${window.AppHelpers.esc(horaVal)} hs</div>
            </div>
            <div style="background: #e3f2fd; border-left: 4px solid var(--primary); padding: 10px 14px; border-radius: 4px; font-size: 0.88rem; color: #0d47a1; margin-bottom: 8px;">
              ℹ Su solicitud ha sido registrada correctamente. El turno se encuentra en estado <strong>Pendiente</strong> y debe ser confirmado por la recepción del centro médico.
            </div>
          `,
          actions: [
            {
              label: 'Ver mis turnos',
              className: 'btn btn-primary',
              onClick: (_, close) => {
                close();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            },
            {
              label: 'Solicitar otro turno',
              className: 'btn btn-light',
              onClick: (_, close) => {
                close();
                turnFormCard.classList.remove('hidden');
                turnFormCard.scrollIntoView({ behavior: 'smooth' });
              }
            }
          ]
        });
      } else {
        window.AppUI.showToast('Turno asignado exitosamente.', 'ok');
      }
    } catch (err) {
      if (err.status === 400 || err.status === 409) {
        window.AppUI.renderFieldErrors(turnForm, err.campos);
        window.AppUI.showToast(err.message, 'bad');
        // Recalcular horarios si hubo conflicto
        fetchAvailableSlots();
      } else {
        window.AppUI.showToast(err.message || 'Error al registrar turno.', 'bad');
      }
    } finally {
      window.AppUI.setLoading(submitTurnBtn, false);
    }
  }

  /**
   * Configura eventos de filtros, paginación y refresco periódico.
   */
  function initEvents(usuario) {
    const isDoctor = usuario.rol === 'PROFESIONAL';
    const isPaciente = usuario.rol === 'PACIENTE';

    if (isDoctor) {
      if (pageTitle) pageTitle.textContent = 'Mis turnos médicos';
      if (pageSubtitle) pageSubtitle.textContent = 'Historial y consultas programadas bajo su atención.';
      if (toggleNewTurnBtn) toggleNewTurnBtn.classList.add('hidden');
      if (filterDoctorField) filterDoctorField.classList.add('hidden');
    } else if (isPaciente) {
      if (pageTitle) pageTitle.textContent = 'Mis turnos médicos';
      if (pageSubtitle) pageSubtitle.textContent = 'Historial y turnos programados.';
      if (toggleNewTurnBtn) {
        toggleNewTurnBtn.textContent = '+ Solicitar turno';
        toggleNewTurnBtn.classList.remove('hidden');
      }
      const patientField = document.getElementById('patientFieldGroup');
      if (patientField) patientField.classList.add('hidden');
      if (patientSearchInput) patientSearchInput.removeAttribute('required');
      if (patientSelect) patientSelect.removeAttribute('required');

      const thPatient = document.getElementById('thPatient');
      if (thPatient) thPatient.classList.add('hidden');

      initCreateForm();
    } else {
      initCreateForm();
    }

    // Inicializar filtro de fecha con hoy local
    filterDate.value = window.AppHelpers.todayLocal();

    filterAllDates.addEventListener('change', () => {
      filterDate.disabled = filterAllDates.checked;
      loadTurnos();
    });

    filterDate.addEventListener('change', () => loadTurnos());
    filterStatus.addEventListener('change', () => loadTurnos());

    const debouncedFilter = window.AppHelpers.debounce(() => loadTurnos(), 300);
    filterPatient.addEventListener('input', debouncedFilter);
    filterDoctor.addEventListener('input', debouncedFilter);

    refreshTurnsBtn.addEventListener('click', () => loadTurnos());

    // Paginación
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCurrentPage();
      }
    });

    nextPageBtn.addEventListener('click', () => {
      if (currentPage * PAGE_SIZE < allLoadedTurnos.length) {
        currentPage++;
        renderCurrentPage();
      }
    });

    // FE-GEN-10: Refrescar al reenfocar la ventana y sondeo cada 60s
    window.addEventListener('focus', () => loadTurnos());
    setInterval(() => loadTurnos(), 60000);
  }

  window.AppSession.ready.then((usuario) => {
    initEvents(usuario);
    loadTurnos();
  });
})();
```

## File: frontend/js/ui.js
```javascript
/* =============================================================
   js/ui.js
   -------------------------------------------------------------
   Componentes visuales y helpers compartidos de Salud Turnos.
   - Sistema de notificaciones emergentes (Toasts).
   - Sistema de modales accesibles con focus trap y escape.
   - Diálogo de confirmación accesible (reemplaza window.confirm).
   - Sanitización contra XSS (AppHelpers.esc).
   - Manejo de fechas locales (AppHelpers.todayLocal, formatDate).
   - Badges y estados de turnos y entidades.
   - Debounce y prevención de doble submit.
   ============================================================= */

(function () {
  'use strict';

  window.AppHelpers = window.AppHelpers || {};
  window.AppUI = window.AppUI || {};

  /* -------------------------------------------------------------
     1. HELPERS DE SANITIZACIÓN Y FORMATO
     ------------------------------------------------------------- */

  /**
   * Escapa caracteres especiales de HTML para prevenir inyecciones XSS (DT-06).
   * @param {any} val
   * @returns {string}
   */
  function esc(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Devuelve la fecha de hoy en formato YYYY-MM-DD usando la zona local del navegador (DT-07).
   * Evita el desfasaje UTC después de las 21:00 hs en Argentina.
   * @returns {string}
   */
  function todayLocal() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatea una fecha YYYY-MM-DD a DD/MM/AAAA para visualización de usuario (FE-GEN-11).
   * @param {string} isoDate
   * @returns {string}
   */
  function formatDate(isoDate) {
    if (!isoDate || typeof isoDate !== 'string') return '-';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  /**
   * Formatea una fecha y hora ISO para visualización.
   * @param {string} isoDateTime
   * @returns {string}
   */
  function formatDateTime(isoDateTime) {
    if (!isoDateTime) return '-';
    // Formatos posibles: "YYYY-MM-DD HH:MM:SS" o ISO standard
    const [datePart, timePart] = isoDateTime.split(' ');
    if (datePart && timePart) {
      return `${formatDate(datePart)} ${timePart.slice(0, 5)}`;
    }
    return isoDateTime;
  }

  /**
   * Devuelve una función debounced para optimizar búsquedas en tiempo real (DT-11).
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* -------------------------------------------------------------
     2. ESTADOS Y BADGES DE TURNOS Y ENTIDADES (DT-10)
     ------------------------------------------------------------- */
  const ESTADOS_TURNO = {
    PENDIENTE: { label: 'Pendiente', css: 'pendiente' },
    CONFIRMADO: { label: 'Confirmado', css: 'confirmado' },
    EN_CONSULTORIO: { label: 'En Consultorio', css: 'en-consultorio' },
    ASISTIDO: { label: 'Asistido', css: 'asistido' },
    AUSENTE: { label: 'Ausente', css: 'ausente' },
    CANCELADO: { label: 'Cancelado', css: 'cancelado' }
  };

  /**
   * Genera el HTML de un badge para el estado de un turno.
   * @param {string} estado
   * @returns {string}
   */
  function statusBadge(estado) {
    if (!estado) return '<span class="badge">-</span>';
    const info = ESTADOS_TURNO[estado] || {
      label: estado,
      css: String(estado).toLowerCase().replace(/_/g, '-')
    };
    return `<span class="badge ${esc(info.css)}">${esc(info.label)}</span>`;
  }

  /**
   * Genera el HTML de un badge de activo / inactivo.
   * @param {number|boolean} estado
   * @returns {string}
   */
  function activeBadge(estado) {
    const isActivo = estado === 1 || estado === true || estado === '1';
    return isActivo
      ? '<span class="badge activo">Activo</span>'
      : '<span class="badge inactivo">Inactivo</span>';
  }

  /* -------------------------------------------------------------
     3. SISTEMA DE TOASTS FLOTANTES
     ------------------------------------------------------------- */
  function showToast(message, type = 'info', duration = 5000) {
    if (!message) return;

    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const isOk = type === 'ok' || type === 'success';
    const isBad = type === 'bad' || type === 'error' || type === 'danger';
    const toastClass = isOk ? 'ok' : isBad ? 'bad' : 'info';
    const icon = isOk ? '✓' : isBad ? '✕' : 'ℹ';

    const toast = document.createElement('div');
    toast.className = `toast ${toastClass}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${esc(message)}</span>
      <button class="toast-close" type="button" aria-label="Cerrar notificación">&times;</button>
    `;

    container.appendChild(toast);

    let isClosing = false;
    function removeToast() {
      if (isClosing) return;
      isClosing = true;
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 350);
    }

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) closeBtn.addEventListener('click', removeToast);

    setTimeout(removeToast, duration);
  }

  /* -------------------------------------------------------------
     4. SISTEMA DE MODALES ACCESIBLES (DT-12)
     ------------------------------------------------------------- */
  /**
   * Crea y abre un modal accesible con backdrop, focus trap y cierre con Escape.
   * @param {Object} config
   * @param {string} config.title
   * @param {string|HTMLElement} config.content
   * @param {Array<{ label: string, className?: string, onClick?: Function, type?: string }>} [config.actions]
   * @param {Function} [config.onClose]
   * @param {string} [config.size] 'sm' | 'md' | 'lg'
   * @returns {{ close: Function, element: HTMLElement }}
   */
  function openModal({ title, content, actions = [], onClose, size = 'md' }) {
    const prevActiveElement = document.activeElement;
    const modalId = `modal_${Date.now()}`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `${modalId}_title`);

    const dialog = document.createElement('div');
    dialog.className = `modal-dialog modal-${size}`;

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h2 id="${modalId}_title" class="modal-title">${esc(title)}</h2>
      <button type="button" class="modal-close-btn" aria-label="Cerrar ventana modal">&times;</button>
    `;

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    actions.forEach((act) => {
      const btn = document.createElement('button');
      btn.type = act.type || 'button';
      btn.className = act.className || 'btn btn-light';
      btn.textContent = act.label;
      btn.addEventListener('click', (e) => {
        if (act.onClick) {
          act.onClick(e, closeModal);
        } else {
          closeModal();
        }
      });
      footer.appendChild(btn);
    });

    dialog.appendChild(header);
    dialog.appendChild(body);
    if (actions.length > 0) {
      dialog.appendChild(footer);
    }
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    let isClosed = false;
    function closeModal() {
      if (isClosed) return;
      isClosed = true;
      document.removeEventListener('keydown', handleKeyDown);
      overlay.classList.add('modal-closing');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (prevActiveElement && typeof prevActiveElement.focus === 'function') {
          prevActiveElement.focus();
        }
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 200);
    }

    // Botón de cerrar del header
    const closeBtn = header.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', closeModal);

    // Clic fuera del diálogo (en overlay)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Manejo de foco (Focus Trap) y tecla Escape
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = dialog.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Enfocar primer elemento interactivo
    setTimeout(() => {
      const focusable = dialog.querySelector(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button.btn-primary, button:not([disabled])'
      );
      if (focusable) {
        focusable.focus();
      } else {
        closeBtn.focus();
      }
    }, 50);

    return {
      close: closeModal,
      element: overlay,
      dialog
    };
  }

  /**
   * Diálogo modal de confirmación accesible (reemplaza window.confirm).
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.message
   * @param {string} [options.confirmText]
   * @param {string} [options.cancelText]
   * @param {boolean} [options.isDanger]
   * @returns {Promise<boolean>}
   */
  function confirmDialog({
    title = '¿Está seguro?',
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDanger = false
  }) {
    return new Promise((resolve) => {
      openModal({
        title,
        size: 'sm',
        content: `<p class="confirm-message">${esc(message)}</p>`,
        actions: [
          {
            label: cancelText,
            className: 'btn btn-light',
            onClick: (_, close) => {
              resolve(false);
              close();
            }
          },
          {
            label: confirmText,
            className: isDanger ? 'btn btn-danger' : 'btn btn-primary',
            onClick: (_, close) => {
              resolve(true);
              close();
            }
          }
        ],
        onClose: () => resolve(false)
      });
    });
  }

  /* -------------------------------------------------------------
     5. PREVENCIÓN DE DOBLE ENVÍO Y ESTADOS DE CARGA (DT-09)
     ------------------------------------------------------------- */
  /**
   * Establece el estado de carga de un botón de formulario.
   * @param {HTMLButtonElement} buttonEl
   * @param {boolean} isLoading
   * @param {string} [loadingText]
   */
  function setLoading(buttonEl, isLoading, loadingText = 'Guardando...') {
    if (!buttonEl) return;
    if (isLoading) {
      buttonEl.dataset.originalText = buttonEl.textContent;
      buttonEl.disabled = true;
      buttonEl.innerHTML = `<span class="spinner-sm"></span> ${esc(loadingText)}`;
    } else {
      buttonEl.disabled = false;
      if (buttonEl.dataset.originalText) {
        buttonEl.textContent = buttonEl.dataset.originalText;
        delete buttonEl.dataset.originalText;
      }
    }
  }

  /**
   * Mapea un objeto de errores de campos ({ campo: 'error' }) a los elementos <small class="error">
   * y resalta los inputs asociados.
   * @param {HTMLFormElement} formEl
   * @param {Object} campos
   */
  function renderFieldErrors(formEl, campos = {}) {
    if (!formEl) return;

    // Limpia errores previos
    formEl.querySelectorAll('.error, small.error').forEach((el) => {
      el.textContent = '';
    });
    formEl.querySelectorAll('.input-error').forEach((el) => {
      el.classList.remove('input-error');
    });

    if (!campos || typeof campos !== 'object') return;

    for (const [campo, mensaje] of Object.entries(campos)) {
      // Intenta id con campo directo o primer segmento (ej: "profesional.matricula" -> "matricula" o "profesional_matricula")
      const candidateIds = [
        `${campo}Error`,
        `${campo.replace(/\./g, '_')}Error`,
        `${campo.split('.').pop()}Error`
      ];

      let errorEl = null;
      for (const id of candidateIds) {
        errorEl = formEl.querySelector(`#${id}`);
        if (errorEl) break;
      }

      if (errorEl) {
        errorEl.textContent = mensaje;
      }

      // Marcar input correspondiente
      const inputCandidates = [
        `[name="${campo}"]`,
        `#${campo}`,
        `#${campo.replace(/\./g, '_')}`,
        `#${campo.split('.').pop()}`
      ];
      let inputEl = null;
      for (const sel of inputCandidates) {
        inputEl = formEl.querySelector(sel);
        if (inputEl) break;
      }
      if (inputEl) {
        inputEl.classList.add('input-error');
      }
    }
  }

  // Exportar al ámbito global
  Object.assign(window.AppHelpers, {
    esc,
    todayLocal,
    formatDate,
    formatDateTime,
    debounce,
    statusBadge,
    activeBadge,
    showToast
  });

  Object.assign(window.AppUI, {
    showToast,
    modal: openModal,
    confirm: confirmDialog,
    setLoading,
    renderFieldErrors
  });
})();
```

## File: frontend/js/usuarios.js
```javascript
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
      } else if (u.rol === 'PACIENTE') {
        rolBadge = '<span class="badge" style="background: #e1f5fe; color: #0277bd;">Paciente</span>';
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
              <option value="PACIENTE">Paciente</option>
            </select>
            <small class="error" id="cuRolError"></small>
          </div>
        </div>

        <!-- Sección Paciente (Visible solo si rol === PACIENTE) -->
        <div id="cuPatientSection" class="hidden" style="margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line);">
          <h4 style="margin: 0 0 10px; color: var(--navy-dark);">Datos de la Ficha del Paciente</h4>
          <div class="grid-form" style="gap: 12px; margin-bottom: 14px;">
            <div class="field">
              <label for="cuDni">DNI * (7 u 8 dígitos)</label>
              <input id="cuDni" name="dni" maxlength="8" placeholder="Ej: 30111222">
              <small class="error" id="cuDniError"></small>
            </div>
            <div class="field">
              <label for="cuTelefono">Teléfono (opcional)</label>
              <input id="cuTelefono" name="telefono" maxlength="12" placeholder="Ej: 3764111111">
              <small class="error" id="cuTelefonoError"></small>
            </div>
            <div class="field">
              <label for="cuFechaNac">Fecha de nacimiento (opcional)</label>
              <input type="date" id="cuFechaNac" name="fecha_nacimiento">
              <small class="error" id="cuFechaNacError"></small>
            </div>
            <div class="field">
              <label for="cuObraSocial">Obra Social (opcional)</label>
              <input id="cuObraSocial" name="obra_social" maxlength="100" placeholder="Ej: OSDE">
              <small class="error" id="cuObraSocialError"></small>
            </div>
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

    // Control de visibilidad de sección profesional o paciente
    const rolSelect = modal.dialog.querySelector('#cuRol');
    const doctorSec = modal.dialog.querySelector('#cuDoctorSection');
    const patientSec = modal.dialog.querySelector('#cuPatientSection');
    const franjasList = modal.dialog.querySelector('#cuFranjasList');
    const addFranjaBtn = modal.dialog.querySelector('#cuAddFranjaBtn');

    function toggleRoleSections() {
      if (rolSelect.value === 'PROFESIONAL') {
        doctorSec.classList.remove('hidden');
        patientSec.classList.add('hidden');
        if (franjasList.children.length === 0) {
          addFranjaRow(franjasList, 'LUNES', '08:00', '12:00');
        }
      } else if (rolSelect.value === 'PACIENTE') {
        patientSec.classList.remove('hidden');
        doctorSec.classList.add('hidden');
      } else {
        doctorSec.classList.add('hidden');
        patientSec.classList.add('hidden');
      }
    }

    rolSelect.addEventListener('change', toggleRoleSections);
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
    let pacienteData = undefined;

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
    } else if (rol === 'PACIENTE') {
      const dni = document.getElementById('cuDni').value.trim();
      const telefono = document.getElementById('cuTelefono').value.trim() || undefined;
      const fecha_nacimiento = document.getElementById('cuFechaNac').value.trim() || undefined;
      const obra_social = document.getElementById('cuObraSocial').value.trim() || undefined;

      if (!dni || !/^\d{7,8}$/.test(dni)) {
        campos.cuDni = 'El DNI debe tener 7 u 8 dígitos numéricos.';
      }

      pacienteData = {
        dni,
        telefono,
        fecha_nacimiento,
        obra_social
      };
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
      ...(disponibilidadData ? { disponibilidad: disponibilidadData } : {}),
      ...(pacienteData ? { paciente: pacienteData } : {})
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
          else if (k === 'paciente.dni' || k === 'dni') mappedErrors.cuDni = v;
          else if (k === 'paciente.telefono' || k === 'telefono') mappedErrors.cuTelefono = v;
          else if (k === 'paciente.fecha_nacimiento' || k === 'fecha_nacimiento') mappedErrors.cuFechaNac = v;
          else if (k === 'paciente.obra_social' || k === 'obra_social') mappedErrors.cuObraSocial = v;
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
```

## File: frontend/agenda.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Agenda Médica</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Encabezado de la Agenda Médica -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Agenda médica</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">
    <!-- Sidebar generado dinámicamente por common.js -->
    <nav class="sidebar" aria-label="Navegación principal"></nav>

    <main class="content">
      <div class="page-title-row">
        <div>
          <h1 id="agendaPageTitle">Agenda médica</h1>
          <p class="muted">Cronograma de horarios libres y turnos de atención asignados.</p>
        </div>

        <!-- Selector de Modo: Diaria vs Mensual (DUDA-12a) -->
        <div class="pill-group" role="group" aria-label="Modo de agenda">
          <button type="button" class="pill-btn active" id="btnModeDaily" data-mode="daily">Vista diaria</button>
          <button type="button" class="pill-btn" id="btnModeMonthly" data-mode="monthly">Vista mensual</button>
        </div>
      </div>

      <!-- Filtros utilizados para la agenda -->
      <section class="panel-card" style="margin-bottom: 24px;">
        <div class="filters-grid">
          <div class="field">
            <label for="agendaDate" id="agendaDateLabel">Fecha de atención</label>
            <input type="date" id="agendaDate">
          </div>

          <div class="field" id="agendaSpecialtyField">
            <label for="agendaSpecialty">Especialidad médica</label>
            <select id="agendaSpecialty">
              <option value="">Todas las especialidades</option>
            </select>
          </div>

          <div class="field" id="agendaDoctorField">
            <label for="agendaDoctor">Profesional médico</label>
            <select id="agendaDoctor">
              <option value="">Todos los profesionales</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Contenedor dinámico de la agenda médica -->
      <section class="panel-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 id="agendaGridTitle">Disponibilidad y turnos</h2>
          <button type="button" class="btn btn-light btn-xs" id="refreshAgendaBtn">🔄 Actualizar</button>
        </div>
        <div id="agendaGrid" class="agenda-grid">
          <p class="muted" style="text-align: center; padding: 24px 0;">Cargando agenda médica...</p>
        </div>
      </section>
    </main>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/agenda.js"></script>
</body>
</html>
```

## File: frontend/cuenta.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Mi cuenta</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Encabezado de la pantalla -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Mi cuenta</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">
    <!-- Sidebar generado dinámicamente por common.js -->
    <nav class="sidebar" aria-label="Navegación principal"></nav>

    <main class="content">
      <div class="page-title-row">
        <div>
          <h1>Mi cuenta</h1>
          <p class="muted">Información personal, datos profesionales y seguridad.</p>
        </div>
      </div>

      <!-- Tarjeta 1: Información del perfil -->
      <section class="panel-card" style="margin-bottom: 24px;">
        <h2>Información del perfil</h2>
        <div id="profileLoading" style="color: var(--muted); padding: 12px 0;">Cargando información...</div>
        <div id="profileContent" class="hidden">
          <div class="grid-form" style="margin-bottom: 16px;">
            <div class="field">
              <label>Nombre y Apellido</label>
              <div id="userName" style="font-weight: 600; padding: 8px 0;">-</div>
            </div>
            <div class="field">
              <label>Correo electrónico</label>
              <div id="userEmail" style="padding: 8px 0;">-</div>
            </div>
            <div class="field">
              <label>Rol en el sistema</label>
              <div id="userRole" style="padding: 8px 0;">-</div>
            </div>
            <div class="field hidden" id="patientDniField">
              <label>DNI</label>
              <div id="userDni" style="padding: 8px 0;">-</div>
            </div>
          </div>

          <!-- Bloque adicional para Profesionales Médicos -->
          <div id="doctorProfileBlock" class="hidden" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line);">
            <h3>Datos Profesionales</h3>
            <div class="grid-form" style="margin-top: 12px;">
              <div class="field">
                <label>Especialidad</label>
                <div id="doctorSpecialty" style="font-weight: 600; padding: 6px 0;">-</div>
              </div>
              <div class="field">
                <label>Matrícula</label>
                <div id="doctorLicense" style="padding: 6px 0;">-</div>
              </div>
              <div class="field">
                <label>Consultorio asignado</label>
                <div id="doctorOffice" style="padding: 6px 0;">-</div>
              </div>
            </div>

            <!-- Horarios semanales de atención (A8) -->
            <div style="margin-top: 20px;">
              <h4>Disponibilidad semanal de atención</h4>
              <p class="muted" style="font-size: 0.88rem; margin: 4px 0 12px;">Horarios configurados en su agenda médica.</p>
              <div class="table-wrap" style="max-width: 650px;">
                <table>
                  <thead>
                    <tr>
                      <th>Día de la semana</th>
                      <th>Horario de atención</th>
                    </tr>
                  </thead>
                  <tbody id="doctorAvailabilityTable">
                    <tr><td colspan="2" class="empty-row">Cargando disponibilidad...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tarjeta 2: Cambio de Contraseña -->
      <section class="panel-card" style="max-width: 650px;">
        <h2>Cambiar contraseña</h2>
        <p class="muted" style="margin-bottom: 16px;">
          La nueva contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y al menos un carácter especial (<code># $ @ ! % * ? &</code>).
        </p>

        <form id="changePasswordForm" class="grid-form" novalidate>
          <div class="field span-2">
            <label for="clave_actual">Contraseña actual *</label>
            <input type="password" id="clave_actual" name="clave_actual" autocomplete="current-password" required>
            <small class="error" id="clave_actualError"></small>
          </div>

          <div class="field">
            <label for="clave_nueva">Nueva contraseña *</label>
            <input type="password" id="clave_nueva" name="clave_nueva" autocomplete="new-password" required>
            <small class="error" id="clave_nuevaError"></small>
          </div>

          <div class="field">
            <label for="clave_confirm">Confirmar nueva contraseña *</label>
            <input type="password" id="clave_confirm" name="clave_confirm" autocomplete="new-password" required>
            <small class="error" id="clave_confirmError"></small>
          </div>

          <div class="form-actions span-2">
            <button type="submit" class="btn btn-primary" id="savePasswordBtn">Actualizar contraseña</button>
          </div>
        </form>
      </section>
    </main>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/cuenta.js"></script>
</body>
</html>
```

## File: frontend/dashboard.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Panel principal</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Barra superior utilizada en las pantallas privadas -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Panel principal</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">
    <!-- Sidebar generado dinámicamente por common.js -->
    <nav class="sidebar" aria-label="Navegación principal"></nav>

    <main class="content">
      <div class="page-title-row">
        <div>
          <h1 id="dashTitle">Panel principal</h1>
          <p class="muted" id="dashSubtitle">Resumen de actividad e indicadores de atención médica.</p>
          <span class="muted" id="dashboardWindowNotice" style="font-size: 0.84rem; display: block; margin-top: 4px;">
            Cargando período...
          </span>
        </div>
      </div>

      <!-- Indicadores principales destacados (TP2) -->
      <section class="stats-grid" aria-label="Indicadores principales" style="margin-bottom: 12px;">
        <article class="stat-card">
          <span>Turnos en ventana (30 días)</span>
          <strong id="totalTurnos">0</strong>
        </article>

        <article class="stat-card">
          <span>Confirmados</span>
          <strong id="confirmados">0</strong>
        </article>

        <article class="stat-card">
          <span>Cancelados</span>
          <strong id="cancelados">0</strong>
        </article>
      </section>

      <!-- Fila secundaria de estados de turno (DUDA-11) -->
      <section class="stats-grid-secondary" aria-label="Métricas de estado complementarias" style="margin-bottom: 24px;">
        <article class="stat-card-sm">
          <span>Pendientes</span>
          <strong id="pendientes">0</strong>
        </article>
        <article class="stat-card-sm">
          <span>En Consultorio</span>
          <strong id="enConsultorio">0</strong>
        </article>
        <article class="stat-card-sm">
          <span>Asistidos</span>
          <strong id="asistidos">0</strong>
        </article>
        <article class="stat-card-sm">
          <span>Ausentes</span>
          <strong id="ausentes">0</strong>
        </article>
      </section>

      <!-- Tabla de próximos turnos -->
      <section class="panel-card">
        <div class="section-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 id="dashSectionTitle">Próximos turnos a atender</h2>
          <a class="btn btn-secondary" id="newTurnBtnDashboard" href="turno.html">+ Nuevo turno</a>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th id="thDashPaciente">Paciente</th>
                <th id="thDashProfesional">Profesional</th>
                <th>Consultorio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody id="dashboardTurnos">
              <tr><td colspan="6" class="empty-row">Cargando próximos turnos...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/dashboard.js"></script>
</body>
</html>
```

## File: frontend/especialidades.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Especialidades</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Encabezado de la pantalla -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Gestión de especialidades</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">
    <!-- Sidebar generado dinámicamente por common.js -->
    <nav class="sidebar" aria-label="Navegación principal"></nav>

    <main class="content">

      <div class="page-title-row">
        <div>
          <h1>Especialidades médicas</h1>
          <p class="muted">Catálogo de ramas de atención y áreas clínicas.</p>
        </div>
        <!-- Solo visible para ADMINISTRADOR -->
        <button class="btn btn-primary" id="newSpecialtyBtn">+ Nueva especialidad</button>
      </div>

      <!-- Filtros y Listado -->
      <section class="panel-card">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 260px;">
            <label class="sr-only" for="specialtySearch">Buscar especialidad</label>
            <input id="specialtySearch" placeholder="Buscar por nombre de especialidad...">
          </div>

          <div class="pill-group" role="group" aria-label="Filtro de estado de especialidades">
            <button type="button" class="pill-btn active" data-estado="1">Activas</button>
            <button type="button" class="pill-btn" data-estado="0">Inactivas</button>
            <button type="button" class="pill-btn" data-estado="todos">Todas</button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width: 70px;">ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th style="width: 120px;">Estado</th>
                <th id="actionsHeader" style="width: 140px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="specialtiesTable">
              <tr><td colspan="5" class="empty-row">Cargando especialidades...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/especialidades.js"></script>
</body>
</html>
```

## File: frontend/index.html
```html
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">

  <!--
    viewport permite que el diseño se adapte correctamente a celulares y tablets.
    Es una de las bases del diseño responsive solicitado en la actividad.
  -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Salud Turnos - Inicio</title>

  <!-- Hoja de estilos general utilizada por todas las pantallas del sistema. -->
  <link rel="stylesheet" href="/css/styles.css">
</head>

<!--
  home-body agrega un comportamiento específico para la página pública de inicio.
  En CSS se utiliza para distribuir header, contenido y footer verticalmente.
-->

<body class="home-body">

  <!-- Encabezado público del sistema. -->
  <header class="topbar public-topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Inicio</span>
    </div>
  </header>

  <!-- Contenido principal de la página de inicio. -->
  <main class="hero">
    <section class="hero-card">
      <h1>Gestión simple y segura<br>de turnos médicos</h1>
      <p>Consulte disponibilidad y gestione su atención.</p>

      <!--
        La navegación hacia Login o Panel si ya está autenticado (FE-INI-01).
      -->
      <a class="btn btn-primary" id="homeCtaBtn" href="login.html">Iniciar sesión</a>
    </section>
  </main>

  <!-- Pie de página informativo. -->
  <footer class="footer">
    <p>Aplicaciones Web y Móvil - Trabajo Práctico 3</p>
    <p>Elpeza Andrés - 600213 | Benitez José - 600199 | Susñar Daniel - 600081</p>
  </footer>

  <script src="/js/api.js"></script>
  <script>
    (async function () {
      try {
        const res = await window.Api.auth.me();
        if (res && res.usuario) {
          const btn = document.getElementById('homeCtaBtn');
          if (btn) {
            btn.textContent = 'Ir al panel';
            btn.href = 'dashboard.html';
          }
        }
      } catch {
        // No hay sesión activa, mantiene Iniciar sesión
      }
    })();
  </script>
</body>

</html>
```

## File: frontend/pacientes.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Pacientes</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Encabezado de la pantalla -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Gestión de pacientes</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">
    <!-- Sidebar generado dinámicamente por common.js -->
    <nav class="sidebar" aria-label="Navegación principal"></nav>

    <main class="content">

      <!-- Título y acción principal de la pantalla -->
      <div class="page-title-row">
        <div>
          <h1>Gestión de pacientes</h1>
          <p class="muted">Alta, búsqueda, edición y administración de pacientes.</p>
        </div>
        <button class="btn btn-primary" id="toggleFormBtn">+ Nuevo paciente</button>
      </div>

      <!-- Formulario de alta / edición de paciente -->
      <section class="panel-card hidden" id="patientFormCard" style="margin-bottom: 24px;">
        <h2 id="patientFormTitle">Registrar paciente</h2>

        <form id="patientForm" class="grid-form" novalidate>
          <input type="hidden" id="patientId" name="patientId">

          <div class="field">
            <label for="dni">DNI * (7 u 8 dígitos)</label>
            <input id="dni" name="dni" maxlength="8" placeholder="Ej: 30111222" required>
            <small class="error" id="dniError"></small>
          </div>

          <div class="field">
            <label for="correo">Correo electrónico *</label>
            <input id="correo" name="correo" type="email" maxlength="100" placeholder="paciente@correo.com" required>
            <small class="error" id="correoError"></small>
          </div>

          <div class="field">
            <label for="nombre">Nombre *</label>
            <input id="nombre" name="nombre" maxlength="50" required>
            <small class="error" id="nombreError"></small>
          </div>

          <div class="field">
            <label for="apellido">Apellido *</label>
            <input id="apellido" name="apellido" maxlength="50" required>
            <small class="error" id="apellidoError"></small>
          </div>

          <div class="field">
            <label for="telefono">Teléfono (solo dígitos, hasta 12)</label>
            <input id="telefono" name="telefono" maxlength="12" placeholder="Ej: 3764111111">
            <small class="error" id="telefonoError"></small>
          </div>

          <div class="field">
            <label for="fecha_nacimiento">Fecha de nacimiento</label>
            <input type="date" id="fecha_nacimiento" name="fecha_nacimiento">
            <small class="error" id="fecha_nacimientoError"></small>
          </div>

          <div class="field span-2">
            <label for="obra_social">Obra Social o Cobertura</label>
            <input id="obra_social" name="obra_social" maxlength="100" placeholder="Ej: OSDE, Swiss Medical, Particular">
            <small class="error" id="obra_socialError"></small>
          </div>

          <div class="form-actions span-2">
            <button type="button" class="btn btn-light" id="cancelPatientBtn">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="savePatientBtn">Guardar paciente</button>
          </div>

          <p id="patientMessage" class="form-message span-2" aria-live="polite"></p>
        </form>
      </section>

      <!-- Sección de búsqueda y listado de pacientes -->
      <section class="panel-card">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; flex-wrap: wrap;">
          <!-- Búsqueda rápida q -->
          <div style="flex: 1; min-width: 260px;">
            <label class="sr-only" for="patientSearch">Buscar pacientes</label>
            <input id="patientSearch" placeholder="Buscar por DNI, nombre o apellido...">
          </div>

          <!-- Filtro de estado (FE-PAC-02: default Activos) -->
          <div class="pill-group" role="group" aria-label="Filtro de estado de pacientes">
            <button type="button" class="pill-btn active" data-estado="1">Activos</button>
            <button type="button" class="pill-btn" data-estado="0">Inactivos</button>
            <button type="button" class="pill-btn" data-estado="todos">Todos</button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Apellido y Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>F. Nacimiento</th>
                <th>Obra Social</th>
                <th>Estado</th>
                <th style="min-width: 140px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="patientsTable">
              <tr><td colspan="8" class="empty-row">Cargando pacientes...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/pacientes.js"></script>
</body>
</html>
```

## File: frontend/profesionales.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Profesionales</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Encabezado de la pantalla -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Gestión de profesionales</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">
    <!-- Sidebar generado dinámicamente por common.js -->
    <nav class="sidebar" aria-label="Navegación principal"></nav>

    <main class="content">

      <div class="page-title-row">
        <div>
          <h1>Profesionales médicos</h1>
          <p class="muted">Gestión de cuerpo médico, consultorios y disponibilidad semanal.</p>
        </div>
        <!-- Nota informativa: el alta de profesional se hace desde Usuarios para mantener la atomicidad -->
        <span id="createDocHelp" class="muted" style="font-size: 0.88rem;">
          Para dar de alta un nuevo médico, hágalo desde <a href="usuarios.html" style="color: var(--blue); text-decoration: underline; font-weight: 600;">Usuarios</a>.
        </span>
      </div>

      <!-- Filtros y Listado -->
      <section class="panel-card">
        <div class="filters-grid" style="margin-bottom: 18px;">
          <div class="field">
            <label for="docSearch">Buscar por nombre o apellido</label>
            <input id="docSearch" placeholder="Dr. Pérez, Laura Gómez...">
          </div>

          <div class="field">
            <label for="docSpecialtySearch">Buscar por especialidad</label>
            <input id="docSpecialtySearch" placeholder="Pediatría, Cardiología...">
          </div>

          <div class="field span-2">
            <label>Estado</label>
            <div class="pill-group" role="group" aria-label="Filtro de estado de profesionales">
              <button type="button" class="pill-btn active" data-estado="1">Activos</button>
              <button type="button" class="pill-btn" data-estado="0">Inactivos</button>
              <button type="button" class="pill-btn" data-estado="todos">Todos</button>
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Profesional</th>
                <th>Especialidad</th>
                <th>Matrícula</th>
                <th>Consultorio</th>
                <th>Usuario vinculado</th>
                <th>Estado</th>
                <th id="docActionsHeader" style="min-width: 220px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="doctorsTable">
              <tr><td colspan="7" class="empty-row">Cargando profesionales...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/profesionales.js"></script>
</body>
</html>
```

## File: frontend/turno.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Turnos Médicos</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Encabezado de la pantalla de turnos -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code" id="screenCodeTitle">Gestión de turnos médicos</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">
    <!-- Sidebar generado dinámicamente por common.js -->
    <nav class="sidebar" aria-label="Navegación principal"></nav>

    <main class="content">
      <div class="page-title-row">
        <div>
          <h1 id="pageTitle">Turnos médicos</h1>
          <p class="muted" id="pageSubtitle">Solicitud, consulta y transiciones del ciclo de atención.</p>
        </div>
        <!-- Solo visible para ADMIN y RECEPCIONISTA (DUDA-05) -->
        <button class="btn btn-primary" id="toggleNewTurnBtn">+ Nuevo turno</button>
      </div>

      <!-- Panel colapsable de solicitud de nuevo turno (ADMIN y RECEP) -->
      <section class="panel-card hidden" id="turnFormCard" style="margin-bottom: 24px;">
        <h2>Solicitud de nuevo turno</h2>
        <p class="muted" style="margin-bottom: 16px;">Seleccione paciente, médico y verifique la disponibilidad de horarios libres.</p>

        <form id="turnForm" class="grid-form" novalidate>
          <!-- Selector de Paciente con Búsqueda en tiempo real (FE-TUR-01 / DUDA-20) -->
          <div class="field span-2" id="patientFieldGroup">
            <label for="patientSearchInput">Paciente * (escriba DNI, nombre o apellido)</label>
            <div class="combobox-wrap">
              <input type="text" id="patientSearchInput" placeholder="Buscar paciente por DNI o nombre..." autocomplete="off" required>
              <input type="hidden" id="patientSelect" name="id_paciente" required>
              <div id="patientDropdown" class="autocomplete-dropdown hidden"></div>
            </div>
            <small class="error" id="id_pacienteError"></small>
          </div>

          <!-- Especialidad -->
          <div class="field">
            <label for="specialtySelect">Especialidad médica *</label>
            <select id="specialtySelect" required>
              <option value="">Seleccione especialidad...</option>
            </select>
            <small class="error" id="specialtySelectError"></small>
          </div>

          <!-- Profesional (filtrado por especialidad) -->
          <div class="field">
            <label for="doctorSelect">Profesional médico *</label>
            <select id="doctorSelect" required disabled>
              <option value="">Primero elija una especialidad</option>
            </select>
            <small class="error" id="id_profesionalError"></small>
          </div>

          <!-- Fecha del turno -->
          <div class="field">
            <label for="turnDate">Fecha de atención *</label>
            <input type="date" id="turnDate" required>
            <small class="error" id="fechaError"></small>
          </div>

          <!-- Horarios disponibles calculados por API -->
          <div class="field">
            <label for="turnTime">Horario disponible *</label>
            <select id="turnTime" required disabled>
              <option value="">Seleccione médico y fecha</option>
            </select>
            <small class="error" id="horaError"></small>
          </div>

          <!-- Motivo de consulta -->
          <div class="field span-2">
            <label for="motivo">Motivo de consulta (opcional)</label>
            <textarea id="motivo" rows="2" maxlength="255" placeholder="Control de rutina, chequeo, derivación..."></textarea>
            <small class="error" id="motivo_consultaError"></small>
          </div>

          <div class="form-actions span-2">
            <button type="button" class="btn btn-light" id="cancelTurnBtn">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="submitTurnBtn">Confirmar asignación</button>
          </div>
        </form>
      </section>

      <!-- Listado de turnos con filtros completos y paginación -->
      <section class="panel-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <h2>Listado de turnos</h2>
          <button type="button" class="btn btn-light btn-xs" id="refreshTurnsBtn" title="Refrescar lista">
            🔄 Actualizar
          </button>
        </div>

        <!-- Filtros (FE-TUR-10 / DUDA-08) -->
        <div class="filters-grid" style="margin-bottom: 16px;">
          <div class="field">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label for="filterDate">Fecha</label>
              <label style="font-weight: normal; font-size: 0.82rem; cursor: pointer;">
                <input type="checkbox" id="filterAllDates" style="width: auto; vertical-align: middle; margin-right: 4px;"> Ver todos
              </label>
            </div>
            <input type="date" id="filterDate">
          </div>

          <div class="field">
            <label for="filterStatus">Estado</label>
            <select id="filterStatus">
              <option value="todos">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="EN_CONSULTORIO">En Consultorio</option>
              <option value="ASISTIDO">Asistido</option>
              <option value="AUSENTE">Ausente</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div class="field">
            <label for="filterPatient">Buscar paciente</label>
            <input id="filterPatient" placeholder="DNI o nombre...">
          </div>

          <!-- Oculto para PROFESIONAL -->
          <div class="field" id="filterDoctorField">
            <label for="filterDoctor">Buscar profesional</label>
            <input id="filterDoctor" placeholder="Nombre del médico...">
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th id="thPatient">Paciente</th>
                <th>Profesional</th>
                <th>Especialidad</th>
                <th>Consultorio</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th id="thActions" style="min-width: 170px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="turnsTable">
              <tr><td colspan="9" class="empty-row">Cargando turnos...</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación (DUDA-08: 20 filas por página) -->
        <div class="pagination" id="turnsPagination">
          <span id="paginationInfo">Mostrando 0 - 0 de 0 turnos</span>
          <div class="pagination-controls">
            <button type="button" class="btn btn-light btn-xs" id="prevPageBtn" disabled>◀ Anterior</button>
            <button type="button" class="btn btn-light btn-xs" id="nextPageBtn" disabled>Siguiente ▶</button>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/turnos.js"></script>
</body>
</html>
```

## File: frontend/usuarios.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Usuarios</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Encabezado de la pantalla -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Administración de usuarios</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">
    <!-- Sidebar generado dinámicamente por common.js -->
    <nav class="sidebar" aria-label="Navegación principal"></nav>

    <main class="content">

      <div class="page-title-row">
        <div>
          <h1>Gestión de usuarios</h1>
          <p class="muted">Altas atómicas, reseteo de claves y control de acceso.</p>
        </div>
        <button class="btn btn-primary" id="newUserBtn">+ Nuevo usuario</button>
      </div>

      <!-- Filtros y Listado -->
      <section class="panel-card">
        <div class="filters-grid" style="margin-bottom: 18px;">
          <div class="field">
            <label for="userSearch">Buscar por nombre o apellido</label>
            <input id="userSearch" placeholder="Nombre o apellido...">
          </div>

          <div class="field">
            <label for="userEmailSearch">Buscar por correo electrónico</label>
            <input id="userEmailSearch" placeholder="usuario@saludturnos.com">
          </div>

          <div class="field">
            <label for="userRoleFilter">Rol</label>
            <select id="userRoleFilter">
              <option value="">Todos los roles</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="RECEPCIONISTA">Recepcionista</option>
              <option value="PROFESIONAL">Profesional</option>
              <option value="PACIENTE">Paciente</option>
            </select>
          </div>

          <div class="field">
            <label>Estado</label>
            <div class="pill-group" role="group" aria-label="Filtro de estado">
              <button type="button" class="pill-btn active" data-estado="1">Activos</button>
              <button type="button" class="pill-btn" data-estado="0">Inactivos</button>
              <button type="button" class="pill-btn" data-estado="todos">Todos</button>
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">ID</th>
                <th>Nombre y Apellido</th>
                <th>Correo electrónico</th>
                <th style="width: 130px;">Rol</th>
                <th style="width: 100px;">Estado</th>
                <th>Alta</th>
                <th style="min-width: 190px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="usersTable">
              <tr><td colspan="7" class="empty-row">Cargando usuarios...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/usuarios.js"></script>
</body>
</html>
```

## File: package.json
```json
{
  "name": "Practico3",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node backend/server.js",
    "dev": "node --watch backend/server.js",
    "db:reset": "node backend/scripts/db-reset.js",
    "db:export": "node backend/scripts/db-export.js",
    "test": "node --test --test-concurrency=1 backend/test/**/*.test.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "12.15.0",
      "onFail": "download"
    }
  },
  "packageManager": "pnpm@12.15.0",
  "type": "module",
  "dependencies": {
    "better-sqlite3": "^13.0.3",
    "express": "^5.3.0",
    "zod": "^4.6.7"
  }
}
```

## File: backend/src/config/index.js
```javascript
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

export const config = {
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || path.resolve(rootDir, 'backend/data/salud_turnos.db'),
  cookieName: 'st_sid',
  timeZone: 'America/Argentina/Buenos_Aires',
  rootDir, // raiz del proyecto
  frontendDir: path.resolve(rootDir, 'frontend'), // raíz del frontend
  cssDir: path.resolve(rootDir, 'frontend/css'),  // Estilos del frontend
  jsDir: path.resolve(rootDir, 'frontend/js'),    // js del frontend
  scrypt: {
    n: 16384,
    r: 8,
    p: 1,
    keyLen: 64
  }
};
```

## File: backend/test/agenda.test.js
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../scripts/db-reset.js';
import { closeDb } from '../src/db/connection.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.resolve(__dirname, '../data/test_agenda.db');

test('Agenda Médica y Dashboard (Fase 8)', async (t) => {
  resetDatabase(testDbPath);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
    closeDb();
  });

  let adminCookie = '';
  let doc1Cookie = '';

  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@saludturnos.com', clave: 'SaludTurnos#2026' })
    });
    adminCookie = res.headers.get('set-cookie').split(';')[0];
  }

  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'laura.gomez@saludturnos.com', clave: 'LauraGomez#2026' })
    });
    doc1Cookie = res.headers.get('set-cookie').split(';')[0];
  }

  // 1. Consulta de Agenda diaria (?fecha=YYYY-MM-DD)
  {
    const res = await fetch(`${baseUrl}/api/agenda?id_profesional=1&fecha=2026-11-02`, {
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].profesional, 'Laura Gómez');
    assert.ok(body.data[0].dias.length > 0);
  }

  // 2. Consulta de Agenda mensual (?mes=YYYY-MM)
  {
    const res = await fetch(`${baseUrl}/api/agenda?id_profesional=1&mes=2026-11`, {
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 1);
    // Noviembre 2026 tiene varios días de Lunes a Viernes
    assert.ok(body.data[0].dias.length > 10);
  }

  // 3. Profesional consulta agenda -> Forzado a ver solo la suya
  {
    // Intenta pedir profesional 2 pero es la Dra. Laura Gómez (profesional 1)
    const res = await fetch(`${baseUrl}/api/agenda?id_profesional=2&fecha=2026-11-02`, {
      headers: { Cookie: doc1Cookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].id_profesional, 1); // Siempre responde con la suya
  }

  // 4. Consulta de Dashboard
  {
    const res = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.indicadores);
    assert.ok(body.data.ventana);
    assert.ok(Array.isArray(body.data.proximos));
  }
});
```

## File: backend/test/especialidades.test.js
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../scripts/db-reset.js';
import { closeDb } from '../src/db/connection.js';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.resolve(__dirname, '../data/test_especialidades.db');

test('CRUD de Especialidades y control de acceso por rol', async (t) => {
  resetDatabase(testDbPath);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
    closeDb();
  });

  // Obtener cookies de sesión de Administrador y Recepcionista
  let adminCookie = '';
  let recepcionCookie = '';

  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@saludturnos.com', clave: 'SaludTurnos#2026' })
    });
    adminCookie = res.headers.get('set-cookie').split(';')[0];
  }

  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'recepcion@saludturnos.com', clave: 'Recepcion#2026' })
    });
    recepcionCookie = res.headers.get('set-cookie').split(';')[0];
  }

  // 1. Recepcionista puede listar especialidades -> 200
  {
    const res = await fetch(`${baseUrl}/api/especialidades`, {
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 3);
  }

  // 2. Recepcionista intenta crear una especialidad -> 403 Forbidden
  {
    const res = await fetch(`${baseUrl}/api/especialidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({ nombre: 'Traumatología' })
    });
    assert.equal(res.status, 403);
  }

  // 3. Administrador crea una nueva especialidad -> 201 Created
  let newEspecialidadId = 0;
  {
    const res = await fetch(`${baseUrl}/api/especialidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ nombre: 'Dermatología', descripcion: 'Cuidado de la piel' })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.nombre, 'Dermatología');
    newEspecialidadId = body.data.id_especialidad;
  }

  // 4. Intento de crear con nombre duplicado (insensible a tildes/mayúsculas) -> 409 Conflict
  {
    const res = await fetch(`${baseUrl}/api/especialidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ nombre: 'dermatologia' })
    });
    assert.equal(res.status, 409);
  }

  // 5. Administrador modifica la especialidad -> 200
  {
    const res = await fetch(`${baseUrl}/api/especialidades/${newEspecialidadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ nombre: 'Dermatología Avanzada', descripcion: 'Tratamientos clínicos y estéticos' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.nombre, 'Dermatología Avanzada');
  }

  // 6. Intento de desactivar especialidad con médicos activos (id 1: Clínica médica) -> 409 Conflict
  {
    const res = await fetch(`${baseUrl}/api/especialidades/1`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /posee 1 profesional\(es\) activo\(s\)/);
  }

  // 7. Desactivar especialidad sin profesionales activos (la nueva) -> 200
  {
    const res = await fetch(`${baseUrl}/api/especialidades/${newEspecialidadId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.estado, 0);
  }

  // 8. Reactivar especialidad -> 200
  {
    const res = await fetch(`${baseUrl}/api/especialidades/${newEspecialidadId}/activar`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.estado, 1);
  }
});
```

## File: backend/test/pacientes.test.js
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../scripts/db-reset.js';
import { closeDb } from '../src/db/connection.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.resolve(__dirname, '../data/test_pacientes.db');

test('Gestión de Pacientes (Fase 6)', async (t) => {
  resetDatabase(testDbPath);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
    closeDb();
  });

  let adminCookie = '';
  let recepcionCookie = '';

  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@saludturnos.com', clave: 'SaludTurnos#2026' })
    });
    adminCookie = res.headers.get('set-cookie').split(';')[0];
  }

  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'recepcion@saludturnos.com', clave: 'Recepcion#2026' })
    });
    recepcionCookie = res.headers.get('set-cookie').split(';')[0];
  }

  // 1. Recepcionista lista pacientes iniciales -> 200 con 2 pacientes
  {
    const res = await fetch(`${baseUrl}/api/pacientes`, {
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 2);
  }

  // 2. Búsqueda rápida 'q' insensible a tildes/mayúsculas
  {
    const res = await fetch(`${baseUrl}/api/pacientes?q=lopez`, {
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].nombre, 'Ana');
  }

  // 3. Recepcionista registra nuevo paciente válido con -> 201 Created
  let nuevoPacienteId = 0;
  {
    const res = await fetch(`${baseUrl}/api/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({
        dni: '35123456',
        nombre: 'Martina',
        apellido: 'Sánchez',
        telefono: '1134567890',
        correo: 'martina@email.com',
        fecha_nacimiento: '1990-05-15',
        obra_social: 'Medifé'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.dni, '35123456');
    nuevoPacienteId = body.data.id_paciente;
  }

  // 4. Intento de alta con DNI duplicado -> 409 con mensaje
  {
    const res = await fetch(`${baseUrl}/api/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({
        dni: '35123456',
        nombre: 'Otra',
        apellido: 'Persona',
        correo: 'otra@email.com'
      })
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error, 'El DNI ingresado ya se encuentra registrado en el sistema.');
  }

  // 5. Recepcionista intenta desactivar paciente -> 403 (solo Administrador)
  {
    const res = await fetch(`${baseUrl}/api/pacientes/${nuevoPacienteId}`, {
      method: 'DELETE',
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 403);
  }

  // 6. Administrador desactiva al paciente sin turnos -> 200
  {
    const res = await fetch(`${baseUrl}/api/pacientes/${nuevoPacienteId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.estado, 0);
  }
});
```

## File: backend/test/turnos.test.js
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../scripts/db-reset.js';
import { closeDb } from '../src/db/connection.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.resolve(__dirname, '../data/test_turnos.db');

test('Gestión de Turnos, Concurrencia y Estados (Fase 7)', async (t) => {
  resetDatabase(testDbPath);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
    closeDb();
  });

  let adminCookie = '';
  let recepcionCookie = '';
  let docCookie = '';

  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@saludturnos.com', clave: 'SaludTurnos#2026' })
    });
    adminCookie = res.headers.get('set-cookie').split(';')[0];
  }

  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'recepcion@saludturnos.com', clave: 'Recepcion#2026' })
    });
    recepcionCookie = res.headers.get('set-cookie').split(';')[0];
  }

  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'laura.gomez@saludturnos.com', clave: 'LauraGomez#2026' })
    });
    docCookie = res.headers.get('set-cookie').split(';')[0];
  }

  // 1. Profesional intenta crear turno -> 403
  {
    const res = await fetch(`${baseUrl}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: docCookie },
      body: JSON.stringify({
        id_paciente: 1,
        id_profesional: 1,
        fecha: '2026-11-16', // Lunes futuro
        hora: '09:00'
      })
    });
    assert.equal(res.status, 403);
  }

  // 2. Recepcionista consulta horarios libres para fecha futura (Lunes 2026-11-16)
  {
    const res = await fetch(`${baseUrl}/api/turnos/disponibles?fecha=2026-11-16&id_profesional=1`, {
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.length > 0);
    assert.ok(body.data[0].horarios.includes('09:00'));
  }

  // 3. Recepcionista crea turno exitosamente -> 201 Created y estado PENDIENTE
  let nuevoTurnoId = 0;
  {
    const res = await fetch(`${baseUrl}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({
        id_paciente: 1,
        id_profesional: 1,
        fecha: '2026-11-16',
        hora: '09:00',
        motivo_consulta: 'Revisión anual'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.estado, 'PENDIENTE');
    nuevoTurnoId = body.data.id_turno;
  }

  // 4. Intento de doble reserva en el mismo slot -> 409
  {
    const res = await fetch(`${baseUrl}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({
        id_paciente: 2,
        id_profesional: 1,
        fecha: '2026-11-16',
        hora: '09:00'
      })
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error, 'El horario dejó de estar disponible. Seleccione otro.');
  }

  // 5. Transición inválida: de PENDIENTE a ASISTIDO directo -> 409
  {
    const res = await fetch(`${baseUrl}/api/turnos/${nuevoTurnoId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({ estado: 'ASISTIDO' })
    });
    assert.equal(res.status, 409);
  }

  // 6. Transición válida: PENDIENTE -> CONFIRMADO -> 200
  {
    const res = await fetch(`${baseUrl}/api/turnos/${nuevoTurnoId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({ estado: 'CONFIRMADO' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.estado, 'CONFIRMADO');
  }

  // 7. Profesional intenta cancelar turno -> 403
  {
    const res = await fetch(`${baseUrl}/api/turnos/${nuevoTurnoId}`, {
      method: 'DELETE',
      headers: { Cookie: docCookie }
    });
    assert.equal(res.status, 403);
  }

  // 8. Recepcionista cancela turno -> 200 y libera horario
  {
    const res = await fetch(`${baseUrl}/api/turnos/${nuevoTurnoId}`, {
      method: 'DELETE',
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.estado, 'CANCELADO');

    // Comprobar que el horario 09:00 vuelve a figurar libre
    const resLibres = await fetch(`${baseUrl}/api/turnos/disponibles?fecha=2026-11-16&id_profesional=1`, {
      headers: { Cookie: recepcionCookie }
    });
    const libresBody = await resLibres.json();
    assert.ok(libresBody.data[0].horarios.includes('09:00'));
  }
});
```

## File: backend/test/users.test.js
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../scripts/db-reset.js';
import { closeDb } from '../src/db/connection.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.resolve(__dirname, '../data/test_users.db');

test('Gestión de Usuarios, Profesionales y Disponibilidad (Fase 5)', async (t) => {
  resetDatabase(testDbPath);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
    closeDb();
  });

  let adminCookie = '';
  let recepcionCookie = '';

  // Iniciar sesión como Admin
  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'admin@saludturnos.com', clave: 'SaludTurnos#2026' })
    });
    adminCookie = res.headers.get('set-cookie').split(';')[0];
  }

  // Iniciar sesión como Recepcionista
  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'recepcion@saludturnos.com', clave: 'Recepcion#2026' })
    });
    recepcionCookie = res.headers.get('set-cookie').split(';')[0];
  }

  // 1. Recepcionista intenta listar usuarios -> 403
  {
    const res = await fetch(`${baseUrl}/api/usuarios`, {
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 403);
  }

  // 2. Administrador crea un nuevo usuario Recepcionista -> 201 y clave_generada
  let nuevoUsuarioId = 0;
  {
    const res = await fetch(`${baseUrl}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        nombre: 'Carlos',
        apellido: 'González',
        correo: 'carlos.gonzalez@saludturnos.com',
        rol: 'RECEPCIONISTA'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.clave_generada);
    assert.equal(body.data.rol, 'RECEPCIONISTA');
    nuevoUsuarioId = body.data.id_usuario;
  }

  // 3. Administrador crea un PROFESIONAL de forma atómica con su agenda
  let nuevoProfesionalUserId = 0;
  let nuevoProfesionalId = 0;
  {
    const res = await fetch(`${baseUrl}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        nombre: 'Federico',
        apellido: 'Romero',
        correo: 'federico.romero@saludturnos.com',
        rol: 'PROFESIONAL',
        profesional: {
          id_especialidad: 1, // Clínica médica
          matricula: '20001',
          consultorio: 'Consultorio 201'
        },
        disponibilidad: [
          { dia_semana: 'LUNES', hora_inicio: '08:00', hora_fin: '12:00' },
          { dia_semana: 'LUNES', hora_inicio: '16:00', hora_fin: '20:00' } // Multi-franja
        ]
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.clave_generada);
    assert.equal(body.data.rol, 'PROFESIONAL');
    assert.ok(body.data.id_profesional);
    nuevoProfesionalUserId = body.data.id_usuario;
    nuevoProfesionalId = body.data.id_profesional;
  }

  // 4. Intentar crear profesional con consultorio ocupado ('consultorio201') -> 409
  {
    const res = await fetch(`${baseUrl}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        nombre: 'Otro',
        apellido: 'Médico',
        correo: 'otro.medico@saludturnos.com',
        rol: 'PROFESIONAL',
        profesional: {
          id_especialidad: 1,
          matricula: '20002',
          consultorio: 'consultorio 201' // Mismo consultorio ignorando espacios y mayúsculas
        },
        disponibilidad: [
          { dia_semana: 'MARTES', hora_inicio: '09:00', hora_fin: '12:00' }
        ]
      })
    });
    assert.equal(res.status, 409);
  }

  // 5. Consultar disponibilidad del profesional creado -> 200 con 2 franjas
  {
    const res = await fetch(`${baseUrl}/api/profesionales/${nuevoProfesionalId}/disponibilidad`, {
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 2);
  }

  // 6. Intentar desactivar usuario vinculado a profesional activo -> 409
  {
    const res = await fetch(`${baseUrl}/api/usuarios/${nuevoProfesionalUserId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /Desactive primero el profesional asociado/);
  }

  // 7. Desactivar profesional: primero requiere liberar consultorio y vaciar disponibilidad
  // Intento de desactivar sin liberar consultorio -> 409
  {
    const res = await fetch(`${baseUrl}/api/profesionales/${nuevoProfesionalId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /consultorio debe ser liberado/);
  }

  // Liberar consultorio y vaciar disponibilidad
  {
    await fetch(`${baseUrl}/api/profesionales/${nuevoProfesionalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        id_especialidad: 1,
        matricula: '20001',
        consultorio: null
      })
    });

    await fetch(`${baseUrl}/api/profesionales/${nuevoProfesionalId}/disponibilidad`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ franjas: [] })
    });
  }

  // Ahora la desactivación del profesional es exitosa y desactiva al usuario vinculado
  {
    const res = await fetch(`${baseUrl}/api/profesionales/${nuevoProfesionalId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    assert.equal(res.status, 200);

    const userCheck = await fetch(`${baseUrl}/api/usuarios/${nuevoProfesionalUserId}`, {
      headers: { Cookie: adminCookie }
    });
    const userBody = await userCheck.json();
    assert.equal(userBody.data.estado, 0);
  }
});
```

## File: frontend/js/login.js
```javascript
/* =============================================================
   js/login.js
   -------------------------------------------------------------
   Lógica de inicio de sesión real contra la API:
   - Redirección automática si ya existe sesión (FE-LOG-02).
   - Manejo de aviso de sesión expirada.
   - Envío de POST /api/auth/login { correo, clave }.
   - Mapeo de errores 400 (campos), 401 (genérico) y 403 (inactivo).
   - Autocompletado de usuarios demo de la semilla.
   ============================================================= */

(function () {
  'use strict';

  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('loginSubmitBtn');

  /* Iconos del toggle de contraseña */
  const PASSWORD_ICON = {
    hidden: '/images/eye-key-look-password-security-see-svgrepo-com.svg', // contraseña OCULTA
    visible: '/images/eye-password-see-view-svgrepo-com.svg'              // contraseña VISIBLE
  };

  /**
   * Limpia los errores previos del formulario.
   */
  function clearErrors() {
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    emailInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');

    loginMessage.textContent = '';
    loginMessage.className = 'form-message';
  }

  /**
   * Verifica si ya hay una sesión activa al cargar la página (FE-LOG-02).
   */
  async function checkExistingSession() {
    try {
      if (window.Api && window.Api.auth) {
        const res = await window.Api.auth.me();
        if (res && res.usuario) {
          window.location.href = 'dashboard.html';
          return;
        }
      }
    } catch {
      // Sin sesión, permanece en la pantalla
    }

    // Comprobar si fue redirigido con aviso de sesión cerrada/expirada
    const motivoLogout = sessionStorage.getItem('saludturnos_motivo_logout');
    if (motivoLogout) {
      sessionStorage.removeItem('saludturnos_motivo_logout');
      loginMessage.textContent = motivoLogout;
      loginMessage.className = 'form-message bad';
    }
  }

  /**
   * Manejador del envío del formulario de Login.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    clearErrors();

    const correo = emailInput.value.trim();
    const clave = passwordInput.value;

    let hasClientError = false;

    if (!correo) {
      document.getElementById('emailError').textContent = 'Debe ingresar el correo electrónico.';
      emailInput.classList.add('input-error');
      hasClientError = true;
    }

    if (!clave) {
      document.getElementById('passwordError').textContent = 'Debe ingresar la contraseña.';
      passwordInput.classList.add('input-error');
      hasClientError = true;
    }

    if (hasClientError) return;

    window.AppUI.setLoading(submitBtn, true, 'Ingresando...');

    try {
      await window.Api.auth.login({ correo, clave });

      // Éxito: redirección al Dashboard
      window.location.href = 'dashboard.html';
    } catch (err) {
      if (err.status === 400) {
        // Errores de validación de esquema
        window.AppUI.renderFieldErrors(loginForm, err.campos);
        if (err.message && Object.keys(err.campos).length === 0) {
          loginMessage.textContent = err.message;
          loginMessage.className = 'form-message bad';
        }
      } else if (err.status === 401) {
        // Credenciales incorrectas
        loginMessage.textContent = 'Usuario o contraseña incorrectos.';
        loginMessage.className = 'form-message bad';
        passwordInput.value = '';
        resetPasswordToggle();
        passwordInput.focus();
      } else if (err.status === 403) {
        // Cuenta inactiva
        loginMessage.textContent = err.message || 'La cuenta se encuentra inactiva.';
        loginMessage.className = 'form-message bad';
      } else {
        // Error de red o del servidor
        loginMessage.textContent = err.message || 'No se pudo conectar con el servidor.';
        loginMessage.className = 'form-message bad';
      }
    } finally {
      window.AppUI.setLoading(submitBtn, false);
    }
  }

  /**
   * Inicializa el toggle de visibilidad de la contraseña.
   * Cambia type password <-> text y actualiza el estado accesible del botón.
   */
  function initPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    if (!toggleBtn || !passwordInput) return;

    // Preload del segundo ícono para evitar parpadeo al cambiar
    const preload = new Image();
    preload.src = PASSWORD_ICON.visible;

    toggleBtn.addEventListener('click', () => {
      const willBeVisible = passwordInput.type === 'password';

      // 1. Cambiar el tipo del input
      passwordInput.type = willBeVisible ? 'text' : 'password';

      // 2. Estado visual del botón
      toggleBtn.classList.toggle('is-visible', willBeVisible);

      // 3. Accesibilidad (label + title)
      const label = willBeVisible ? 'Ocultar contraseña' : 'Mostrar contraseña';
      toggleBtn.setAttribute('aria-label', label);
      toggleBtn.setAttribute('title', label);

      // 4. Cambiar el ícono
      applyPasswordIcon(willBeVisible);

      // 5. Mantener foco y cursor al final
      passwordInput.focus();
      if (willBeVisible) {
        const len = passwordInput.value.length;
        try { passwordInput.setSelectionRange(len, len); } catch (_) { /* noop */ }
      }
    });
  }

  /**
   * Fuerza que la contraseña vuelva a estar oculta.
   * Se usa tras un 401 para no dejar el valor visible si el usuario reintenta.
   */
  function resetPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    if (!toggleBtn) return;
    passwordInput.type = 'password';
    toggleBtn.classList.remove('is-visible');
    toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
    toggleBtn.setAttribute('title', 'Mostrar contraseña');
  }

  /**
 * Aplica el ícono correcto al botón de toggle según la visibilidad.
 * @param {boolean} visible  true = contraseña visible
 */
  function applyPasswordIcon(visible) {
    const toggleBtn = document.getElementById('togglePassword');
    if (!toggleBtn) return;
    const img = toggleBtn.querySelector('img');
    if (!img) return;

    setTimeout(() => {
      img.src = visible ? PASSWORD_ICON.visible : PASSWORD_ICON.hidden;
    }, 100);
  }

  /**
   * Configura los botones de autofill para los 5 usuarios demo (A7).
   */
  function initDemoButtons() {
    document.querySelectorAll('.demo-user-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const email = btn.dataset.email;
        const pass = btn.dataset.pass;
        if (email && pass) {
          emailInput.value = email;
          passwordInput.value = pass;
          clearErrors();
          submitBtn.focus();
        }
      });
    });
  }

  // Inicialización
  if (loginForm) {
    loginForm.addEventListener('submit', handleSubmit);
  }
  initDemoButtons();
  initPasswordToggle();
  checkExistingSession();
})();
```

## File: frontend/login.html
```html
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Iniciar sesión</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>

<body>

  <!-- Encabezado de la pantalla de autenticación. -->
  <header class="topbar public-topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Inicio de sesión</span>
    </div>
  </header>

  <!--
    center-page centra el formulario horizontal y verticalmente.
    La etiqueta <main> representa el contenido principal de la pantalla.
  -->
  <main class="center-page">
    <section class="form-card login-card">
      <h1>Inicio de sesión</h1>
      <p class="muted">Ingrese sus credenciales para acceder al sistema.</p>

      <!--
        novalidate desactiva los mensajes automáticos del navegador.
        De esta manera las validaciones y mensajes son controlados con JavaScript.
      -->
      <form id="loginForm" novalidate>

        <!-- Campo de correo electrónico. -->
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input type="email" id="email" name="email" placeholder="usuario@correo.com" autocomplete="username" required>
          <small class="error" id="emailError"></small>
        </div>

        <!-- Campo de contraseña. -->
        <div class="field">
          <label for="password">Contraseña</label>
          <input type="password" id="password" name="password" placeholder="Contraseña" autocomplete="current-password"
            required>
          <button type="button" class="show-hide-password" id="togglePassword" aria-label="Mostrar contraseña"
            aria-controls="password" title="Mostrar contraseña">
            <img src="/images/eye-key-look-password-security-see-svgrepo-com.svg" alt="" aria-hidden="true" width="24"
              height="24" />

          </button>
          <small class="error" id="passwordError"></small>
        </div>

        <!-- Botón de ingreso -->
        <button class="btn btn-primary full" id="loginSubmitBtn" type="submit">Ingresar</button>

        <!-- aria-live permite que lectores de pantalla anuncien cambios del mensaje. -->
        <p id="loginMessage" class="form-message" aria-live="polite"></p>
      </form>

      <!-- Credenciales reales de demostración de la semilla (A7) -->
      <div class="demo-box" style="margin-top: 20px;">
        <strong>Usuarios de prueba (clic para cargar)</strong>
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
          <button type="button" class="btn btn-light btn-xs demo-user-btn" data-email="admin@saludturnos.com"
            data-pass="SaludTurnos#2026" style="justify-content: flex-start; text-align: left;">
            👑 <strong>Admin</strong>
          </button>
          <button type="button" class="btn btn-light btn-xs demo-user-btn" data-email="recepcion@saludturnos.com"
            data-pass="Recepcion#2026" style="justify-content: flex-start; text-align: left;">
            📋 <strong>Recepción</strong>
          </button>
          <button type="button" class="btn btn-light btn-xs demo-user-btn" data-email="laura.gomez@saludturnos.com"
            data-pass="LauraGomez#2026" style="justify-content: flex-start; text-align: left;">
            🩺 <strong>Dra. Gómez (Clínica)</strong>
          </button>
          <button type="button" class="btn btn-light btn-xs demo-user-btn" data-email="martin.perez@saludturnos.com"
            data-pass="MartinPerez#2026" style="justify-content: flex-start; text-align: left;">
            🩺 <strong>Dr. Pérez (Pediatría)</strong>
          </button>
          <button type="button" class="btn btn-light btn-xs demo-user-btn" data-email="carla.nunez@saludturnos.com"
            data-pass="CarlaNunez#2026" style="justify-content: flex-start; text-align: left;">
            🩺 <strong>Dra. Núñez (Cardio)</strong>
          </button>
          <button type="button" class="btn btn-light btn-xs demo-user-btn" data-email="ana@email.com"
            data-pass="AnaLopez#2026" style="justify-content: flex-start; text-align: left;">
            😷 <strong>Ana Lopez (Paciente):</strong>
          </button>
        </div>
      </div>
    </section>
  </main>

  <!-- Pie de página informativo. -->
  <footer class="footer">
    <p>Aplicaciones Web y Móvil - Trabajo Práctico 3</p>
    <p>Elpeza Andrés - 600213 | Benitez José - 600199 | Susñar Daniel - 600081</p>
  </footer>

  <script src="/js/api.js"></script>
  <script src="/js/ui.js"></script>
  <script src="/js/login.js"></script>
</body>

</html>
```