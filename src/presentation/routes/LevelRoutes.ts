import { Router } from 'express';
import { type LevelController } from '../controllers/LevelController.js';
import { type AuthMiddleware } from '../middlewares/AuthMiddleware.js';
import { RequireRoleMiddleware } from '../middlewares/RequireRoleMiddleware.js';

export class LevelRoutes {
  /**
   * Mapea los endpoints HTTP a los métodos del controlador.
   */
  public static create(controller: LevelController, authMiddleware: AuthMiddleware): Router {
    const router = Router();

    // ─────────────────────────────────────────────
    // Endpoints Públicos (Clientes / Motor del Juego)
    // ─────────────────────────────────────────────
    router.get('/', controller.getAll);
    router.get('/bulk', controller.getBulk);
    router.get('/:id', controller.getById);

    // ─────────────────────────────────────────────
    // Endpoints Protegidos (Gestión de Administrador - RBAC)
    // ─────────────────────────────────────────────
    router.post(
      '/',
      (req, res, next) => authMiddleware.execute(req, res, next),
      RequireRoleMiddleware.create('ADMIN'),
      controller.create
    );

    router.put(
      '/:id',
      (req, res, next) => authMiddleware.execute(req, res, next),
      RequireRoleMiddleware.create('ADMIN'),
      controller.update
    );

    return router;
  }
}