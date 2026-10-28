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

  // 1. Consulta de Agenda diaria (Q9: ?fecha=YYYY-MM-DD)
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

  // 2. Consulta de Agenda mensual (Q9 / D-38: ?mes=YYYY-MM)
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

  // 3. Profesional consulta agenda -> Forzado a ver solo la suya (D-02, CA-17.2)
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

  // 4. Consulta de Dashboard (D-39, Q8)
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
