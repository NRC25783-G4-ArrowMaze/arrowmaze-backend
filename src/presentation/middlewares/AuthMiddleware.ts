import { type Request, type Response, type NextFunction } from 'express';
import { type ITokenService } from '../../application/ports/ITokenService';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository';

// Extendemos la interfaz Request de Express para inyectar el accountId
declare global {
  namespace Express {
    interface Request {
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
      
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'AuthError: session token is missing' });
        return;
      }

      const token = authHeader.split(' ')[1];

      // 1. Verificación matemática y de tiempo
      const payload = await this.tokenService.verify(token);

      // 2. Verificación de revocación (Blacklist)
      const isRevoked = await this.sessionRepository.isRevoked(payload.jti);
      if (isRevoked) {
        res.status(401).json({ error: 'AuthError: session token is invalid or has been revoked' });
        return;
      }

      // 3. Inyectar el ID de la cuenta para que el siguiente controlador lo use
      req.accountId = payload.accountId;
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'AuthError: session token is invalid or has been revoked', details: error });
    }
  };
}