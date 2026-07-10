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

    /**
     * @openapi
     * /leaderboards/{levelId}:
     *   get:
     *     tags: [Leaderboards]
     *     summary: Clasificación de un nivel (top + récord del usuario)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: levelId
     *         schema:
     *           type: string
     *         required: true
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 10
     *         required: false
     *         description: Cantidad máxima de posiciones del top
     *     responses:
     *       200:
     *         description: Clasificación del nivel
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LeaderboardResponse'
     *       400:
     *         description: Límite inválido
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Token ausente, inválido o revocado
     *       404:
     *         description: Nivel no encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/:levelId', controller.getByLevel);

    return router;
  }
}
