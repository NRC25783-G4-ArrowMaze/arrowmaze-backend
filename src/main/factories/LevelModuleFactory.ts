import { Router } from 'express';

// Interfaces y Dependencias de Nivel
import { type ILevelRepository } from '../../domain/repositories/ILevelRepository.js';
import { JsonLevelRepository } from '../../infrastructure/repositories/JsonLevelRepository.js';
import { GetLevels } from '../../application/use-cases/GetLevels.js';
import { ManageLevel } from '../../application/use-cases/ManageLevel.js';
import { LevelController } from '../../presentation/controllers/LevelController.js';
import { LevelRoutes } from '../../presentation/routes/LevelRoutes.js';

// Seguridad compartida
import { SharedSecurityFactory } from './SharedSecurityFactory.js';


export class LevelModuleFactory {
  /**
   * Construye y devuelve el Router de Express completamente autónomo.
   */
  public static createRouter(): Router {
    // 1. Dependencias Compartidas (Seguridad)
    const authMiddleware = SharedSecurityFactory.getAuthMiddleware();

    // 2. Repositorios del Dominio (Niveles)
    const levelRepository: ILevelRepository = new JsonLevelRepository();

    // 3. Casos de Uso
    const getLevels: GetLevels = new GetLevels(levelRepository);
    const manageLevel: ManageLevel = new ManageLevel(levelRepository);

    // 4. Controladores
    const levelController: LevelController = new LevelController(getLevels, manageLevel);

    // 5. Ensamblaje de Rutas
    const router: Router = LevelRoutes.create(levelController, authMiddleware);

    return router;
  }
}