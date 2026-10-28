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
