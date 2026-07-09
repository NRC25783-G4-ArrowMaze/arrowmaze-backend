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

    /**
     * @openapi
     * /progress:
     *   post:
     *     tags: [Progress]
     *     summary: Guarda/actualiza el progreso del jugador en un nivel
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SaveProgressPayload'
     *     responses:
     *       200:
     *         description: Progreso consolidado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LevelProgress'
     *       400:
     *         description: Payload inválido
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Token ausente, inválido o revocado
     *       422:
     *         description: El nivel referenciado no existe en el registro
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/', controller.save);

    /**
     * @openapi
     * /progress:
     *   get:
     *     tags: [Progress]
     *     summary: Progreso del usuario autenticado en todos los niveles
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lista de progresos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/LevelProgress'
     *       401:
     *         description: Token ausente, inválido o revocado
     */
    router.get('/', controller.getAll);

    /**
     * @openapi
     * /progress/{levelId}:
     *   get:
     *     tags: [Progress]
     *     summary: Progreso del usuario autenticado en un nivel
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: levelId
     *         schema:
     *           type: string
     *         required: true
     *     responses:
     *       200:
     *         description: Progreso del nivel
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LevelProgress'
     *       401:
     *         description: Token ausente, inválido o revocado
     *       404:
     *         description: Sin progreso registrado para ese nivel
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/:levelId', controller.getByLevel);

    return router;
  }
}
