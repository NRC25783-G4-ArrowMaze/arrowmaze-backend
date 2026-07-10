import { type Request, type Response } from 'express';
import { RegisterAccount } from '../../application/use-cases/RegisterAccount.js';
import { Login } from '../../application/use-cases/Login.js';
import { Logout } from '../../application/use-cases/Logout.js';
import { AuthError } from '../../domain/exceptions/AuthExceptions.js';

// Los errores de dominio se traducen a HTTP en el ErrorHandlerAspect;
// en Express 5 las promesas rechazadas llegan solas al error handler.
export class AuthController {
  constructor(
    private readonly registerAccountUseCase: RegisterAccount,
    private readonly loginUseCase: Login,
    private readonly logoutUseCase: Logout
  ) {}

  public async register(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    await this.registerAccountUseCase.execute({
      email,
      passwordPlainText: password
    });

    res.status(201).json({ message: 'Account created successfully' });
  }

  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const response = await this.loginUseCase.execute({
      email,
      passwordPlainText: password
    });

    res.status(200).json(response);
  }

  public async logout(req: Request, res: Response): Promise<void> {
    // El token vendrá en el header 'Authorization: Bearer <token>'
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new AuthError('No token provided');
    }

    await this.logoutUseCase.execute({ token });

    res.status(200).json({ message: 'Logged out successfully' });
  }
}
