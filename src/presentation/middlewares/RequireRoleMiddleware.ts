import { type Request, type Response, type NextFunction } from 'express';
import { type UserRole } from '../../domain/entities/Account.js';

export class RequireRoleMiddleware {
  /**
   * Genera un middleware de Express configurado para validar un rol específico.
   */
  public static create(requiredRole: UserRole) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.userRole || req.userRole !== requiredRole) {
        res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        return;
      }
      next();
    };
  }
}