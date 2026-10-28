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

  // 1. Profesional intenta crear turno -> 403 (RFB-52, CA-12.8)
  {
    const res = await fetch(`${baseUrl}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: docCookie },
      body: JSON.stringify({
        id_paciente: 1,
        id_profesional: 1,
        fecha: '2026-11-02', // Lunes futuro
        hora: '09:00'
      })
    });
    assert.equal(res.status, 403);
  }

  // 2. Recepcionista consulta horarios libres para fecha futura (Lunes 2026-11-02)
  {
    const res = await fetch(`${baseUrl}/api/turnos/disponibles?fecha=2026-11-02&id_profesional=1`, {
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.length > 0);
    assert.ok(body.data[0].horarios.includes('09:00'));
  }

  // 3. Recepcionista crea turno exitosamente -> 201 Created y estado PENDIENTE (D-28)
  let nuevoTurnoId = 0;
  {
    const res = await fetch(`${baseUrl}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({
        id_paciente: 1,
        id_profesional: 1,
        fecha: '2026-11-02',
        hora: '09:00',
        motivo_consulta: 'Revisión anual'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.estado, 'PENDIENTE');
    nuevoTurnoId = body.data.id_turno;
  }

  // 4. Intento de doble reserva en el mismo slot -> 409 (RNF-04, CA-12.2)
  {
    const res = await fetch(`${baseUrl}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({
        id_paciente: 2,
        id_profesional: 1,
        fecha: '2026-11-02',
        hora: '09:00'
      })
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error, 'El horario dejó de estar disponible. Seleccione otro.');
  }

  // 5. Transición inválida: de PENDIENTE a ASISTIDO directo -> 409 (Q1)
  {
    const res = await fetch(`${baseUrl}/api/turnos/${nuevoTurnoId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: recepcionCookie },
      body: JSON.stringify({ estado: 'ASISTIDO' })
    });
    assert.equal(res.status, 409);
  }

  // 6. Transición válida: PENDIENTE -> CONFIRMADO -> 200 (Q1)
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

  // 7. Profesional intenta cancelar turno -> 403 (D-04)
  {
    const res = await fetch(`${baseUrl}/api/turnos/${nuevoTurnoId}`, {
      method: 'DELETE',
      headers: { Cookie: docCookie }
    });
    assert.equal(res.status, 403);
  }

  // 8. Recepcionista cancela turno -> 200 y libera horario (D-29, CA-14.1)
  {
    const res = await fetch(`${baseUrl}/api/turnos/${nuevoTurnoId}`, {
      method: 'DELETE',
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.estado, 'CANCELADO');

    // Comprobar que el horario 09:00 vuelve a figurar libre
    const resLibres = await fetch(`${baseUrl}/api/turnos/disponibles?fecha=2026-11-02&id_profesional=1`, {
      headers: { Cookie: recepcionCookie }
    });
    const libresBody = await resLibres.json();
    assert.ok(libresBody.data[0].horarios.includes('09:00'));
  }
});
