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
