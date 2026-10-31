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
  rootDir, // raiz del proyecto
  frontendDir: path.resolve(rootDir, 'frontend'), // raíz del frontend
  cssDir: path.resolve(rootDir, 'frontend/css'),  // Estilos del frontend
  jsDir: path.resolve(rootDir, 'frontend/js'),    // js del frontend
  scrypt: {
    n: 16384,
    r: 8,
    p: 1,
    keyLen: 64
  }
};
