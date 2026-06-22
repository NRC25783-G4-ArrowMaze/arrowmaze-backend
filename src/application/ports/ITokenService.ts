import { type UserRole } from '../../domain/entities/Account';

export interface TokenPayload {
  accountId: string;
  jti: string;
  role: UserRole;
  iat?: number; // Issued At: inyectado automáticamente por la librería
  exp?: number; // Expiration Time: inyectado automáticamente por la librería
}

export interface ITokenService {
  generate(payload: TokenPayload, expiresInSeconds: number): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
}