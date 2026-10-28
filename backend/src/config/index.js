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
  frontendDir: path.resolve(rootDir, 'frontend'),
  cssDir: path.resolve(rootDir, 'frontend/css'),
  jsDir: path.resolve(rootDir, 'frontend/js'),
  scrypt: {
    n: 16384,
    r: 8,
    p: 1,
    keyLen: 64
  }
};
