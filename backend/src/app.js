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

  // Servir frontend unificado (HTMLs, estilos en css/, scripts en js/)
  app.use(express.static(config.frontendDir));

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
