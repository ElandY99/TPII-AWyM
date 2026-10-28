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
