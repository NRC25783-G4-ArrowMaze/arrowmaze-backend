import { type ISessionRepository } from '../../domain/repositories/ISessionRepository';

export class InMemorySessionRepository implements ISessionRepository {
  // Simulamos nuestra lista negra (blacklist) guardando el JTI y su expiración
  private readonly revokedTokens: Map<string, Date> = new Map();

  async revoke(jti: string, expiresAt: Date): Promise<void> {
    this.revokedTokens.set(jti, expiresAt);
  }

  async isRevoked(jti: string): Promise<boolean> {
    const expiresAt = this.revokedTokens.get(jti);
    
    if (!expiresAt) {
      return false; // No está en la lista negra
    }

    return true;
  }
}