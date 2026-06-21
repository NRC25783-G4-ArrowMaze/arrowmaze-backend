import crypto from 'node:crypto';
import { Router } from 'express';

// Interfaces (Contratos)
import { type IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { type ICryptoService } from '../../application/ports/ICryptoService';
import { type ITokenService } from '../../application/ports/ITokenService';

// Infraestructura (Implementaciones reales)
import { JsonAccountRepository } from '../../infrastructure/repositories/JsonAccountRepository';
import { JsonSessionRepository } from '../../infrastructure/repositories/JsonSessionRepository';
import { BcryptCryptoService } from '../../infrastructure/services/BcryptCryptoService';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';

// Aplicación (Casos de Uso)
import { RegisterAccount } from '../../application/use-cases/RegisterAccount';
import { Login } from '../../application/use-cases/Login';
import { Logout } from '../../application/use-cases/Logout';

// Presentación
import { AuthController } from '../../presentation/controllers/AuthController';
import { AuthMiddleware } from '../../presentation/middlewares/AuthMiddleware';
import { AuthRoutes } from '../../presentation/routes/AuthRoutes';
import { BlacklistCleanupJob } from '../../infrastructure/jobs/BlacklistCleanup';

export class AuthFactory {
  /**
   * Construye y devuelve el Router de Express con todas las dependencias 
   * inyectadas y fuertemente tipadas.
   */
  public static createRouter(): Router {
    // 1. Repositorios (Tipados estrictamente con sus interfaces)
    const accountRepository: IAccountRepository = new JsonAccountRepository();
    const sessionRepository: ISessionRepository = new JsonSessionRepository();

    // Arrancamos el Job de limpieza en segundo plano (Se ejecutará a las 3 AM)
    const cleanupJob = new BlacklistCleanupJob(sessionRepository);
    cleanupJob.start();

    // 2. Servicios (Tipados estrictamente con sus interfaces y tipos nativos)
    const cryptoService: ICryptoService = new BcryptCryptoService();
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está configurado. Defínelo como variable de entorno.');
    }
    const tokenService: ITokenService = new JwtTokenService(jwtSecret);
    const idGenerator: () => string = () => crypto.randomUUID();

    // 3. Casos de Uso
    const registerAccount: RegisterAccount = new RegisterAccount(accountRepository, cryptoService, idGenerator);
    const login: Login = new Login(accountRepository, cryptoService, tokenService, idGenerator);
    const logout: Logout = new Logout(tokenService, sessionRepository);

    // 4. Controladores y Middlewares
    const authController: AuthController = new AuthController(registerAccount, login, logout);
    const authMiddleware: AuthMiddleware = new AuthMiddleware(tokenService, sessionRepository);

    // 5. Ensamblaje de Rutas
    const router: Router = AuthRoutes.create(authController, authMiddleware);
    
    return router;
  }
}