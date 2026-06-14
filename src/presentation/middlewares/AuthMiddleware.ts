import { type Request, type Response, type NextFunction } from 'express';
import { type ITokenService } from '../../application/ports/ITokenService';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository';

declare global {
  namespace Express {
    interface Request {
      // Usamos accountId para mantener consistencia con nuestras entidades, 
      // equivalente al "userId" mencionado en el BDD.
      accountId?: string; 
    }
  }
}

export class AuthMiddleware {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: ISessionRepository
  ) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      // Escenario: rechazo de petición por falta de token
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: missing token' });
        return;
      }

      const token = authHeader.split(' ')[1];
      let payload;

      try {
        payload = await this.tokenService.verify(token);
      } catch (error: any) {
        // Mapeo específico de errores para cumplir con el Bloque 1 y 2
        if (error.cause?.name === 'TokenExpiredError') {
          res.status(401).json({ error: 'TokenExpiredError: session has expired' });
          return;
        }
        // Escenario: rechazo por firma inválida o token manipulado
        res.status(401).json({ error: 'Unauthorized: invalid token signature' });
        return;
      }

      // Escenario: rechazo de acceso usando un token revocado (Blacklist)
      const isRevoked = await this.sessionRepository.isRevoked(payload.jti);
      if (isRevoked) {
        res.status(403).json({ error: 'Forbidden: token has been revoked' });
        return;
      }

      // Inyección del identificador para el controlador
      req.accountId = payload.accountId;
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error during authentication', details: error });
    }
  };
}