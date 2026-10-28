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
