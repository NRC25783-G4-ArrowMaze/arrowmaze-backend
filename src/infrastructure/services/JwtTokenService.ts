import jwt, { type SignOptions } from 'jsonwebtoken';
import { type ITokenService, type TokenPayload } from '../../application/ports/ITokenService.js';
import { AuthError } from '../../domain/exceptions/AuthExceptions.js';

export class JwtTokenService implements ITokenService {
  constructor(private readonly secretKey: string) {}

  async generate(payload: Omit<TokenPayload, 'exp' | 'iat'>, expiresInSeconds: number): Promise<string> {
    const options: SignOptions = {
      expiresIn: expiresInSeconds
    };

    return jwt.sign(payload, this.secretKey, options);
  }

  async verify(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.secretKey) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new AuthError('session token is invalid or has been revoked', { cause: error });
    }
  }
}