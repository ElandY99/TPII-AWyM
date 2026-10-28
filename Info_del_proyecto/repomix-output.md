This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
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
    pacientes.test.js
    turnos.test.js
    users.test.js
  server.js
css/
  styles.css
data/
  datos.json
js/
  agenda.js
  common.js
  dashboard.js
  data.js
  login.js
  pacientes.js
  turnos.js
public/
  agenda.html
  dashboard.html
  index.html
  login.html
  pacientes.html
  turno.html
.gitignore
package.json
```

# Files

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
  rootDir,
  publicDir: path.resolve(rootDir, 'public'),
  cssDir: path.resolve(rootDir, 'css'),
  jsDir: path.resolve(rootDir, 'js'),
  dataDir: path.resolve(rootDir, 'data'),
  scrypt: {
    n: 16384,
    r: 8,
    p: 1,
    keyLen: 64
  }
};
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
      const data = especialidadService.list(filters);
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

  create(req, res, next) {
    try {
      const data = pacienteService.create(req.valid.body, req.user.id);
      res.status(201).json({
        mensaje: 'Paciente registrado exitosamente',
        data
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
-- Generado automáticamente: 2026-10-27T17:54:15.869Z
-- =====================================================================

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS usuario;
CREATE TABLE usuario (
  id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  correo TEXT NOT NULL COLLATE NOCASE,
  clave_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL')),
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
  dni TEXT NOT NULL CHECK(length(dni) BETWEEN 7 AND 8 AND dni GLOB '[0-9]*'),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT CHECK(telefono IS NULL OR (length(telefono) <= 12 AND telefono GLOB '[0-9]*')),
  correo TEXT NOT NULL COLLATE NOCASE,
  fecha_nacimiento TEXT CHECK(fecha_nacimiento IS NULL OR (fecha_nacimiento GLOB '[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]' AND fecha_nacimiento >= '1900-01-01')),
  obra_social TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT uq_paciente_dni UNIQUE (dni)
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
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (1, 'Administrador', 'General', 'admin@saludturnos.com', 'scrypt$16384$8$1$57ee8c0debed376a2304352910071d36$0754af89fa3c9651138dc193feaa07e76b42f4c521b1a5b1b62e5e5271514bd471994b7ea0ec07aa95db14aa6b341cd4dc67df9530cbff671ff23498d718b7bd', 'ADMINISTRADOR', 1, '2026-10-27 14:54:15');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (2, 'María', 'Recepcionista', 'recepcion@saludturnos.com', 'scrypt$16384$8$1$e54cea18e350330cf62f879e8f1385d2$3cd3d578066f99d7100a7ec9da1e030796d4b2d45a7b4e2a65c5ae3293ea3bf6add7ffd3c6e8bfdf3d51dff43db6073db01777676e80c79f8528ebe408dda361', 'RECEPCIONISTA', 1, '2026-10-27 14:54:15');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (3, 'Laura', 'Gómez', 'laura.gomez@saludturnos.com', 'scrypt$16384$8$1$8839b34222dbae7f5cc5e21ec4201b0e$73099685ae2390fbcc913a680ddff39142332a12318f7f8eff6fbb799859f086e129f2903bc8dfbd7dc8019b2ab9568177a3cf61d910e2b6583522aefe4cfe51', 'PROFESIONAL', 1, '2026-10-27 14:54:15');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (4, 'Martín', 'Pérez', 'martin.perez@saludturnos.com', 'scrypt$16384$8$1$4297f15e54f0f32c6db56c73fe32dca1$616186c6032b9da9f1c643e7186da808dd1b057110b87d7f7a6b89048b28c2c48c8eaf23f71745653ce9693ef88331ee6b024b4655e7bd1a24561fa701d5c28b', 'PROFESIONAL', 1, '2026-10-27 14:54:15');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (5, 'Carla', 'Núñez', 'carla.nunez@saludturnos.com', 'scrypt$16384$8$1$1abd1dd59b7c39901b8b866782bef84d$e932eb0c6c6eb736e345349dcf928eb2ecc63a70d18b5791119032f17f2276a47ceed40d6302f84715e9cf054b464d1b50f015fcd42ce686bbc07d52263bc135', 'PROFESIONAL', 1, '2026-10-27 14:54:15');

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
INSERT INTO paciente (id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado) VALUES (1, '30111222', 'Ana', 'López', '3764111111', 'ana@email.com', '1985-04-12', 'OSDE', 1);
INSERT INTO paciente (id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado) VALUES (2, '28777444', 'Luis', 'Díaz', '3765222222', 'luis@email.com', '1981-09-23', 'Swiss Medical', 1);

-- Datos de turno
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (1, 1, 1, '2026-10-06', '09:00', 'CONFIRMADO', 'Control', NULL, '2026-10-27 14:54:15', NULL, 1, NULL, NULL);
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (2, 2, 2, '2026-10-06', '09:30', 'PENDIENTE', 'Consulta', NULL, '2026-10-27 14:54:15', NULL, 1, NULL, NULL);

-- Datos de auditoria
INSERT INTO auditoria (id_auditoria, id_usuario, accion, entidad, id_entidad, datos_antes, datos_despues, fecha) VALUES (1, 1, 'INICIALIZACION', 'SISTEMA', NULL, NULL, '{"mensaje": "Base de datos inicializada con datos semilla"}', '2026-10-27 14:54:15');

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
  rol TEXT NOT NULL CHECK(rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL')),
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

-- 6. Tabla de Pacientes
CREATE TABLE IF NOT EXISTS paciente (
  id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
  dni TEXT NOT NULL CHECK(length(dni) BETWEEN 7 AND 8 AND dni GLOB '[0-9]*'),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT CHECK(telefono IS NULL OR (length(telefono) <= 12 AND telefono GLOB '[0-9]*')),
  correo TEXT NOT NULL COLLATE NOCASE,
  fecha_nacimiento TEXT CHECK(fecha_nacimiento IS NULL OR (fecha_nacimiento GLOB '[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]' AND fecha_nacimiento >= '1900-01-01')),
  obra_social TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT uq_paciente_dni UNIQUE (dni)
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

INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado) VALUES
  (1, 'Administrador', 'General', 'admin@saludturnos.com', 'scrypt$16384$8$1$57ee8c0debed376a2304352910071d36$0754af89fa3c9651138dc193feaa07e76b42f4c521b1a5b1b62e5e5271514bd471994b7ea0ec07aa95db14aa6b341cd4dc67df9530cbff671ff23498d718b7bd', 'ADMINISTRADOR', 1),
  (2, 'María', 'Recepcionista', 'recepcion@saludturnos.com', 'scrypt$16384$8$1$e54cea18e350330cf62f879e8f1385d2$3cd3d578066f99d7100a7ec9da1e030796d4b2d45a7b4e2a65c5ae3293ea3bf6add7ffd3c6e8bfdf3d51dff43db6073db01777676e80c79f8528ebe408dda361', 'RECEPCIONISTA', 1),
  (3, 'Laura', 'Gómez', 'laura.gomez@saludturnos.com', 'scrypt$16384$8$1$8839b34222dbae7f5cc5e21ec4201b0e$73099685ae2390fbcc913a680ddff39142332a12318f7f8eff6fbb799859f086e129f2903bc8dfbd7dc8019b2ab9568177a3cf61d910e2b6583522aefe4cfe51', 'PROFESIONAL', 1),
  (4, 'Martín', 'Pérez', 'martin.perez@saludturnos.com', 'scrypt$16384$8$1$4297f15e54f0f32c6db56c73fe32dca1$616186c6032b9da9f1c643e7186da808dd1b057110b87d7f7a6b89048b28c2c48c8eaf23f71745653ce9693ef88331ee6b024b4655e7bd1a24561fa701d5c28b', 'PROFESIONAL', 1),
  (5, 'Carla', 'Núñez', 'carla.nunez@saludturnos.com', 'scrypt$16384$8$1$1abd1dd59b7c39901b8b866782bef84d$e932eb0c6c6eb736e345349dcf928eb2ecc63a70d18b5791119032f17f2276a47ceed40d6302f84715e9cf054b464d1b50f015fcd42ce686bbc07d52263bc135', 'PROFESIONAL', 1);

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

-- 5. Pacientes (conservando datos de TP2, teléfonos normalizados a dígitos numéricos)
INSERT INTO paciente (id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado) VALUES
  (1, '30111222', 'Ana', 'López', '3764111111', 'ana@email.com', '1985-04-12', 'OSDE', 1),
  (2, '28777444', 'Luis', 'Díaz', '3765222222', 'luis@email.com', '1981-09-23', 'Swiss Medical', 1);

-- 6. Turnos históricos (2026-10-06)
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, creado_por) VALUES
  (1, 1, 1, '2026-10-06', '09:00', 'CONFIRMADO', 'Control', 1),
  (2, 2, 2, '2026-10-06', '09:30', 'PENDIENTE', 'Consulta', 1);

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
      p.id_profesional
    FROM sesion s
    JOIN usuario u ON s.id_usuario = u.id_usuario
    LEFT JOIN profesional p ON p.id_usuario = u.id_usuario AND p.estado = 1
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
    id_profesional: row.id_profesional || null
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
      } else {
        req.valid.params = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        Object.assign(fieldErrors, result.error.flatten().fieldErrors);
      } else {
        req.valid.query = result.data;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        Object.assign(fieldErrors, result.error.flatten().fieldErrors);
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
      SELECT id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado
      FROM paciente
      ${where}
      ORDER BY apellido ASC, nombre ASC
    `;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado
      FROM paciente
      WHERE id_paciente = ?
    `).get(id);
  },

  findByDni(dni, excludeId = null) {
    const db = getDb();
    if (excludeId) {
      return db.prepare('SELECT id_paciente, dni, estado FROM paciente WHERE dni = ? AND id_paciente <> ?').get(dni, excludeId);
    }
    return db.prepare('SELECT id_paciente, dni, estado FROM paciente WHERE dni = ?').get(dni);
  },

  create({ dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social }) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO paciente (dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
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
  findAll({ fecha, hora, paciente, profesional, estado, id_profesional_scope }) {
    const db = getDb();
    const conditions = [];
    const params = [];

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
    if (paciente) {
      conditions.push('(pa.dni LIKE \'%\' || ? || \'%\' ESCAPE \'\\\' OR normalizar(pa.nombre) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\' OR normalizar(pa.apellido) LIKE \'%\' || normalizar(?) || \'%\' ESCAPE \'\\\')');
      const escPac = escapeLike(paciente);
      params.push(escPac, escPac, escPac);
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
             p.id_profesional, p.matricula, p.consultorio, p.id_especialidad
      FROM usuario u
      LEFT JOIN profesional p ON p.id_usuario = u.id_usuario
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

export const agendaRouter = Router();
export const dashboardRouter = Router();

agendaRouter.use(requireAuth);
dashboardRouter.use(requireAuth);

// Agenda médica diaria o mensual (CU-04, D-38, Q9)
agendaRouter.get(
  '/',
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

// Lectura de especialidades permitida para ADMINISTRADOR y RECEPCIONISTA (D-07)
especialidadRouter.get(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ query: especialidadFilterSchema }),
  especialidadController.list
);

especialidadRouter.get(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
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

// Horarios disponibles (RF-06, CU-03)
turnoRouter.get(
  '/disponibles',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ query: turnosDisponiblesQuerySchema }),
  turnoController.getDisponibles
);

// Listado de turnos con filtros (RF-12, CU-04, HU-15)
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

// Alta de turno (CU-03, RF-08): Administrador y Recepcionista
turnoRouter.post(
  '/',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
  validate({ body: turnoCreateSchema }),
  turnoController.create
);

// Modificación de turno (RF-09, Q11): Administrador, Recepcionista y Profesional (observaciones)
turnoRouter.put(
  '/:id',
  validate({ params: turnoIdParamSchema, body: turnoUpdateSchema }),
  turnoController.update
);

// Cambio de estado (RF-11, Q1): Administrador, Recepcionista y Profesional
turnoRouter.patch(
  '/:id/estado',
  validate({ params: turnoIdParamSchema, body: turnoCambioEstadoSchema }),
  turnoController.cambiarEstado
);

// Cancelación de turno (RF-10, Q1, D-04): Administrador y Recepcionista
turnoRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),
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
  id_paciente: z.number().int().positive('Debe seleccionar un paciente'),
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

// Creación de usuario (Q4: si es PROFESIONAL, se exige profesional y disponibilidad)
export const userCreateSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  correo: z.string().trim().email('Formato de correo electrónico inválido').toLowerCase(),
  rol: z.enum(['RECEPCIONISTA', 'PROFESIONAL'], {
    errorMap: () => ({ message: 'El rol debe ser RECEPCIONISTA o PROFESIONAL' })
  }),
  profesional: profesionalDataSchema.optional(),
  disponibilidad: z.array(franjaHorariaSchema).optional()
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
  rol: z.enum(['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL']).optional(),
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

    // Filtro por profesional si el rol es PROFESIONAL
    const isDoc = user.rol === 'PROFESIONAL';
    const profFilter = isDoc ? 'AND t.id_profesional = ?' : '';
    const params = isDoc ? [hoy, fechaLimite, user.id_profesional] : [hoy, fechaLimite];

    // Contadores en la ventana [hoy, hoy+30]
    const turnosEnVentana = db.prepare(`
      SELECT t.estado, COUNT(*) as cantidad
      FROM turno t
      WHERE t.fecha >= ? AND t.fecha <= ? ${profFilter}
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

    // Próximos turnos: desde ahora en adelante, no cancelados, máx 5 (CA-18.2, Q8)
    const proximosParams = isDoc ? [hoy, hoy, horaActual, user.id_profesional] : [hoy, hoy, horaActual];
    const proximos = db.prepare(`
      SELECT 
        t.id_turno, t.fecha, t.hora, t.estado, t.motivo_consulta,
        pa.id_paciente, pa.dni AS paciente_dni, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
        pr.id_profesional, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido, pr.consultorio
      FROM turno t
      JOIN paciente pa ON t.id_paciente = pa.id_paciente
      JOIN profesional pr ON t.id_profesional = pr.id_profesional
      WHERE (t.fecha > ? OR (t.fecha = ? AND t.hora >= ?))
        AND t.estado <> 'CANCELADO'
        ${isDoc ? 'AND t.id_profesional = ?' : ''}
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

    // Obtener si es profesional
    const profesional = db.prepare('SELECT id_profesional FROM profesional WHERE id_usuario = ? AND estado = 1').get(user.id_usuario);

    return {
      token,
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
        id_profesional: profesional ? profesional.id_profesional : null
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
  list(filters = {}) {
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

  create(data, userId) {
    // Validar DNI único (CU-02 5b)
    const existing = pacienteRepository.findByDni(data.dni);
    if (existing) {
      throw new ConflictError('El DNI ingresado ya se encuentra registrado en el sistema.', {
        dni: 'El DNI ingresado ya se encuentra registrado en el sistema'
      });
    }

    const db = getDb();
    let newId;

    const tx = db.transaction(() => {
      newId = pacienteRepository.create(data);
      auditService.log({
        id_usuario: userId,
        accion: 'CREAR',
        entidad: 'PACIENTE',
        id_entidad: Number(newId),
        despues: { id: newId, ...data }
      });
    });

    tx();
    return this.getById(newId);
  },

  update(id, data, userId) {
    const current = this.getById(id);

    const existing = pacienteRepository.findByDni(data.dni, id);
    if (existing) {
      throw new ConflictError('El DNI ingresado ya pertenece a otro paciente.', {
        dni: 'El DNI ingresado ya se encuentra registrado en el sistema'
      });
    }

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.update(id, data);
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
   * Requiere verificar que no tenga turnos futuros activos.
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

  activate(id, userId) {
    const current = this.getById(id);
    if (current.estado) return current;

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.setEstado(id, 1);
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
    const scope = user.rol === 'PROFESIONAL' ? user.id_profesional : null;
    return turnoRepository.findAll({ ...filters, id_profesional_scope: scope });
  },

  getById(id, user) {
    this.marcarAusentes();
    const turno = turnoRepository.findById(id);
    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }
    // Si es PROFESIONAL, solo puede consultar sus propios turnos (D-02)
    if (user.rol === 'PROFESIONAL' && turno.id_profesional !== user.id_profesional) {
      throw new NotFoundError('Turno no encontrado');
    }
    return turno;
  },

  /**
   * Asignar nuevo turno (CU-03, RFB-40, D-26, D-27, D-28).
   * Estado inicial: PENDIENTE.
   */
  create(data, user) {
    this.marcarAusentes();

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

    // Cancelar turno: solo Recepción y Admin (D-04)
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

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.setEstado(id, 0);
      userRepository.deleteSessions(id);

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
    // Si es PROFESIONAL, solo ve sus propios datos (D-02, D-07)
    if (user.rol === 'PROFESIONAL') {
      const p = profesionalRepository.findById(user.id_profesional);
      return p ? [p] : [];
    }
    return profesionalRepository.findAll(filters);
  },

  getProfesionalById(id, user) {
    // Si es PROFESIONAL, solo puede consultar su propio ID
    if (user.rol === 'PROFESIONAL' && user.id_profesional !== id) {
      throw new NotFoundError('Profesional no encontrado');
    }

    const p = profesionalRepository.findById(id);
    if (!p) {
      throw new NotFoundError('Profesional no encontrado');
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

  // Servir frontend existente (HTMLs en public/, estilos en css/, scripts en js/, datos en data/)
  app.use(express.static(config.publicDir));
  app.use('/css', express.static(config.cssDir));
  app.use('/js', express.static(config.jsDir));
  app.use('/data', express.static(config.dataDir));

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

## File: public/agenda.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Agenda</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Encabezado de la Agenda Médica. -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Agenda médica</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">

    <!-- Menú de navegación de las pantallas privadas. -->
    <nav class="sidebar" aria-label="Navegación principal">
      <a href="dashboard.html">Panel</a>
      <a href="pacientes.html">Pacientes</a>
      <a href="turno.html">Turnos</a>
      <a class="active" href="agenda.html">Agenda</a>
      <button class="nav-button" id="logoutBtn">Cerrar sesión</button>
    </nav>

    <main class="content">
      <div class="page-title-row">
        <div>
          <h1>Agenda médica</h1>
          <p class="muted">Horarios libres y turnos asignados.</p>
        </div>
      </div>

      <!-- Filtros utilizados para decidir qué agenda mostrar. -->
      <section class="panel-card">
        <div class="filters-grid">
          <div class="field">
            <label for="agendaDate">Fecha</label>
            <input type="date" id="agendaDate">
          </div>

          <div class="field">
            <label for="agendaDoctor">Profesional</label>
            <select id="agendaDoctor"></select>
          </div>
        </div>
      </section>

      <!--
        agendaGrid comienza vacío.
        agenda.js genera cada franja horaria según los datos almacenados.
      -->
      <section class="panel-card">
        <h2>Disponibilidad</h2>
        <div id="agendaGrid" class="agenda-grid"></div>
      </section>
    </main>
  </div>

  <script src="/js/data.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/agenda.js"></script>
</body>
</html>
```

## File: public/dashboard.html
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

  <!-- Barra superior utilizada en las pantallas privadas. -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Panel principal</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <!--
    app-layout contiene dos áreas:
    - sidebar: menú de navegación.
    - content: contenido principal.
    CSS Grid se encarga de distribuir ambas columnas.
  -->
  <div class="app-layout">

    <!-- Menú principal del sistema. -->
    <nav class="sidebar" aria-label="Navegación principal">
      <a class="active" href="dashboard.html">Panel</a>
      <a href="pacientes.html">Pacientes</a>
      <a href="turno.html">Turnos</a>
      <a href="agenda.html">Agenda</a>

      <!-- common.js escucha el click de este botón y cierra la sesión. -->
      <button class="nav-button" id="logoutBtn">Cerrar sesión</button>
    </nav>

    <main class="content">
      <div class="page-title-row">
        <div>
          <h1>Panel principal</h1>
          <p class="muted">Resumen de la actividad registrada.</p>
        </div>
      </div>

      <!--
        Indicadores del Dashboard.
        Los valores comienzan en 0 y dashboard.js los actualiza dinámicamente.
      -->
      <section class="stats-grid" aria-label="Indicadores">
        <article class="stat-card">
          <span>Turnos registrados</span>
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

      <!-- Tabla de próximos turnos. -->
      <section class="panel-card">
        <div class="section-title">
          <h2>Próximos turnos</h2>
          <a class="btn btn-secondary" href="turno.html">Nuevo turno</a>
        </div>

        <!-- table-wrap agrega desplazamiento horizontal en pantallas pequeñas. -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Profesional</th>
                <th>Estado</th>
              </tr>
            </thead>

            <!-- dashboard.js genera las filas dentro de este tbody. -->
            <tbody id="dashboardTurnos"></tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <!--
    data.js   -> datos simulados y localStorage.
    common.js -> control de sesión y funciones compartidas.
    dashboard.js -> lógica propia de esta pantalla.
  -->
  <script src="/js/data.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/dashboard.js"></script>
</body>
</html>
```

## File: public/index.html
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
        La navegación hacia Login se realiza con un enlace HTML.
        No hace falta JavaScript porque es una navegación directa entre páginas.
      -->
      <a class="btn btn-primary" href="login.html">Iniciar sesión</a>
    </section>
  </main>

  <!-- Pie de página informativo. -->
  <footer class="footer">
    Aplicaciones Web y Móvil - Trabajo Práctico 2
  </footer>

</body>
</html>
```

## File: public/login.html
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
          <input
            type="email"
            id="email"
            name="email"
            placeholder="usuario@correo.com"
            required
          >

          <!-- JavaScript escribe aquí el mensaje de error correspondiente. -->
          <small class="error" id="emailError"></small>
        </div>

        <!-- Campo de contraseña. -->
        <div class="field">
          <label for="password">Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Contraseña"
            required
          >
          <small class="error" id="passwordError"></small>
        </div>

        <!-- Al enviar el formulario se ejecuta el evento submit definido en login.js. -->
        <button class="btn btn-primary full" type="submit">Ingresar</button>

        <!-- aria-live permite que lectores de pantalla anuncien cambios del mensaje. -->
        <p id="loginMessage" class="form-message" aria-live="polite"></p>
      </form>

      <!-- Credenciales simuladas para facilitar la demostración académica. -->
      <div class="demo-box">
        <strong>Usuario de prueba</strong>
        <span>admin@saludturnos.com / 1234</span>
      </div>
    </section>
  </main>

  <!--
    Orden de carga de los scripts:
    1) data.js crea AppData y los datos simulados.
    2) login.js utiliza AppData para validar las credenciales.
  -->
  <script src="/js/data.js"></script>
  <script src="/js/login.js"></script>
</body>
</html>
```

## File: public/pacientes.html
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

  <!-- Encabezado de la pantalla. -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Gestión de pacientes</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">

    <!-- Navegación principal. -->
    <nav class="sidebar" aria-label="Navegación principal">
      <a href="dashboard.html">Panel</a>
      <a class="active" href="pacientes.html">Pacientes</a>
      <a href="turno.html">Turnos</a>
      <a href="agenda.html">Agenda</a>
      <button class="nav-button" id="logoutBtn">Cerrar sesión</button>
    </nav>

    <main class="content">

      <!-- Título y acción principal de la pantalla. -->
      <div class="page-title-row">
        <div>
          <h1>Gestión de pacientes</h1>
          <p class="muted">Alta, búsqueda y consulta de pacientes.</p>
        </div>

        <!-- pacientes.js muestra el formulario cuando se presiona este botón. -->
        <button class="btn btn-primary" id="toggleFormBtn">Nuevo paciente</button>
      </div>

      <!--
        Formulario de alta de paciente.
        Comienza oculto mediante la clase hidden.
      -->
      <section class="panel-card hidden" id="patientFormCard">
        <h2>Registrar paciente</h2>

        <form id="patientForm" class="grid-form" novalidate>

          <div class="field">
            <label for="dni">DNI *</label>
            <input id="dni" maxlength="15" required>
            <small class="error" id="dniError"></small>
          </div>

          <div class="field">
            <label for="nombre">Nombre *</label>
            <input id="nombre" maxlength="50" required>
            <small class="error" id="nombreError"></small>
          </div>

          <div class="field">
            <label for="apellido">Apellido *</label>
            <input id="apellido" maxlength="50" required>
            <small class="error" id="apellidoError"></small>
          </div>

          <div class="field">
            <label for="telefono">Teléfono</label>
            <input id="telefono" maxlength="20">
          </div>

          <!-- span-2 hace que el campo ocupe las dos columnas del formulario. -->
          <div class="field span-2">
            <label for="correo">Correo</label>
            <input id="correo" type="email" maxlength="100">
            <small class="error" id="correoError"></small>
          </div>

          <div class="form-actions span-2">
            <button type="button" class="btn btn-light" id="cancelPatientBtn">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>

          <!-- Mensaje general de resultado del formulario. -->
          <p id="patientMessage" class="form-message span-2" aria-live="polite"></p>
        </form>
      </section>

      <!-- Sección de búsqueda y listado de pacientes. -->
      <section class="panel-card">
        <div class="filter-row">
          <!--
            sr-only oculta visualmente el label, pero lo mantiene para accesibilidad.
          -->
          <label class="sr-only" for="patientSearch">Buscar pacientes</label>
          <input id="patientSearch" placeholder="Buscar por DNI, nombre o apellido...">
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Estado</th>
              </tr>
            </thead>

            <!-- pacientes.js completa dinámicamente las filas. -->
            <tbody id="patientsTable"></tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <script src="/js/data.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/pacientes.js"></script>
</body>
</html>
```

## File: public/turno.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salud Turnos - Solicitud de turno</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>

  <!-- Encabezado de la pantalla de turnos. -->
  <header class="topbar">
    <div class="topbar-brand-wrap">
      <div class="brand">SALUD TURNOS</div>
      <span class="screen-code">Formulario de solicitud de turno</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú de navegación">☰</button>
  </header>

  <div class="app-layout">

    <!-- Menú de navegación principal. -->
    <nav class="sidebar" aria-label="Navegación principal">
      <a href="dashboard.html">Panel</a>
      <a href="pacientes.html">Pacientes</a>
      <a class="active" href="turno.html">Turnos</a>
      <a href="agenda.html">Agenda</a>
      <button class="nav-button" id="logoutBtn">Cerrar sesión</button>
    </nav>

    <main class="content">
      <div class="page-title-row">
        <div>
          <h1>Solicitud de turno</h1>
          <p class="muted">Complete los datos y verifique la disponibilidad.</p>
        </div>
      </div>

      <!-- Formulario para registrar un nuevo turno. -->
      <section class="panel-card">
        <form id="turnForm" class="grid-form" novalidate>

          <!-- La lista de pacientes se genera desde turnos.js. -->
          <div class="field span-2">
            <label for="patientSelect">Paciente *</label>
            <select id="patientSelect" required></select>
            <small class="error" id="patientSelectError"></small>
          </div>

          <!--
            La especialidad determina qué profesionales se muestran después.
            Esto representa una dependencia entre campos del formulario.
          -->
          <div class="field">
            <label for="specialtySelect">Especialidad *</label>
            <select id="specialtySelect" required></select>
          </div>

          <div class="field">
            <label for="doctorSelect">Profesional *</label>
            <select id="doctorSelect" required></select>
            <small class="error" id="doctorSelectError"></small>
          </div>

          <div class="field">
            <label for="turnDate">Fecha *</label>
            <input type="date" id="turnDate" required>
            <small class="error" id="turnDateError"></small>
          </div>

          <!-- Los horarios disponibles se calculan dinámicamente. -->
          <div class="field">
            <label for="turnTime">Hora *</label>
            <select id="turnTime" required></select>
            <small class="error" id="turnTimeError"></small>
          </div>

          <div class="field span-2">
            <label for="motivo">Motivo de consulta</label>
            <textarea id="motivo" rows="3" maxlength="255" placeholder="Opcional"></textarea>
          </div>

          <div class="form-actions span-2">
            <a class="btn btn-light" href="dashboard.html">Cancelar</a>
            <button type="submit" class="btn btn-primary">Confirmar turno</button>
          </div>

          <p id="turnMessage" class="form-message span-2" aria-live="polite"></p>
        </form>
      </section>

      <!-- Listado de turnos existentes. -->
      <section class="panel-card">
        <h2>Turnos registrados</h2>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Profesional</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <!-- turnos.js genera las filas y los botones Cancelar. -->
            <tbody id="turnsTable"></tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <script src="/js/data.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/turnos.js"></script>
</body>
</html>
```

## File: .gitignore
```
node_modules
node_modules/
backend/data/*.db
backend/data/*.db-wal
backend/data/*.db-shm
.DS_Store
*.log
*.md
*.txt
```

## File: package.json
```json
{
  "name": "Practico2",
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

## File: data/datos.json
```json
{
  "descripcion": "Archivo de ejemplo con datos simulados para el TP2. La aplicación utiliza localStorage para facilitar la ejecución sin servidor.",
  "pacientes": [
    {"id": 1, "dni": "30111222", "nombre": "Ana", "apellido": "López"},
    {"id": 2, "dni": "28777444", "nombre": "Luis", "apellido": "Díaz"}
  ],
  "turnos": [
    {"id": 1, "paciente": "Ana López", "profesional": "Dra. Laura Gómez", "fecha": "2026-10-06", "hora": "09:00", "estado": "Confirmado"}
  ]
}
```

## File: js/agenda.js
```javascript
/* =============================================================
   agenda.js
   -------------------------------------------------------------
   Muestra la disponibilidad de un profesional para una fecha.

   Cada horario puede quedar representado como:
   - LIBRE: no existe un turno activo en ese horario.
   - OCUPADO: existe un turno Pendiente o Confirmado.
   ============================================================= */

// Se cargan los datos que necesita la pantalla.
const doctors = AppData.read('doctors');
const patients = AppData.read('patients');
const hours = AppData.read('hours');

// Referencias a los elementos HTML.
const dateInput = document.getElementById('agendaDate');
const doctorSelect = document.getElementById('agendaDoctor');
const agendaGrid = document.getElementById('agendaGrid');

/* -------------------------------------------------------------
   CARGA DEL SELECT DE PROFESIONALES
------------------------------------------------------------- */
doctorSelect.innerHTML = doctors.map(function (doctor) {
  return `<option value="${doctor.id}">${doctor.name}</option>`;
}).join('');

/*
  Se asigna como fecha inicial el día actual.
  toISOString devuelve una fecha completa y slice(0, 10)
  conserva solamente YYYY-MM-DD, formato esperado por input date.
*/
dateInput.value = new Date().toISOString().slice(0, 10);

/* -------------------------------------------------------------
   FUNCIÓN renderAgenda()
------------------------------------------------------------- */
function renderAgenda() {

  // Se vuelven a leer los turnos por si fueron modificados en otra pantalla.
  const turns = AppData.read('turns');

  const date = dateInput.value;
  const doctorId = Number(doctorSelect.value);

  /*
    Se recorre cada horario y se busca un turno que coincida con:
    - fecha,
    - hora,
    - profesional,
    - estado diferente de Cancelado.
  */
  agendaGrid.innerHTML = hours.map(function (hour) {

    const turn = turns.find(function (item) {
      return item.date === date
        && item.time === hour
        && item.doctorId === doctorId
        && item.status !== 'Cancelado';
    });

    // Si no existe turno, el horario está libre.
    if (!turn) {
      return `
        <div class="agenda-slot free">
          <strong>${hour}</strong>
          <span>Horario disponible</span>
          <span class="slot-state">LIBRE</span>
        </div>
      `;
    }

    // Si existe turno, se localiza al paciente asociado.
    const patient = patients.find(function (item) {
      return item.id === turn.patientId;
    });

    return `
      <div class="agenda-slot busy">
        <strong>${hour}</strong>
        <span>${AppHelpers.patientName(patient)} - ${turn.status}</span>
        <span class="slot-state">OCUPADO</span>
      </div>
    `;
  }).join('');
}

/* -------------------------------------------------------------
   EVENTOS
   -------------------------------------------------------------
   Cada cambio de fecha o profesional vuelve a construir la agenda.
------------------------------------------------------------- */
dateInput.addEventListener('change', renderAgenda);
doctorSelect.addEventListener('change', renderAgenda);

// Primera carga de la agenda.
renderAgenda();
```

## File: js/dashboard.js
```javascript
/* =============================================================
   dashboard.js
   -------------------------------------------------------------
   Genera el contenido dinámico del Panel Principal:
   - Cantidad total de turnos.
   - Cantidad de confirmados.
   - Cantidad de cancelados.
   - Tabla con los próximos turnos activos.
   ============================================================= */

// Se leen las colecciones desde localStorage.
const turns = AppData.read('turns');
const patients = AppData.read('patients');
const doctors = AppData.read('doctors');

/* -------------------------------------------------------------
   INDICADORES DEL DASHBOARD
------------------------------------------------------------- */

// Total de elementos dentro del arreglo turns.
document.getElementById('totalTurnos').textContent = turns.length;

// filter devuelve solamente los turnos que cumplen la condición.
document.getElementById('confirmados').textContent = turns.filter(function (turn) {
  return turn.status === 'Confirmado';
}).length;

document.getElementById('cancelados').textContent = turns.filter(function (turn) {
  return turn.status === 'Cancelado';
}).length;

/* -------------------------------------------------------------
   TABLA DE PRÓXIMOS TURNOS
------------------------------------------------------------- */
const tbody = document.getElementById('dashboardTurnos');

/*
  1) Se quitan los turnos cancelados.
  2) Se ordenan por fecha y hora.
  3) Se muestran solamente los primeros cinco.
*/
const activeTurns = turns
  .filter(function (turn) {
    return turn.status !== 'Cancelado';
  })
  .sort(function (a, b) {
    const dateA = `${a.date} ${a.time}`;
    const dateB = `${b.date} ${b.time}`;
    return dateA.localeCompare(dateB);
  })
  .slice(0, 5);

// Si no existen turnos activos, se informa dentro de la tabla.
if (activeTurns.length === 0) {
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="empty-row">No hay turnos registrados.</td>
    </tr>
  `;
} else {

  /*
    map transforma cada turno en una fila HTML.
    join('') une todas esas filas en un único texto HTML.
  */
  tbody.innerHTML = activeTurns.map(function (turn) {

    // Se busca el paciente asociado al patientId del turno.
    const patient = patients.find(function (item) {
      return item.id === turn.patientId;
    });

    // Se busca el profesional asociado al doctorId del turno.
    const doctor = doctors.find(function (item) {
      return item.id === turn.doctorId;
    });

    return `
      <tr>
        <td>${turn.date}</td>
        <td>${turn.time}</td>
        <td>${AppHelpers.patientName(patient)}</td>
        <td>${AppHelpers.doctorName(doctor)}</td>
        <td>${AppHelpers.statusBadge(turn.status)}</td>
      </tr>
    `;
  }).join('');
}
```

## File: js/login.js
```javascript
/* =============================================================
   login.js
   -------------------------------------------------------------
   Se encarga de:
   - Capturar el envío del formulario de Login.
   - Validar que correo y contraseña estén completos.
   - Comparar las credenciales con el usuario simulado.
   - Crear una sesión temporal con sessionStorage.
   ============================================================= */

// Se obtienen referencias a elementos del DOM que se usarán varias veces.
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

/* -------------------------------------------------------------
   FUNCIÓN clearErrors()
   -------------------------------------------------------------
   Limpia los mensajes anteriores antes de realizar una nueva
   validación del formulario.
------------------------------------------------------------- */
function clearErrors() {
  document.getElementById('emailError').textContent = '';
  document.getElementById('passwordError').textContent = '';

  loginMessage.textContent = '';
  loginMessage.className = 'form-message';
}

/* -------------------------------------------------------------
   EVENTO submit DEL FORMULARIO
------------------------------------------------------------- */
loginForm.addEventListener('submit', function (event) {

  /*
    preventDefault evita el comportamiento normal del formulario,
    es decir, evita que la página se recargue automáticamente.
  */
  event.preventDefault();

  clearErrors();

  // Se leen y limpian los valores escritos por el usuario.
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // Esta variable indica si todas las validaciones son correctas.
  let valid = true;

  // Validación: el correo es obligatorio.
  if (!email) {
    document.getElementById('emailError').textContent = 'Debe ingresar el correo.';
    valid = false;
  }

  // Validación: la contraseña es obligatoria.
  if (!password) {
    document.getElementById('passwordError').textContent = 'Debe ingresar la contraseña.';
    valid = false;
  }

  // Si algún campo es inválido, se detiene el proceso.
  if (!valid) {
    return;
  }

  /*
    find recorre el arreglo de usuarios y devuelve el primero que
    coincida con correo y contraseña.

    Para este TP los usuarios son datos simulados.
  */
  const user = AppData.defaults.users.find(function (item) {
    return item.email === email && item.password === password;
  });

  // Si no se encuentra el usuario, se muestra un mensaje genérico.
  if (!user) {
    loginMessage.textContent = 'Usuario o contraseña incorrectos.';
    loginMessage.classList.add('bad');

    // Se limpia solamente la contraseña para permitir un nuevo intento.
    document.getElementById('password').value = '';
    return;
  }

  /*
    Login correcto:
    se guarda una sesión mínima con el correo y el rol del usuario.
    No se guarda la contraseña.
  */
  sessionStorage.setItem(
    'saludturnos_user',
    JSON.stringify({
      email: user.email,
      role: user.role
    })
  );

  // Se navega al Dashboard.
  window.location.href = 'dashboard.html';
});
```

## File: js/pacientes.js
```javascript
/* =============================================================
   pacientes.js
   -------------------------------------------------------------
   Lógica de la pantalla Gestión de Pacientes:
   - Mostrar pacientes.
   - Buscar pacientes.
   - Mostrar/ocultar el formulario.
   - Validar datos.
   - Evitar DNI duplicados.
   - Registrar pacientes en localStorage.
   ============================================================= */

/*
  let se utiliza porque el arreglo patients será modificado cuando
  se agregue un nuevo paciente.
*/
let patients = AppData.read('patients');

// Referencias a elementos del DOM.
const table = document.getElementById('patientsTable');
const search = document.getElementById('patientSearch');
const formCard = document.getElementById('patientFormCard');
const form = document.getElementById('patientForm');
const toggleBtn = document.getElementById('toggleFormBtn');
const cancelBtn = document.getElementById('cancelPatientBtn');
const message = document.getElementById('patientMessage');

/* -------------------------------------------------------------
   FUNCIÓN renderPatients(filter)
   -------------------------------------------------------------
   Dibuja la tabla de pacientes.
   Puede recibir un texto opcional para filtrar los resultados.
------------------------------------------------------------- */
function renderPatients(filter = '') {

  // Se normaliza el texto para facilitar la comparación.
  const text = filter.toLowerCase().trim();

  /*
    filter recorre cada paciente y conserva aquellos donde el texto
    buscado aparezca en DNI, nombre o apellido.
  */
  const filtered = patients.filter(function (patient) {
    const searchableText = `${patient.dni} ${patient.nombre} ${patient.apellido}`.toLowerCase();
    return searchableText.includes(text);
  });

  // Si se encontraron pacientes, se generan las filas.
  if (filtered.length > 0) {
    table.innerHTML = filtered.map(function (patient) {
      return `
        <tr>
          <td>${patient.dni}</td>
          <td>${patient.nombre} ${patient.apellido}</td>
          <td>${patient.telefono || '-'}</td>
          <td>${patient.correo || '-'}</td>
          <td>${patient.estado ? 'Activo' : 'Inactivo'}</td>
        </tr>
      `;
    }).join('');
  } else {
    // Caso en el que el filtro no devuelve resultados.
    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">No se encontraron pacientes.</td>
      </tr>
    `;
  }
}

/* -------------------------------------------------------------
   FUNCIÓN clearFormErrors()
   Limpia mensajes anteriores del formulario.
------------------------------------------------------------- */
function clearFormErrors() {
  const errorIds = [
    'dniError',
    'nombreError',
    'apellidoError',
    'correoError'
  ];

  errorIds.forEach(function (id) {
    document.getElementById(id).textContent = '';
  });

  message.textContent = '';
  message.className = 'form-message span-2';
}

/* -------------------------------------------------------------
   FUNCIÓN toggleForm(show)
   -------------------------------------------------------------
   show = true  -> muestra el formulario.
   show = false -> oculta y limpia el formulario.
------------------------------------------------------------- */
function toggleForm(show) {
  formCard.classList.toggle('hidden', !show);

  if (!show) {
    form.reset();
    clearFormErrors();
  }
}

/* -------------------------------------------------------------
   EVENTOS DE INTERFAZ
------------------------------------------------------------- */

// Botón "Nuevo paciente".
toggleBtn.addEventListener('click', function () {
  toggleForm(true);
});

// Botón "Cancelar" del formulario.
cancelBtn.addEventListener('click', function () {
  toggleForm(false);
});

/*
  El evento input se dispara cada vez que cambia el contenido
  del cuadro de búsqueda. La tabla se actualiza en tiempo real.
*/
search.addEventListener('input', function () {
  renderPatients(search.value);
});

/* -------------------------------------------------------------
   ALTA DE PACIENTE
------------------------------------------------------------- */
form.addEventListener('submit', function (event) {
  event.preventDefault();
  clearFormErrors();

  // Se obtienen los valores ingresados.
  const dni = document.getElementById('dni').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const correo = document.getElementById('correo').value.trim();

  let valid = true;

  /* ---------------- VALIDACIÓN DEL DNI ---------------- */
  if (!dni) {
    document.getElementById('dniError').textContent = 'El DNI es obligatorio.';
    valid = false;
  } else {
    // some devuelve true si al menos un paciente tiene ese DNI.
    const duplicatedDni = patients.some(function (patient) {
      return patient.dni === dni;
    });

    if (duplicatedDni) {
      document.getElementById('dniError').textContent = 'El DNI ya se encuentra registrado.';
      valid = false;
    }
  }

  /* --------------- VALIDACIÓN DEL NOMBRE -------------- */
  if (!nombre) {
    document.getElementById('nombreError').textContent = 'El nombre es obligatorio.';
    valid = false;
  }

  /* -------------- VALIDACIÓN DEL APELLIDO ------------- */
  if (!apellido) {
    document.getElementById('apellidoError').textContent = 'El apellido es obligatorio.';
    valid = false;
  }

  /* ---------------- VALIDACIÓN DEL CORREO --------------
     El correo es opcional, pero si el usuario escribe uno debe
     respetar un formato básico usuario@dominio.extensión.
  ------------------------------------------------------- */
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (correo && !emailPattern.test(correo)) {
    document.getElementById('correoError').textContent = 'Ingrese un correo válido.';
    valid = false;
  }

  // Si existe algún error, no se registra el paciente.
  if (!valid) {
    return;
  }

  /* -----------------------------------------------------
     GENERACIÓN DEL NUEVO ID
     -----------------------------------------------------
     Se obtiene el mayor ID actual y se suma 1.
     Si todavía no existen pacientes, se comienza desde 1.
  ----------------------------------------------------- */
  const nextId = patients.length > 0
    ? Math.max(...patients.map(function (patient) { return patient.id; })) + 1
    : 1;

  // Se agrega el nuevo objeto al arreglo.
  patients.push({
    id: nextId,
    dni,
    nombre,
    apellido,
    telefono,
    correo,
    estado: true
  });

  // Se persiste el arreglo actualizado en localStorage.
  AppData.write('patients', patients);

  // Se vuelve a dibujar la tabla manteniendo el filtro actual.
  renderPatients(search.value);

  // Mensaje de éxito.
  message.textContent = 'Paciente registrado correctamente.';
  message.classList.add('ok');

  // Se limpian los campos del formulario.
  form.reset();
});

/* -------------------------------------------------------------
   CARGA INICIAL
   -------------------------------------------------------------
   Al entrar a la pantalla se dibuja inmediatamente el listado.
------------------------------------------------------------- */
renderPatients();
```

## File: js/turnos.js
```javascript
/* =============================================================
   turnos.js
   -------------------------------------------------------------
   Lógica principal de Gestión / Solicitud de Turnos.

   Permite:
   - Cargar pacientes activos.
   - Cargar especialidades.
   - Filtrar profesionales según especialidad.
   - Calcular horarios libres.
   - Validar el formulario.
   - Evitar superposición de turnos.
   - Registrar un nuevo turno.
   - Cancelar un turno existente.
   ============================================================= */

/* -------------------------------------------------------------
   CARGA DE DATOS
------------------------------------------------------------- */
let turns = AppData.read('turns');
const patients = AppData.read('patients');
const doctors = AppData.read('doctors');
const specialties = AppData.read('specialties');
const hours = AppData.read('hours');

/* -------------------------------------------------------------
   REFERENCIAS AL DOM
------------------------------------------------------------- */
const patientSelect = document.getElementById('patientSelect');
const specialtySelect = document.getElementById('specialtySelect');
const doctorSelect = document.getElementById('doctorSelect');
const dateInput = document.getElementById('turnDate');
const timeSelect = document.getElementById('turnTime');
const form = document.getElementById('turnForm');
const message = document.getElementById('turnMessage');
const table = document.getElementById('turnsTable');

/* -------------------------------------------------------------
   FUNCIÓN fillPatients()
   -------------------------------------------------------------
   Carga en el <select> solamente pacientes activos.
------------------------------------------------------------- */
function fillPatients() {
  const activePatients = patients.filter(function (patient) {
    return patient.estado;
  });

  const options = activePatients.map(function (patient) {
    return `
      <option value="${patient.id}">
        ${patient.dni} - ${patient.nombre} ${patient.apellido}
      </option>
    `;
  }).join('');

  patientSelect.innerHTML = `
    <option value="">Seleccione un paciente</option>
    ${options}
  `;
}

/* -------------------------------------------------------------
   FUNCIÓN fillSpecialties()
   Carga las especialidades disponibles.
------------------------------------------------------------- */
function fillSpecialties() {
  specialtySelect.innerHTML = specialties.map(function (specialty) {
    return `<option value="${specialty.id}">${specialty.name}</option>`;
  }).join('');
}

/* -------------------------------------------------------------
   FUNCIÓN fillDoctors()
   -------------------------------------------------------------
   Filtra profesionales según la especialidad elegida.
------------------------------------------------------------- */
function fillDoctors() {

  // value viene del HTML como texto, por eso se convierte a Number.
  const specialtyId = Number(specialtySelect.value);

  const filteredDoctors = doctors.filter(function (doctor) {
    return doctor.specialtyId === specialtyId;
  });

  const options = filteredDoctors.map(function (doctor) {
    return `
      <option value="${doctor.id}">
        ${doctor.name} - Consultorio ${doctor.office}
      </option>
    `;
  }).join('');

  doctorSelect.innerHTML = `
    <option value="">Seleccione un profesional</option>
    ${options}
  `;

  /*
    Al cambiar de especialidad también cambia el profesional.
    Por eso se recalculan los horarios disponibles.
  */
  fillHours();
}

/* -------------------------------------------------------------
   FUNCIÓN fillHours()
   -------------------------------------------------------------
   Muestra únicamente horarios que todavía no estén ocupados por
   un turno activo del mismo profesional y la misma fecha.
------------------------------------------------------------- */
function fillHours() {
  const doctorId = Number(doctorSelect.value);
  const date = dateInput.value;

  // Se reinicia el selector de horarios.
  timeSelect.innerHTML = '<option value="">Seleccione un horario</option>';

  hours.forEach(function (hour) {

    /*
      occupied será true si existe un turno que coincida con:
      - mismo profesional,
      - misma fecha,
      - misma hora,
      - estado diferente de Cancelado.
    */
    const occupied = turns.some(function (turn) {
      return turn.doctorId === doctorId
        && turn.date === date
        && turn.time === hour
        && turn.status !== 'Cancelado';
    });

    // Solo se agrega el horario si está libre.
    if (!occupied) {
      timeSelect.insertAdjacentHTML(
        'beforeend',
        `<option value="${hour}">${hour}</option>`
      );
    }
  });
}

/* -------------------------------------------------------------
   FUNCIÓN clearErrors()
   Limpia mensajes previos del formulario.
------------------------------------------------------------- */
function clearErrors() {
  const errorIds = [
    'patientSelectError',
    'doctorSelectError',
    'turnDateError',
    'turnTimeError'
  ];

  errorIds.forEach(function (id) {
    document.getElementById(id).textContent = '';
  });

  message.textContent = '';
  message.className = 'form-message span-2';
}

/* -------------------------------------------------------------
   FUNCIÓN renderTurns()
   -------------------------------------------------------------
   Construye la tabla con todos los turnos registrados.
------------------------------------------------------------- */
function renderTurns() {

  // Si no hay turnos, se muestra un mensaje dentro de la tabla.
  if (turns.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">No hay turnos registrados.</td>
      </tr>
    `;
    return;
  }

  /*
    slice crea una copia antes de ordenar para no alterar
    directamente el arreglo original.
  */
  const orderedTurns = turns
    .slice()
    .sort(function (a, b) {
      const dateA = `${a.date} ${a.time}`;
      const dateB = `${b.date} ${b.time}`;
      return dateA.localeCompare(dateB);
    });

  table.innerHTML = orderedTurns.map(function (turn) {

    // Se recupera el objeto paciente relacionado con el turno.
    const patient = patients.find(function (item) {
      return item.id === turn.patientId;
    });

    // Se recupera el objeto profesional relacionado con el turno.
    const doctor = doctors.find(function (item) {
      return item.id === turn.doctorId;
    });

    /*
      Si el turno ya está cancelado no tiene sentido mostrar nuevamente
      el botón Cancelar.
    */
    const action = turn.status === 'Cancelado'
      ? '-'
      : `<button class="btn btn-danger" data-cancel-id="${turn.id}">Cancelar</button>`;

    return `
      <tr>
        <td>${turn.date}</td>
        <td>${turn.time}</td>
        <td>${AppHelpers.patientName(patient)}</td>
        <td>${AppHelpers.doctorName(doctor)}</td>
        <td>${AppHelpers.statusBadge(turn.status)}</td>
        <td>${action}</td>
      </tr>
    `;
  }).join('');
}

/* -------------------------------------------------------------
   EVENTOS DE LOS FILTROS DEL FORMULARIO
------------------------------------------------------------- */

// Cambiar la especialidad vuelve a cargar profesionales.
specialtySelect.addEventListener('change', fillDoctors);

// Cambiar el profesional vuelve a calcular disponibilidad.
doctorSelect.addEventListener('change', fillHours);

// Cambiar la fecha vuelve a calcular disponibilidad.
dateInput.addEventListener('change', fillHours);

/* -------------------------------------------------------------
   CANCELACIÓN DE TURNOS
   -------------------------------------------------------------
   Se usa delegación de eventos sobre la tabla porque los botones
   Cancelar son creados dinámicamente con innerHTML.
------------------------------------------------------------- */
table.addEventListener('click', function (event) {

  /*
    closest busca si el elemento presionado o alguno de sus padres
    posee el atributo data-cancel-id.
  */
  const button = event.target.closest('[data-cancel-id]');

  // Si el click no fue sobre un botón Cancelar, no se hace nada.
  if (!button) {
    return;
  }

  // dataset.cancelId recupera el valor del atributo data-cancel-id.
  const id = Number(button.dataset.cancelId);

  /*
    map crea un nuevo arreglo.
    Solo el turno con el ID indicado cambia su estado a Cancelado.
  */
  turns = turns.map(function (turn) {
    if (turn.id === id) {
      return {
        ...turn,
        status: 'Cancelado'
      };
    }

    return turn;
  });

  // Se guarda el arreglo actualizado.
  AppData.write('turns', turns);

  // Se actualizan la tabla y los horarios disponibles.
  renderTurns();
  fillHours();
});

/* -------------------------------------------------------------
   REGISTRO DE UN NUEVO TURNO
------------------------------------------------------------- */
form.addEventListener('submit', function (event) {
  event.preventDefault();
  clearErrors();

  // Se leen los valores del formulario.
  const patientId = Number(patientSelect.value);
  const doctorId = Number(doctorSelect.value);
  const date = dateInput.value;
  const time = timeSelect.value;
  const motivo = document.getElementById('motivo').value.trim();

  let valid = true;

  /* ---------------- VALIDACIONES BÁSICAS ---------------- */
  if (!patientId) {
    document.getElementById('patientSelectError').textContent = 'Seleccione un paciente.';
    valid = false;
  }

  if (!doctorId) {
    document.getElementById('doctorSelectError').textContent = 'Seleccione un profesional.';
    valid = false;
  }

  if (!date) {
    document.getElementById('turnDateError').textContent = 'Seleccione una fecha.';
    valid = false;
  }

  if (!time) {
    document.getElementById('turnTimeError').textContent = 'Seleccione un horario disponible.';
    valid = false;
  }

  if (!valid) {
    return;
  }

  /* -------------------------------------------------------
     SEGUNDA VERIFICACIÓN DE DISPONIBILIDAD
     -------------------------------------------------------
     Aunque el horario mostrado era libre, se valida nuevamente
     antes de guardar. Esto evita registrar una superposición.
  ------------------------------------------------------- */
  const conflict = turns.some(function (turn) {
    return turn.doctorId === doctorId
      && turn.date === date
      && turn.time === time
      && turn.status !== 'Cancelado';
  });

  if (conflict) {
    message.textContent = 'El horario dejó de estar disponible. Seleccione otro.';
    message.classList.add('bad');

    fillHours();
    return;
  }

  /* ---------------- GENERACIÓN DEL ID ------------------- */
  const nextId = turns.length > 0
    ? Math.max(...turns.map(function (turn) { return turn.id; })) + 1
    : 1;

  // Se crea el nuevo objeto Turno.
  const newTurn = {
    id: nextId,
    patientId,
    doctorId,
    date,
    time,
    status: 'Pendiente',
    motivo
  };

  // Se agrega al arreglo y se guarda en localStorage.
  turns.push(newTurn);
  AppData.write('turns', turns);

  // Se informa el resultado al usuario.
  message.textContent = 'Turno registrado correctamente.';
  message.classList.add('ok');

  // Se actualiza el DOM sin recargar la página.
  renderTurns();
  fillHours();
});

/* -------------------------------------------------------------
   INICIALIZACIÓN DE LA PANTALLA
------------------------------------------------------------- */

// Carga pacientes y especialidades.
fillPatients();
fillSpecialties();

// Con la primera especialidad disponible se cargan los profesionales.
fillDoctors();

/*
  Se establece la fecha mínima en hoy para impedir seleccionar
  días anteriores desde el control HTML.
*/
dateInput.min = new Date().toISOString().slice(0, 10);
dateInput.value = dateInput.min;

// Se calculan horarios y se dibuja la tabla inicial.
fillHours();
renderTurns();
```

## File: css/styles.css
```css
/* =============================================================
   styles.css
   -------------------------------------------------------------
   Hoja de estilos principal de Salud Turnos.

   En este archivo se aplican:
   - Variables CSS.
   - Layout Responsive (Grid + Flexbox).
   - Sidebar de altura constante sticky con logout fijo.
   - Menú móvil desplegable.
   - Formatos para formularios, tablas, badges e indicadores.
   ============================================================= */

/* -------------------------------------------------------------
   1. VARIABLES DE COLOR Y DISEÑO
   ------------------------------------------------------------- */
:root {
  --navy: #123a5a;
  --navy-dark: #0d2d46;
  --blue: #2d78b8;
  --blue-hover: #226299;
  --blue-light: #edf4fa;
  --bg: #f4f6f8;
  --line: #d9e0e6;
  --text: #24323d;
  --muted: #667784;
  --white: #ffffff;
  --danger: #b3261e;
  --danger-hover: #8d1e17;
  --danger-bg: #fdebea;
  --success: #267a45;
  --success-bg: #e7f5ec;
  --warning-bg: #fff7df;
  --warning-text: #7a5a18;

  --topbar-height: 58px;
  --sidebar-width: 210px;
  --radius: 8px;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --transition: all 0.2s ease-in-out;
}

/* -------------------------------------------------------------
   2. REGLAS GENERALES
   ------------------------------------------------------------- */
* {
  box-sizing: border-box;
}

html {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text);
  background: var(--bg);
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select,
textarea {
  font: inherit;
}

/* Evita zoom automático en navegadores móviles al enfocar inputs */
input,
select,
textarea {
  font-size: 16px;
}

/* -------------------------------------------------------------
   3. BARRA SUPERIOR (TOPBAR)
   ------------------------------------------------------------- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: var(--topbar-height);
  min-height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  background: var(--navy);
  color: var(--white);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.topbar-brand-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  color: var(--white);
}

.screen-code {
  font-size: 0.85rem;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.12);
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 500;
}

/* Botón hamburguesa para dispositivos móviles */
.mobile-menu-btn {
  display: none;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--white);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
  transition: var(--transition);
}

.mobile-menu-btn:hover,
.mobile-menu-btn:focus {
  background: rgba(255, 255, 255, 0.18);
  outline: none;
}

/* -------------------------------------------------------------
   4. PÁGINA DE INICIO (INDEX.HTML)
   ------------------------------------------------------------- */
.home-body {
  display: flex;
  flex-direction: column;
}

.hero {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 40px 20px;
}

.hero-card {
  text-align: center;
  max-width: 700px;
}

.hero-card h1 {
  color: var(--navy-dark);
  font-size: clamp(1.8rem, 5vw, 3.4rem);
  margin: 0 0 16px;
  line-height: 1.2;
}

.hero-card p {
  color: var(--muted);
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  margin-bottom: 28px;
}

.footer {
  text-align: center;
  padding: 18px;
  color: var(--muted);
  font-size: 0.9rem;
}

/* -------------------------------------------------------------
   5. LOGIN Y TARJETAS GENERALES
   ------------------------------------------------------------- */
.center-page {
  min-height: calc(100vh - var(--topbar-height));
  display: grid;
  place-items: center;
  padding: 32px 16px;
}

.form-card,
.panel-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.form-card {
  width: min(440px, 100%);
  padding: 28px;
}

.form-card h1,
.panel-card h2,
.content h1 {
  margin-top: 0;
  color: var(--navy-dark);
}

.login-card .btn {
  margin-top: 8px;
}

.demo-box {
  margin-top: 20px;
  padding: 12px 14px;
  background: var(--blue-light);
  border-radius: 6px;
  border-left: 4px solid var(--blue);
  font-size: 0.9rem;
  display: grid;
  gap: 4px;
}

/* -------------------------------------------------------------
   6. ESTRUCTURA Y MENÚ LATERAL (SIDEBAR DE ALTURA CONSTANTE)
   ------------------------------------------------------------- */
.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: calc(100vh - var(--topbar-height));
  align-items: start;
}

/*
  El sidebar se mantiene pegado (sticky) al topbar con altura fija
  exactamente igual a (100vh - topbar). El botón logout tiene margin-top: auto
  lo que garantiza que quede siempre visible al pie sin importar el scroll.
*/
.sidebar {
  background: #e9eef2;
  border-right: 1px solid var(--line);
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: var(--topbar-height);
  height: calc(100vh - var(--topbar-height));
  overflow-y: auto;
  box-sizing: border-box;
}

.sidebar a,
.nav-button {
  padding: 12px 20px;
  border: 0;
  background: transparent;
  text-align: left;
  color: #314451;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  transition: var(--transition);
  border-left: 4px solid transparent;
}

.sidebar a:hover,
.nav-button:hover {
  background: #dce4eb;
  color: var(--navy);
}

.sidebar a.active {
  background: var(--navy);
  color: var(--white);
  border-left-color: var(--blue);
}

/*
  margin-top: auto empuja el botón "Cerrar sesión" hacia el pie
  del sidebar de altura fija.
*/
.nav-button {
  width: 100%;
  margin-top: auto;
  border-top: 1px solid var(--line);
  color: var(--danger);
  font-weight: 600;
  padding-top: 14px;
  padding-bottom: 14px;
}

.nav-button:hover {
  background: var(--danger-bg);
  color: var(--danger);
}

/* Estilos de barra de desplazamiento para el sidebar */
.sidebar::-webkit-scrollbar {
  width: 5px;
}
.sidebar::-webkit-scrollbar-thumb {
  background: #c2cbd2;
  border-radius: 4px;
}

/* -------------------------------------------------------------
   7. CONTENIDO PRINCIPAL
   ------------------------------------------------------------- */
.content {
  padding: 28px;
  min-width: 0;
}

.page-title-row,
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title-row h1 {
  margin-bottom: 4px;
}

.muted {
  color: var(--muted);
  margin: 0;
}

.panel-card {
  padding: 24px;
  margin-bottom: 24px;
}

/* -------------------------------------------------------------
   8. INDICADORES DEL DASHBOARD
   ------------------------------------------------------------- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card span {
  display: block;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  color: var(--navy-dark);
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1;
}

/* -------------------------------------------------------------
   9. BOTONES
   ------------------------------------------------------------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 9px 18px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-primary {
  background: var(--navy);
  color: var(--white);
}

.btn-primary:hover {
  background: var(--navy-dark);
}

.btn-secondary {
  background: var(--blue);
  color: var(--white);
}

.btn-secondary:hover {
  background: var(--blue-hover);
}

.btn-light {
  background: var(--white);
  border-color: var(--line);
  color: var(--text);
}

.btn-light:hover {
  background: #f8f9fa;
  border-color: #c0cad3;
}

.btn-danger {
  background: var(--white);
  border-color: #eabcb9;
  color: var(--danger);
  padding: 6px 12px;
  min-height: 36px;
  font-size: 0.88rem;
}

.btn-danger:hover {
  background: var(--danger-bg);
  border-color: var(--danger);
}

.full {
  width: 100%;
}

/* -------------------------------------------------------------
   10. FORMULARIOS
   ------------------------------------------------------------- */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--navy-dark);
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #b8c4cc;
  border-radius: 6px;
  padding: 10px 12px;
  background: #ffffff;
  color: var(--text);
  transition: var(--transition);
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(45, 120, 184, 0.18);
}

.error {
  min-height: 16px;
  color: var(--danger);
  font-size: 0.82rem;
  font-weight: 500;
}

.form-message {
  min-height: 20px;
  margin: 8px 0 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.form-message.ok {
  color: var(--success);
}

.form-message.bad {
  color: var(--danger);
}

.grid-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.span-2 {
  grid-column: span 2;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.hidden {
  display: none !important;
}

.filter-row {
  margin-bottom: 18px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

/* -------------------------------------------------------------
   11. TABLAS Y RESULTADOS
   ------------------------------------------------------------- */
.table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--line);
  border-radius: 6px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

th,
td {
  padding: 13px 14px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}

th {
  background: #edf2f6;
  color: var(--navy-dark);
  font-size: 0.88rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

td {
  font-size: 0.93rem;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background-color: rgba(45, 120, 184, 0.03);
}

.empty-row {
  text-align: center;
  color: var(--muted);
  padding: 30px;
  font-style: italic;
}

/* -------------------------------------------------------------
   12. BADGES Y ESTADOS
   ------------------------------------------------------------- */
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  background: #edf2f6;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge.confirmado {
  background: var(--success-bg);
  color: var(--success);
}

.badge.pendiente {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.badge.cancelado {
  background: var(--danger-bg);
  color: var(--danger);
}

/* -------------------------------------------------------------
   13. AGENDA MÉDICA
   ------------------------------------------------------------- */
.agenda-grid {
  display: grid;
  gap: 12px;
}

.agenda-slot {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  transition: var(--transition);
}

.agenda-slot.free {
  background: #f8fbfd;
  border-left: 4px solid var(--blue);
}

.agenda-slot.busy {
  background: var(--warning-bg);
  border-left: 4px solid #d4a017;
}

.slot-state {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* =============================================================
   14. RESPONSIVE - TABLETS Y TELÉFONOS (MENÚ Y LAYOUT)
   ============================================================= */
@media (max-width: 768px) {

  /* Muestra el botón del menú en la barra superior */
  .mobile-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .app-layout {
    grid-template-columns: 1fr;
    display: block;
  }

  /*
    El menú sidebar en móvil funciona como un panel desplegable
    con altura constante fijada exactamente a calc(100vh - topbar).
    El botón de cerrar sesión queda siempre abajo del panel.
  */
  .sidebar {
    position: fixed;
    top: var(--topbar-height);
    left: 0;
    right: 0;
    width: 100%;
    height: calc(100vh - var(--topbar-height));
    z-index: 999;
    background: #e9eef2;
    display: flex;
    flex-direction: column;
    padding: 12px 0 20px;
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: transform 0.25s ease-in-out, opacity 0.25s ease-in-out, visibility 0.25s;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    border-right: none;
    border-bottom: 2px solid var(--line);
  }

  .app-layout.menu-open .sidebar,
  .sidebar.open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .sidebar a,
  .nav-button {
    padding: 16px 24px;
    font-size: 1.05rem;
    border-left: none;
    border-bottom: 1px solid var(--line);
  }

  .nav-button {
    margin-top: auto;
    border-top: 2px solid var(--line);
    border-bottom: none;
    background: var(--white);
  }

  .content {
    padding: 20px 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
  }

  .page-title-row,
  .section-title {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .page-title-row .btn,
  .section-title .btn {
    width: 100%;
  }

  .grid-form,
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .span-2 {
    grid-column: span 1;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 10px;
  }

  .form-actions .btn {
    width: 100%;
  }
}

/* =============================================================
   15. RESPONSIVE - PANTALLAS PEQUEÑAS (TELÉFONOS < 520px)
   ============================================================= */
@media (max-width: 520px) {

  .topbar {
    padding: 0 14px;
  }

  .brand {
    font-size: 1rem;
  }

  .screen-code {
    display: none;
  }

  .content {
    padding: 16px 12px;
  }

  .form-card,
  .panel-card {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .agenda-slot {
    grid-template-columns: 75px 1fr;
    gap: 8px 12px;
    padding: 12px;
  }

  .slot-state {
    grid-column: 1 / -1;
    justify-self: flex-start;
    margin-top: 2px;
  }
}

/* =============================================================
   16. NOTIFICACIONES FLOTANTES (TOASTS)
   ============================================================= */
.toast-container {
  position: fixed;
  top: calc(var(--topbar-height) + 16px);
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 380px;
  width: calc(100% - 40px);
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  background: var(--white);
  border-radius: 8px;
  padding: 14px 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 5px solid var(--blue);
  animation: toastSlideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
  opacity: 1;
  transform: translateX(0);
  transition: opacity 0.35s ease, transform 0.35s ease;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text);
}

.toast.hide {
  opacity: 0;
  transform: translateX(120%);
}

.toast.ok {
  border-left-color: var(--success);
  background: #f2f9f4;
  color: #1b532d;
}

.toast.bad {
  border-left-color: var(--danger);
  background: #fdf3f3;
  color: #821c15;
}

.toast-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.toast.ok .toast-icon {
  background: var(--success);
  color: var(--white);
}

.toast.bad .toast-icon {
  background: var(--danger);
  color: var(--white);
}

.toast.info .toast-icon {
  background: var(--blue);
  color: var(--white);
}

.toast-text {
  flex: 1;
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: var(--transition);
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text);
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(120%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 520px) {
  .toast-container {
    top: calc(var(--topbar-height) + 10px);
    right: 12px;
    left: 12px;
    max-width: none;
    width: auto;
  }
}
```

## File: js/common.js
```javascript
/* =============================================================
   common.js
   -------------------------------------------------------------
   Contiene lógica compartida por todas las pantallas privadas:
   - Verificar si existe una sesión iniciada.
   - Cerrar sesión.
   - Funciones auxiliares para mostrar nombres y estados.
   ============================================================= */

(function () {

  /* -----------------------------------------------------------
     CONTROL BÁSICO DE SESIÓN
     -----------------------------------------------------------
     Cuando el Login es correcto se guarda en sessionStorage una
     clave llamada saludturnos_user.

     sessionStorage se mantiene mientras la pestaña del navegador
     permanezca abierta.
  ----------------------------------------------------------- */
  const logged = sessionStorage.getItem('saludturnos_user');

  // Si no hay sesión, el usuario vuelve a la pantalla de Login.
  if (!logged) {
    window.location.href = 'login.html';
    return;
  }

  /* -----------------------------------------------------------
     CIERRE DE SESIÓN
     ----------------------------------------------------------- */
  const logoutBtn = document.getElementById('logoutBtn');

  // Se comprueba que el botón exista antes de agregar el evento.
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {

      // Se elimina la sesión actual.
      sessionStorage.removeItem('saludturnos_user');

      // Se redirige al Login.
      window.location.href = 'login.html';
    });
  }

  /* -----------------------------------------------------------
     MENÚ RESPONSIVE MÓVIL / TABLET
     -----------------------------------------------------------
     Permite abrir y cerrar el panel lateral (sidebar) en pantallas
     pequeñas mediante el botón de menú hamburguesa.
  ----------------------------------------------------------- */
  function initMobileMenu() {
    const topbar = document.querySelector('.topbar');
    const appLayout = document.querySelector('.app-layout');
    const sidebar = document.querySelector('.sidebar');

    if (!topbar || !sidebar || !appLayout) {
      return;
    }

    // Si el botón no existe en el HTML, se crea dinámicamente.
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

    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    // Cierra el menú al hacer clic en cualquier opción
    sidebar.querySelectorAll('a, .nav-button').forEach(function (element) {
      element.addEventListener('click', function () {
        if (appLayout.classList.contains('menu-open')) {
          toggleMenu();
        }
      });
    });

    // Cierra el menú al hacer clic fuera
    document.addEventListener('click', function (e) {
      if (appLayout.classList.contains('menu-open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        toggleMenu();
      }
    });

    // Restablece estado al agrandar la ventana
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768 && appLayout.classList.contains('menu-open')) {
        appLayout.classList.remove('menu-open');
        sidebar.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = '☰';
        document.body.style.overflow = '';
      }
    });
  }

  // Inicializa el menú cuando el DOM está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }

  /* -----------------------------------------------------------
     FUNCIONES AUXILIARES COMPARTIDAS
     -----------------------------------------------------------
     Se agrupan dentro de AppHelpers para reutilizarlas desde
     dashboard.js, turnos.js y agenda.js.
  ----------------------------------------------------------- */
  window.AppHelpers = window.AppHelpers || {};

  Object.assign(window.AppHelpers, {
    // Devuelve el nombre completo de un paciente.
    patientName(patient) {
      if (!patient) {
        return 'Paciente no disponible';
      }

      return `${patient.nombre} ${patient.apellido}`;
    },

    // Devuelve el nombre de un profesional.
    doctorName(doctor) {
      if (!doctor) {
        return 'Profesional no disponible';
      }

      return doctor.name;
    },

    /*
      Devuelve un fragmento HTML para representar visualmente
      el estado de un turno mediante una etiqueta (badge).
    */
    statusBadge(status) {
      const cssClass = status.toLowerCase().replaceAll(' ', '-');
      return `<span class="badge ${cssClass}">${status}</span>`;
    }
  });

})();
```

## File: js/data.js
```javascript
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

  /* -----------------------------------------------------------
     SISTEMA DE NOTIFICACIONES FLOTANTES (TOASTS) EN APPHELPERS
     -----------------------------------------------------------
     AppHelpers proporciona utilidades globales a la aplicación.
     Aquí se define `AppHelpers.showToast`, encargado de renderizar
     mensajitos flotantes en la esquina superior derecha.
  ----------------------------------------------------------- */
  window.AppHelpers = window.AppHelpers || {};

  /*  Muestra un mensaje emergente (Toast) en la esquina superior derecha.
  
  El texto explicativo de la notificación.
  El tipo de notificación: 'ok' / 'success' (verde), 'bad' / 'error' (rojo), o 'info' (azul).
  Tiempo en milisegundos antes de ocultar automáticamente (por defecto 5000ms / 5s).
  ----------------------------------------------------------- */

  window.AppHelpers.showToast = function (message, type = 'info', duration = 5000) {
    if (!message) return;

    // Crea o recupera el contenedor flotante #toastContainer en el DOM
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // Determina el estilo visual (ok / bad / info) e icono correspondiente
    const isOk = type === 'ok' || type === 'success';
    const isBad = type === 'bad' || type === 'error' || type === 'danger';
    const toastClass = isOk ? 'ok' : isBad ? 'bad' : 'info';
    const icon = isOk ? '✓' : isBad ? '✕' : 'ℹ';

    // Genera el elemento HTML de la notificación emergente
    const toast = document.createElement('div');
    toast.className = `toast ${toastClass}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
      <button class="toast-close" aria-label="Cerrar notificación">&times;</button>
    `;

    container.appendChild(toast);

    // Función encargada de animar la salida y remover el elemento del DOM
    let isClosing = false;
    function removeToast() {
      if (isClosing) return;
      isClosing = true;
      toast.classList.add('hide');
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 350);
    }

    // Permite al usuario cerrar la notificación manualmente antes de los 5s
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', removeToast);
    }

    // Temporizador automático de 5 segundos (5000ms) para ocultar la notificación
    setTimeout(removeToast, duration);
  };

  /**
   * Observador de mensajes de formulario (MutationObserver).
   * 
   * Detecta cuando scripts como turnos.js, pacientes.js o login.js escriben
   * en elementos como #turnMessage, #patientMessage o #loginMessage.
   * Oculta el elemento estático original y dispara automáticamente
   * la notificación flotante emergente con el mensaje y tipo correspondiente.
   */
  function initToastObserver() {
    const messageElements = document.querySelectorAll('.form-message, #turnMessage, #patientMessage, #loginMessage');

    messageElements.forEach(function (el) {
      // Oculta el mensaje estático para que la notificación sea 100% flotante
      el.style.display = 'none';

      // Observador de cambios en el texto o clases del elemento de mensaje
      const observer = new MutationObserver(function () {
        const text = el.textContent.trim();
        if (text) {
          const isOk = el.classList.contains('ok');
          const isBad = el.classList.contains('bad');
          const type = isOk ? 'ok' : isBad ? 'bad' : 'info';

          // Invoca la función flotante con el mensaje y tipo detectado
          window.AppHelpers.showToast(text, type, 5000);
        }
      });

      // Configura el observer para escuchar cambios de texto, hijos y atributos (clases)
      observer.observe(el, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    });
  }

  // Inicializa el observador automáticamente al cargar la página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToastObserver);
  } else {
    initToastObserver();
  }

})();
```
