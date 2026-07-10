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

    /**
     * @openapi
     * /levels:
     *   get:
     *     tags: [Levels]
     *     summary: Catálogo de metadatos de niveles
     *     parameters:
     *       - in: query
     *         name: difficulty
     *         schema:
     *           type: string
     *         required: false
     *         description: Filtra el catálogo por dificultad
     *     responses:
     *       200:
     *         description: Lista de metadatos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/LevelMetadata'
     */
    router.get('/', controller.getAll);

    /**
     * @openapi
     * /levels/bulk:
     *   get:
     *     tags: [Levels]
     *     summary: Todas las definiciones completas (sincronización masiva)
     *     responses:
     *       200:
     *         description: Lista de definiciones completas
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/LevelData'
     */
    router.get('/bulk', controller.getBulk);

    /**
     * @openapi
     * /levels/{id}:
     *   get:
     *     tags: [Levels]
     *     summary: Definición completa de un nivel
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *     responses:
     *       200:
     *         description: Definición del nivel
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LevelData'
     *       404:
     *         description: Nivel no encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/:id', controller.getById);

    // ─────────────────────────────────────────────
    // Endpoints Protegidos (Gestión de Administrador - RBAC)
    // ─────────────────────────────────────────────

    /**
     * @openapi
     * /levels:
     *   post:
     *     tags: [Levels]
     *     summary: Publica un nivel nuevo (solo ADMIN)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LevelData'
     *     responses:
     *       201:
     *         description: Nivel creado; devuelve el id asignado
     *       400:
     *         description: Payload inválido
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Token ausente, inválido o revocado
     *       403:
     *         description: Rol insuficiente (requiere ADMIN)
     *       409:
     *         description: El nivel ya existe
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
      '/',
      (req, res, next) => authMiddleware.execute(req, res, next),
      RequireRoleMiddleware.create('ADMIN'),
      controller.create
    );

    /**
     * @openapi
     * /levels/{id}:
     *   put:
     *     tags: [Levels]
     *     summary: Sobrescribe un nivel existente (solo ADMIN)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LevelData'
     *     responses:
     *       200:
     *         description: Nivel actualizado
     *       400:
     *         description: Payload inválido
     *       401:
     *         description: Token ausente, inválido o revocado
     *       403:
     *         description: Rol insuficiente (requiere ADMIN)
     *       404:
     *         description: Nivel no encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.put(
      '/:id',
      (req, res, next) => authMiddleware.execute(req, res, next),
      RequireRoleMiddleware.create('ADMIN'),
      controller.update
    );

    return router;
  }
}
