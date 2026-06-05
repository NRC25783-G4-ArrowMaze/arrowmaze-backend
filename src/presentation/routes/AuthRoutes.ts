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

    // Rutas protegidas (El logout no requiere el middleware aquí porque extrae el token directamente,
    // pero si tuvieras otras rutas protegidas como '/profile', usarías el middleware así:)
    // router.get('/profile', authMiddleware.execute, userController.getProfile);

    // Ojo: Añadimos el middleware al logout para asegurar que solo usuarios con 
    // un token sintácticamente válido puedan intentar revocarlo.
    router.post('/logout', authMiddleware.execute, authController.logout.bind(authController));

    return router;
  }
}