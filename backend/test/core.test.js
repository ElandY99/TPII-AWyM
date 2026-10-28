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
