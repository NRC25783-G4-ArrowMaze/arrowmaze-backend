import { Router } from 'express';

// Interfaces
import { type ILevelRepository } from '../../domain/repositories/ILevelRepository';
import { type IProgressRepository } from '../../domain/repositories/IProgressRepository';
import { type IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { type ITokenService } from '../../application/ports/ITokenService';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository';

// Infraestructura
import { JsonLevelRepository } from '../../infrastructure/repositories/JsonLevelRepository';
import { JsonProgressRepository } from '../../infrastructure/repositories/JsonProgressRepository';
import { JsonAccountRepository } from '../../infrastructure/repositories/JsonAccountRepository';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { JsonSessionRepository } from '../../infrastructure/repositories/JsonSessionRepository';

// Aplicación y Presentación
import { GetLevelLeaderboard } from '../../application/use-cases/GetLevelLeaderboard';
import { LeaderboardController } from '../../presentation/controllers/LeaderboardController';
import { LeaderboardRoutes } from '../../presentation/routes/LeaderboardRoutes';
import { AuthMiddleware } from '../../presentation/middlewares/AuthMiddleware';

export class LeaderboardModuleFactory {
  /**
   * Construye y devuelve el Router de Express completamente ensamblado.
   */
  public static createRouter(): Router {
    // 1. Dependencias de Seguridad Compartidas
    const jwtSecret: string = process.env.JWT_SECRET || 'super_secreta_clave_desarrollo_academico';
    const tokenService: ITokenService = new JwtTokenService(jwtSecret);
    const sessionRepository: ISessionRepository = new JsonSessionRepository();
    const authMiddleware: AuthMiddleware = new AuthMiddleware(tokenService, sessionRepository);

    // 2. Repositorios de Infraestructura
    const levelRepository: ILevelRepository = new JsonLevelRepository();
    const progressRepository: IProgressRepository = new JsonProgressRepository();
    const accountRepository: IAccountRepository = new JsonAccountRepository();

    // 3. Caso de Uso
    const getLevelLeaderboard = new GetLevelLeaderboard(
      levelRepository,
      progressRepository,
      accountRepository
    );

    // 4. Controlador
    const controller = new LeaderboardController(getLevelLeaderboard);

    // 5. Ensamblaje de Rutas
    const router: Router = LeaderboardRoutes.create(controller, authMiddleware);

    return router;
  }
}