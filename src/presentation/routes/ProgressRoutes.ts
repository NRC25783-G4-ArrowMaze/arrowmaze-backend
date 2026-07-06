import { Router } from 'express';
import { type ProgressController } from '../controllers/ProgressController.js';
import { type AuthMiddleware } from '../middlewares/AuthMiddleware.js';

export class ProgressRoutes {
  public static create(controller: ProgressController, authMiddleware: AuthMiddleware): Router {
    const router = Router();

    // ─────────────────────────────────────────────
    // Seguridad Global: Todas las operaciones de progreso requieren autenticación
    // ─────────────────────────────────────────────
    router.use((req, res, next) => authMiddleware.execute(req, res, next));

    // Endpoints
    router.post('/', controller.save);
    router.get('/', controller.getAll);
    router.get('/:levelId', controller.getByLevel);

    return router;
  }
}