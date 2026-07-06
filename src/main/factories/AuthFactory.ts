import crypto from 'node:crypto';
import { Router } from 'express';

// Interfaces (Contratos)
import { type IAccountRepository } from '../../domain/repositories/IAccountRepository.js';
import { type ICryptoService } from '../../application/ports/ICryptoService.js';

// Infraestructura (Implementaciones reales)
import { JsonAccountRepository } from '../../infrastructure/repositories/JsonAccountRepository.js';
import { BcryptCryptoService } from '../../infrastructure/services/BcryptCryptoService.js';

// Aplicación (Casos de Uso)
import { RegisterAccount } from '../../application/use-cases/RegisterAccount.js';
import { Login } from '../../application/use-cases/Login.js';
import { Logout } from '../../application/use-cases/Logout.js';

// Presentación
import { AuthController } from '../../presentation/controllers/AuthController.js';
import { AuthRoutes } from '../../presentation/routes/AuthRoutes.js';

// Seguridad compartida
import { SharedSecurityFactory } from './SharedSecurityFactory.js';

export class AuthFactory {
  /**
   * Construye y devuelve el Router de Express con todas las dependencias
   * inyectadas y fuertemente tipadas.
   */
  public static createRouter(): Router {
    // 1. Dependencias de Seguridad Compartidas
    const tokenService = SharedSecurityFactory.getTokenService();
    const sessionRepository = SharedSecurityFactory.getSessionRepository();
    const authMiddleware = SharedSecurityFactory.getAuthMiddleware();

    // 2. Repositorios y Servicios propios del módulo
    const accountRepository: IAccountRepository = new JsonAccountRepository();
    const cryptoService: ICryptoService = new BcryptCryptoService();
    const idGenerator: () => string = () => crypto.randomUUID();

    // 3. Casos de Uso
    const registerAccount: RegisterAccount = new RegisterAccount(accountRepository, cryptoService, idGenerator);
    const login: Login = new Login(accountRepository, cryptoService, tokenService, idGenerator);
    const logout: Logout = new Logout(tokenService, sessionRepository);

    // 4. Controladores
    const authController: AuthController = new AuthController(registerAccount, login, logout);

    // 5. Ensamblaje de Rutas
    const router: Router = AuthRoutes.create(authController, authMiddleware);

    return router;
  }
}