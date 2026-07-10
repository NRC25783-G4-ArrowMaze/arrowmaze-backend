import { Router } from 'express';

// Interfaces
import { type IProgressRepository } from '../../domain/repositories/IProgressRepository.js';
import { type ILevelRepository } from '../../domain/repositories/ILevelRepository.js';

// Infraestructura
import { JsonProgressRepository } from '../../infrastructure/repositories/JsonProgressRepository.js';
import { JsonLevelRepository } from '../../infrastructure/repositories/JsonLevelRepository.js';

// Casos de Uso
import { GetProgress } from '../../application/use-cases/GetProgress.js';
import { SaveProgress } from '../../application/use-cases/SaveProgress.js';

// Presentación
import { ProgressController } from '../../presentation/controllers/ProgressController.js';
import { ProgressRoutes } from '../../presentation/routes/ProgressRoutes.js';

// Seguridad compartida
import { SharedSecurityFactory } from './SharedSecurityFactory.js';

export class ProgressModuleFactory {
  /**
   * Construye y devuelve el Router de Express completamente ensamblado.
   */
  public static createRouter(): Router {
    // 1. Dependencias de Seguridad Compartidas
    const authMiddleware = SharedSecurityFactory.getAuthMiddleware();

    // 2. Repositorios
    const progressRepository: IProgressRepository = new JsonProgressRepository();
    // Reutilizamos el repositorio de niveles para la validación de integridad
    const levelRepository: ILevelRepository = new JsonLevelRepository(); 

    // 3. Casos de Uso
    const getProgress: GetProgress = new GetProgress(progressRepository);
    const saveProgress: SaveProgress = new SaveProgress(progressRepository, levelRepository);

    // 4. Controladores
    const controller: ProgressController = new ProgressController(getProgress, saveProgress);

    // 5. Ensamblaje de Rutas
    const router: Router = ProgressRoutes.create(controller, authMiddleware);

    return router;
  }
}