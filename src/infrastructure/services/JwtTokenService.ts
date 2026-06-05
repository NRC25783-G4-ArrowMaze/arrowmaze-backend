import jwt, { type SignOptions } from 'jsonwebtoken';
import { type ITokenService, type TokenPayload } from '../../application/ports/ITokenService';
import { AuthError } from '../../domain/exceptions/AuthExceptions';

export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secretKey: string,
    private readonly expiresIn: string = '7d' 
  ) {}

  async generate(payload: Omit<TokenPayload, 'exp' | 'iat'>): Promise<string> {
    // Le indicamos explícitamente a TypeScript que este string cumple con 
    // las reglas estrictas de tiempo que jsonwebtoken requiere.
    const options: SignOptions = {
      expiresIn: this.expiresIn as SignOptions['expiresIn']
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