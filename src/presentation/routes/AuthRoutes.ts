import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';

export class AuthRoutes {
  public static create(
    authController: AuthController,
    authMiddleware: AuthMiddleware
  ): Router {
    const router = Router();

    /**
     * @openapi
     * /auth/register:
     *   post:
     *     tags: [Auth]
     *     summary: Registro de cuenta (email + password)
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterRequest'
     *     responses:
     *       201:
     *         description: Cuenta creada
     *       400:
     *         description: Email o password inválidos
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       409:
     *         description: El email ya está registrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/register', authController.register.bind(authController));

    /**
     * @openapi
     * /auth/login:
     *   post:
     *     tags: [Auth]
     *     summary: Login; devuelve JWT (7 días)
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Autenticación correcta
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LoginResponse'
     *       400:
     *         description: Payload inválido
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Credenciales incorrectas
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/login', authController.login.bind(authController));

    /**
     * @openapi
     * /auth/logout:
     *   post:
     *     tags: [Auth]
     *     summary: Revoca el token actual (blacklist por jti)
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Sesión cerrada
     *       401:
     *         description: Token ausente, inválido o revocado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
      '/logout',
      (req, res, next) => authMiddleware.execute(req, res, next),
      authController.logout.bind(authController)
    );

    return router;
  }
}
