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
    private readonly idGenerator: () => string // Usado para generar el JTI del token
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    let email: Email;
    
    // 1. Instanciar Email. Si el formato es inválido, atrapamos el ValidationError 
    // y lanzamos AuthError para ofuscar el motivo del rechazo.
    try {
      email = Email.create(request.email);
    } catch {
      throw new AuthError('invalid credentials');
    }

    // 2. Buscar la cuenta (Escenario: rechazo de un usuario inexistente)
    const account = await this.accountRepository.findByEmail(email);
    if (!account) {
      throw new AuthError('invalid credentials');
    }

    // 3. Verificar contraseña contra el hash
    const isPasswordValid = await this.cryptoService.compare(
      request.passwordPlainText,
      account.passwordHash
    );

    if (!isPasswordValid) {
      throw new AuthError('invalid credentials');
    }

    // 4. Generar el JWT con su identificador único (JTI)
    const jti = this.idGenerator();
    const token = await this.tokenService.generate({
      accountId: account.id,
      jti: jti,
    });

    return { token };
  }
}