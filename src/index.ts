import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { buildSwaggerSpec } from './main/config/swagger.js';
import { AuthFactory } from './main/factories/AuthFactory.js';
import { LevelModuleFactory } from './main/factories/LevelModuleFactory.js';
import { ProgressModuleFactory } from './main/factories/ProgressModuleFactory.js';
import { LeaderboardModuleFactory } from './main/factories/LeaderboardModuleFactory.js';
import { SharedSecurityFactory } from './main/factories/SharedSecurityFactory.js';
import { BlacklistCleanupJob } from './infrastructure/jobs/BlacklistCleanup.js';
import { errorHandlerAspect } from './infrastructure/aspects/ErrorHandlerAspect.js';
import { requestLoggingAspect } from './infrastructure/aspects/RequestLoggingAspect.js';

async function bootstrap() {
  const app = express();

  app.disable('x-powered-by');
  // Middlewares globales
  // CORS antes de los routers para que el preflight OPTIONS no llegue a las rutas.
  // Permisivo a propósito (dev en :5173 y Capacitor); TODO: restringir origin vía env CORS_ORIGIN en producción.
  app.use(cors());
  app.use(express.json());

  // Aspecto AOP: logging de peticiones HTTP (método, ruta, status, duración)
  app.use(requestLoggingAspect);

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

  // Documentación OpenAPI: spec crudo en /api/docs/json y Swagger UI en /api/docs.
  // El GET del spec va ANTES del app.use del UI para que este no lo capture.
  const swaggerSpec = buildSwaggerSpec();
  app.get('/api/docs/json', (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Aspecto AOP: manejo centralizado de excepciones (siempre después de los routers)
  app.use(errorHandlerAspect);


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