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

  // 1. Recepcionista puede listar especialidades (D-07) -> 200
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

  // 6. Intento de desactivar especialidad con médicos activos (id 1: Clínica médica) -> 409 Conflict (D-15)
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
