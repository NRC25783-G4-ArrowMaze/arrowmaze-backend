import express from 'express';
import { AuthFactory } from './main/factories/AuthFactory';
import { LevelModuleFactory } from './main/factories/LevelModuleFactory';
import { ProgressModuleFactory } from './main/factories/ProgressModuleFactory';

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

  //Rutas de niveles
  app.use('/api/v1/levels', LevelModuleFactory.createRouter());

  //Rutas de gestión de progreso
  app.use('/api/progress', ProgressModuleFactory.createRouter());
  
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