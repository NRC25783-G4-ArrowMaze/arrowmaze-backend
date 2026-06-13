import { type ITokenService } from '../ports/ITokenService';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { AuthError } from '../../domain/exceptions/AuthExceptions';

export interface LogoutRequest {
  token: string;
}

export class Logout {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: ISessionRepository
  ) {}

  async execute(request: LogoutRequest): Promise<void> {
    try {
      // 1. Verificar matemáticamente el token y extraer su carga útil
      const payload = await this.tokenService.verify(request.token);

      if (!payload.exp) {
        throw new AuthError('session token is invalid or has been revoked');
      }

      // Convertir el 'exp' (viene en segundos según el estándar JWT) a un objeto Date
      const expiresAt = new Date(payload.exp * 1000);

      // 2. Guardar el JTI en la lista negra (Escenario: cierre de sesión destruye el token)
      await this.sessionRepository.revoke(payload.jti, expiresAt);
    } catch (error) {
      // Si el tokenService detecta que la firma es inválida o ya expiró por tiempo
      console.log(error);
      throw new AuthError('session token is invalid or has been revoked', { cause: error });
    }
  }
}