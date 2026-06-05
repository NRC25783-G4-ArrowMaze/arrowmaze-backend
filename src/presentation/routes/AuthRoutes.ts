import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

export class AuthRoutes {
  public static create(
    authController: AuthController,
    authMiddleware: AuthMiddleware
  ): Router {
    const router = Router();

    // Rutas públicas
    router.post('/register', authController.register.bind(authController));
    router.post('/login', authController.login.bind(authController));
    router.post('/logout', authMiddleware.execute, authController.logout.bind(authController));

    return router;
  }
}