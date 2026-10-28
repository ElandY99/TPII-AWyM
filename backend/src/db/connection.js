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
