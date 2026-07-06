import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';

export class AuthRoutes {
  public static create(
    authController: AuthController,
    authMiddleware: AuthMiddleware
  ): Router {
    const router = Router();

    // Rutas públicas
    router.post('/register', authController.register.bind(authController));
    router.post('/login', authController.login.bind(authController));
    router.post(
      '/logout',
      (req, res, next) => authMiddleware.execute(req, res, next),
      authController.logout.bind(authController)
    );

    return router;
  }
}