import { type ISessionRepository } from '../../domain/repositories/ISessionRepository';

export class InMemorySessionRepository implements ISessionRepository {
  private readonly revokedTokens: Map<string, Date> = new Map();

  async revoke(jti: string, expiresAt: Date): Promise<void> {
    this.revokedTokens.set(jti, expiresAt);
  }

  async isRevoked(jti: string): Promise<boolean> {
    return this.revokedTokens.has(jti);
  }

  // Implementación de la limpieza
  async deleteExpiredTokens(currentDate: Date): Promise<number> {
    let deletedCount = 0;
    for (const [jti, expiresAt] of this.revokedTokens.entries()) {
      if (expiresAt < currentDate) {
        this.revokedTokens.delete(jti);
        deletedCount++;
      }
    }
    return deletedCount;
  }
}