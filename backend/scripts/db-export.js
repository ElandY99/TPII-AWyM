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
