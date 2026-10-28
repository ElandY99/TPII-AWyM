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

  // 1. Recepcionista intenta listar usuarios -> 403 (RFB-13)
  {
    const res = await fetch(`${baseUrl}/api/usuarios`, {
      headers: { Cookie: recepcionCookie }
    });
    assert.equal(res.status, 403);
  }

  // 2. Administrador crea un nuevo usuario Recepcionista -> 201 y clave_generada (D-10)
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

  // 3. Administrador crea un PROFESIONAL de forma atómica con su agenda (Q4)
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
          { dia_semana: 'LUNES', hora_inicio: '16:00', hora_fin: '20:00' } // Multi-franja Q5
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

  // 4. Intentar crear profesional con consultorio ocupado ('consultorio201') -> 409 (D-18)
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

  // 7. Desactivar profesional: primero requiere liberar consultorio y vaciar disponibilidad (Q10)
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

  // Ahora la desactivación del profesional es exitosa y desactiva al usuario vinculado (Q10)
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
