import { type IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { type ICryptoService } from '../ports/ICryptoService';
import { type ITokenService } from '../ports/ITokenService';
import { Email } from '../../domain/value-objects/Email';
import { AuthError } from '../../domain/exceptions/AuthExceptions';

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
    
    // Asignamos un tiempo de expiración por defecto, por ejemplo 24 horas (86400 segundos)
    const expiresInSeconds = 86400; 

    // 👈 Actualizamos la firma para enviar todos los parámetros y extraer el ID y Rol de los getters
    const token = await this.tokenService.generate({
      accountId: account.getId(),
      jti,
      role: account.getRole()
    }, expiresInSeconds);

    return { token };
  }
}