import { Router } from 'express';
import { type LeaderboardController } from '../controllers/LeaderboardController.js';
import { type AuthMiddleware } from '../middlewares/AuthMiddleware.js';

export class LeaderboardRoutes {
  public static create(controller: LeaderboardController, authMiddleware: AuthMiddleware): Router {
    const router = Router();

    // ─────────────────────────────────────────────
    // Seguridad Global (Bloque 4)
    // ─────────────────────────────────────────────
    router.use((req, res, next) => authMiddleware.execute(req, res, next));

    // Endpoints
    router.get('/:levelId', controller.getByLevel);

    return router;
  }
}