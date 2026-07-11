import { type IAccountRepository } from '../../domain/repositories/IAccountRepository.js';
import { type ICryptoService } from '../ports/ICryptoService.js';
import { type ITokenService } from '../ports/ITokenService.js';
import { Email } from '../../domain/value-objects/Email.js';
import { AuthError } from '../../domain/exceptions/AuthExceptions.js';

export interface LoginRequest {
  email: string;
  passwordPlainText: string;
}

export interface LoginResponse {
  token: string;
}

export class Login {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly cryptoService: ICryptoService,
    private readonly tokenService: ITokenService,
    private readonly generateId: () => string
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    // ⚠️ Bypass SOLO para desarrollo local: con LEVELS_SKIP_ROLE_CHECK=true cualquier
    // credencial devuelve un JWT válido con rol ADMIN, para que forge entre al editor
    // y publique mapas sin una cuenta real. Por defecto —sin la variable— el login
    // valida credenciales normalmente. NO desplegar en entornos compartidos/producción.
    if (process.env.LEVELS_SKIP_ROLE_CHECK === 'true') {
      const token = await this.tokenService.generate({
        accountId: 'local-dev',
        jti: this.generateId(),
        role: 'ADMIN'
      }, 604800);
      return { token };
    }

    let email: Email;
    try {
      email = Email.create(request.email);
    } catch (error) {
      const authErr = new AuthError('invalid credentials');
      authErr.cause = error; 
      throw authErr;
    }

    const account = await this.accountRepository.findByEmail(email);
    if (!account) {
      throw new AuthError('invalid credentials');
    }

    const isPasswordValid = await this.cryptoService.compare(
      request.passwordPlainText,
      account.getPasswordHash() // 👈 Usando el getter blindado
    );

    if (!isPasswordValid) {
      throw new AuthError('invalid credentials');
    }

    const jti = this.generateId();

    // Sesión de 7 días, según la spec E2 de gestión de sesión activa
    const expiresInSeconds = 604800;

    const token = await this.tokenService.generate({
      accountId: account.getId(),
      jti,
      role: account.getRole()
    }, expiresInSeconds);

    return { token };
  }
}