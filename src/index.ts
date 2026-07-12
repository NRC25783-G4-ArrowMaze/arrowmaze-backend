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
  // Si no existe la variable, usamos un array con los entornos locales
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : [
        'http://localhost:5173',     // Tu frontend web en desarrollo (Vite)
        'http://localhost',          // Capacitor en Android
        'capacitor://localhost'      // Capacitor en iOS
      ];

  // 2. Configuración del middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (ej: Postman) o que estén en la lista
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por políticas de CORS (Origen no válido)'));
      }
    }
  }));
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

    // Advertencia visible: con el bypass activo el login ignora las credenciales
    // y TODAS las sesiones se resuelven como 'local-dev' (rol ADMIN), sin
    // aislamiento por usuario. Evita confundir una prueba local con una
    // validación de auth real. El bypass ya se ignora si NODE_ENV=production.
    if (process.env.LEVELS_SKIP_ROLE_CHECK === 'true' && process.env.NODE_ENV !== 'production') {
      console.warn(`
⚠️  AUTH BYPASS ACTIVO (LEVELS_SKIP_ROLE_CHECK=true)
    El login NO valida credenciales: todas las sesiones se resuelven como
    'local-dev' con rol ADMIN y el progreso NO se aísla por usuario.
    Solo para desarrollo local. Apágalo para probar auth/aislamiento reales.
      `);
    }
  });
}

bootstrap().catch((error) => {
  console.error('Error fatal al arrancar la aplicación:', error);
  process.exit(1);
});