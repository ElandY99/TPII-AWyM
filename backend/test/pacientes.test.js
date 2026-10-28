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

  // 2. Búsqueda rápida 'q' insensible a tildes/mayúsculas (D-37, Q12)
  {
    const res = await fetch(`${baseUrl}/api/pacientes?q=lopez`, {
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].nombre, 'Ana');
  }

  // 3. Recepcionista registra nuevo paciente válido con D-17, D-18, D-19 -> 201 Created
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

  // 4. Intento de alta con DNI duplicado -> 409 con mensaje CU-02 5b
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

  // 5. Recepcionista intenta desactivar paciente -> 403 (D-16: solo Administrador)
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
