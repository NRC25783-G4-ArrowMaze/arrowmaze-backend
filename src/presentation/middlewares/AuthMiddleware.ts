import { type Request, type Response, type NextFunction } from 'express';
import { type ITokenService } from '../../application/ports/ITokenService.js';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository.js';

export class AuthMiddleware {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: ISessionRepository
  ) {}

  public async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    // ⚠️ Bypass SOLO para desarrollo local: con LEVELS_SKIP_ROLE_CHECK=true se omite
    // la autenticación por completo y se inyecta una identidad ADMIN falsa (permite
    // que forge cree/edite mapas sin iniciar sesión). Por defecto —sin la variable—
    // la autenticación normal sigue activa. NO desplegar en entornos compartidos/producción.
    if (process.env.LEVELS_SKIP_ROLE_CHECK === 'true') {
      req.accountId = 'local-dev';
      req.userRole = 'ADMIN';
      next();
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: missing token' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const payload = await this.tokenService.verify(token);

      const isRevoked = await this.sessionRepository.isRevoked(payload.jti);
      if (isRevoked) {
        res.status(403).json({ error: 'Forbidden: token has been revoked' });
        return;
      }

      // Inyección limpia y tipada de credenciales en la petición
      req.accountId = payload.accountId;
      req.userRole = payload.role;

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('jwt expired')) {
        res.status(401).json({ error: 'TokenExpiredError: session has expired' });
        return;
      }
      res.status(401).json({ error: 'Unauthorized: invalid token signature' });
    }
  }
}