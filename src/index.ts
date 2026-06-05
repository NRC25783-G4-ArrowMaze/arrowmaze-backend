import express from 'express';
import { AuthFactory } from './main/factories/AuthFactory';

async function bootstrap() {
  const app = express();
  
  app.disable('x-powered-by');
  // Middlewares globales
  app.use(express.json());

  // =========================================================
  // MONTAJE DE MÓDULOS (FEATURES)
  // =========================================================
  
  // Delegamos toda la complejidad de inyección a la factoría
  app.use('/api/v1/auth', AuthFactory.createRouter());
  
  // En el futuro, añadir nuevos módulos será así de simple:
  // app.use('/api/v1/users', UserFactory.createRouter());
  // app.use('/api/v1/projects', ProjectFactory.createRouter());

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