import express from 'express';
import cors from 'cors';
import { AuthFactory } from './main/factories/AuthFactory.js';
import { LevelModuleFactory } from './main/factories/LevelModuleFactory.js';
import { ProgressModuleFactory } from './main/factories/ProgressModuleFactory.js';
import { LeaderboardModuleFactory } from './main/factories/LeaderboardModuleFactory.js';
import { SharedSecurityFactory } from './main/factories/SharedSecurityFactory.js';
import { BlacklistCleanupJob } from './infrastructure/jobs/BlacklistCleanup.js';

async function bootstrap() {
  const app = express();

  app.disable('x-powered-by');
  // Middlewares globales
  // CORS antes de los routers para que el preflight OPTIONS no llegue a las rutas.
  // Permisivo a propósito (dev en :5173 y Capacitor); TODO: restringir origin vía env CORS_ORIGIN en producción.
  app.use(cors());
  app.use(express.json());

  // Job en segundo plano: purga diaria de la blacklist de tokens (03:00 AM)
  const cleanupJob = new BlacklistCleanupJob(SharedSecurityFactory.getSessionRepository());
  cleanupJob.start();

  // =========================================================
  // MONTAJE DE MÓDULOS (FEATURES)
  // =========================================================
  
  // Delegamos toda la complejidad de inyección a la factoría
  app.use('/api/v1/auth', AuthFactory.createRouter());

  //Rutas de niveles
  app.use('/api/v1/levels', LevelModuleFactory.createRouter());

  //Rutas de gestión de progreso
  app.use('/api/v1/progress', ProgressModuleFactory.createRouter());

  //Rutas del leaderboard
  app.use('/api/v1/leaderboards', LeaderboardModuleFactory.createRouter());
  
  // =========================================================
  // ARRANQUE DEL SERVIDOR
  // =========================================================

  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`
🚀 Servidor levantado con éxito!
========================================
Arquitectura: Clean Architecture (Factory Pattern)
Entorno: Desarrollo
Puerto: ${PORT}
========================================
    `);
  });
}

bootstrap().catch((error) => {
  console.error('Error fatal al arrancar la aplicación:', error);
  process.exit(1);
});