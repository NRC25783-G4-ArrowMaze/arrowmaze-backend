import { Router } from 'express';

// Interfaces y Dependencias de Nivel
import { type ILevelRepository } from '../../domain/repositories/ILevelRepository';
import { JsonLevelRepository } from '../../infrastructure/repositories/JsonLevelRepository';
import { GetLevels } from '../../application/use-cases/GetLevels';
import { ManageLevel } from '../../application/use-cases/ManageLevel';
import { LevelController } from '../../presentation/controllers/LevelController';
import { LevelRoutes } from '../../presentation/routes/LevelRoutes';

// Interfaces y Dependencias de Seguridad (Importadas para proteger las rutas)
import { type ITokenService } from '../../application/ports/ITokenService';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { JsonSessionRepository } from '../../infrastructure/repositories/JsonSessionRepository';
import { AuthMiddleware } from '../../presentation/middlewares/AuthMiddleware';


export class LevelModuleFactory {
  /**
   * Construye y devuelve el Router de Express completamente autónomo.
   */
  public static createRouter(): Router {
    // 1. Dependencias Compartidas (Seguridad)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está configurado. Defínelo como variable de entorno.');
    }
    const tokenService: ITokenService = new JwtTokenService(jwtSecret);
    const sessionRepository: ISessionRepository = new JsonSessionRepository();
    const authMiddleware: AuthMiddleware = new AuthMiddleware(tokenService, sessionRepository);

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