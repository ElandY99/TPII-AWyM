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
