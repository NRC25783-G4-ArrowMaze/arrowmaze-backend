// Interfaces (Contratos)
import { type ITokenService } from '../../application/ports/ITokenService.js';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository.js';

// Infraestructura (Implementaciones reales)
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService.js';
import { JsonSessionRepository } from '../../infrastructure/repositories/JsonSessionRepository.js';

// Presentación
import { AuthMiddleware } from '../../presentation/middlewares/AuthMiddleware.js';

/**
 * Composition Root de las dependencias de seguridad compartidas por todos
 * los módulos (auth, levels, progress, leaderboard).
 *
 * Garantiza una única instancia de cada pieza: JWT_SECRET se lee una sola
 * vez y todos los routers comparten el mismo tokenService, repositorio de
 * sesiones y middleware de autenticación.
 */
export class SharedSecurityFactory {
  private static tokenService: ITokenService | null = null;
  private static sessionRepository: ISessionRepository | null = null;
  private static authMiddleware: AuthMiddleware | null = null;

  public static getTokenService(): ITokenService {
    if (!this.tokenService) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET no está configurado. Defínelo como variable de entorno.');
      }
      this.tokenService = new JwtTokenService(jwtSecret);
    }
    return this.tokenService;
  }

  public static getSessionRepository(): ISessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new JsonSessionRepository();
    }
    return this.sessionRepository;
  }

  public static getAuthMiddleware(): AuthMiddleware {
    if (!this.authMiddleware) {
      this.authMiddleware = new AuthMiddleware(this.getTokenService(), this.getSessionRepository());
    }
    return this.authMiddleware;
  }
}
