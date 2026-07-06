import { type Request, type Response } from 'express';
import { RegisterAccount } from '../../application/use-cases/RegisterAccount.js';
import { Login } from '../../application/use-cases/Login.js';
import { Logout } from '../../application/use-cases/Logout.js';
import { AuthError, RegistrationError, ValidationError } from '../../domain/exceptions/AuthExceptions.js';

export class AuthController {
  constructor(
    private readonly registerAccountUseCase: RegisterAccount,
    private readonly loginUseCase: Login,
    private readonly logoutUseCase: Logout
  ) {}

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      await this.registerAccountUseCase.execute({ 
        email, 
        passwordPlainText: password 
      });

      res.status(201).json({ message: 'Account created successfully' });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      const response = await this.loginUseCase.execute({ 
        email, 
        passwordPlainText: password 
      });

      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    try {
      // El token vendrá en el header 'Authorization: Bearer <token>'
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        throw new AuthError('No token provided');
      }

      await this.logoutUseCase.execute({ token });

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // Centralizamos el manejo de errores para mantener los métodos limpios
  private handleError(error: unknown, res: Response): void {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    if (error instanceof RegistrationError) {
      res.status(409).json({ error: error.message });
      return;
    }
    
    if (error instanceof AuthError) {
      if (error.cause) {
        console.error('Detalle técnico interno:', error.cause);
      }
      res.status(401).json({ error: error.message });
      return;
    }

    // Error no controlado (Fallo de base de datos, etc.)
    console.error('Error interno del servidor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}