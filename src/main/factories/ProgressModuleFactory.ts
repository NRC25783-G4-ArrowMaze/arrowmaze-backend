import { Router } from 'express';

// Interfaces
import { type IProgressRepository } from '../../domain/repositories/IProgressRepository';
import { type ILevelRepository } from '../../domain/repositories/ILevelRepository';
import { type ITokenService } from '../../application/ports/ITokenService';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository';

// Infraestructura
import { JsonProgressRepository } from '../../infrastructure/repositories/JsonProgressRepository';
import { JsonLevelRepository } from '../../infrastructure/repositories/JsonLevelRepository';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { JsonSessionRepository } from '../../infrastructure/repositories/JsonSessionRepository';

// Casos de Uso
import { GetProgress } from '../../application/use-cases/GetProgess';
import { SaveProgress } from '../../application/use-cases/SaveProgress';

// Presentación
import { ProgressController } from '../../presentation/controllers/ProgressController';
import { ProgressRoutes } from '../../presentation/routes/ProgressRoutes';
import { AuthMiddleware } from '../../presentation/middlewares/AuthMiddleware';

export class ProgressModuleFactory {
  /**
   * Construye y devuelve el Router de Express completamente ensamblado.
   */
  public static createRouter(): Router {
    // 1. Dependencias de Seguridad Compartidas
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está configurado. Defínelo como variable de entorno.');
    }
    const tokenService: ITokenService = new JwtTokenService(jwtSecret);
    const sessionRepository: ISessionRepository = new JsonSessionRepository();
    const authMiddleware: AuthMiddleware = new AuthMiddleware(tokenService, sessionRepository);

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