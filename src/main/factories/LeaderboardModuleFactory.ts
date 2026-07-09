import { Router } from 'express';

// Interfaces
import { type ILevelRepository } from '../../domain/repositories/ILevelRepository.js';
import { type IProgressRepository } from '../../domain/repositories/IProgressRepository.js';
import { type IAccountRepository } from '../../domain/repositories/IAccountRepository.js';

// Infraestructura
import { JsonLevelRepository } from '../../infrastructure/repositories/JsonLevelRepository.js';
import { JsonProgressRepository } from '../../infrastructure/repositories/JsonProgressRepository.js';
import { JsonAccountRepository } from '../../infrastructure/repositories/JsonAccountRepository.js';

// Aplicación y Presentación
import { GetLevelLeaderboard } from '../../application/use-cases/GetLevelLeaderboard.js';
import { CompetitiveRankingStrategy } from '../../domain/services/CompetitiveRankingStrategy.js';
import { LeaderboardController } from '../../presentation/controllers/LeaderboardController.js';
import { LeaderboardRoutes } from '../../presentation/routes/LeaderboardRoutes.js';

// Seguridad compartida
import { SharedSecurityFactory } from './SharedSecurityFactory.js';

export class LeaderboardModuleFactory {
  /**
   * Construye y devuelve el Router de Express completamente ensamblado.
   */
  public static createRouter(): Router {
    // 1. Dependencias de Seguridad Compartidas (sin secretos hardcodeados:
    // JWT_SECRET es obligatorio y se valida en SharedSecurityFactory)
    const authMiddleware = SharedSecurityFactory.getAuthMiddleware();

    // 2. Repositorios de Infraestructura
    const levelRepository: ILevelRepository = new JsonLevelRepository();
    const progressRepository: IProgressRepository = new JsonProgressRepository();
    const accountRepository: IAccountRepository = new JsonAccountRepository();

    // 3. Caso de Uso
    const getLevelLeaderboard = new GetLevelLeaderboard(
      levelRepository,
      progressRepository,
      accountRepository,
      new CompetitiveRankingStrategy()
    );

    // 4. Controlador
    const controller = new LeaderboardController(getLevelLeaderboard);

    // 5. Ensamblaje de Rutas
    const router: Router = LeaderboardRoutes.create(controller, authMiddleware);

    return router;
  }
}