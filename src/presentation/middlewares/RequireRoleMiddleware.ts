import { type Request, type Response, type NextFunction } from 'express';
import { type UserRole } from '../../domain/entities/Account.js';

export class RequireRoleMiddleware {
  /**
   * Genera un middleware de Express configurado para validar un rol específico.
   */
  public static create(requiredRole: UserRole) {
    return (req: Request, res: Response, next: NextFunction): void => {
      // ⚠️ Bypass SOLO para desarrollo local: con LEVELS_SKIP_ROLE_CHECK=true se
      // omite la verificación de rol (permite que forge cree/edite mapas sin ADMIN).
      // Por defecto —sin la variable— la validación de rol sigue activa.
      // NO activar ni desplegar en entornos compartidos/producción.
      if (process.env.LEVELS_SKIP_ROLE_CHECK === 'true') {
        next();
        return;
      }

      if (!req.userRole || req.userRole !== requiredRole) {
        res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        return;
      }
      next();
    };
  }
}