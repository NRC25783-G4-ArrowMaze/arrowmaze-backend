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

    // Opcional: Si está en la lista negra pero ya pasó su fecha de expiración original,
    // a nivel lógico da igual porque el JWT fallará su propia validación de tiempo.
    // Pero lo mantenemos simple: si está en el map, está revocado.
    return true;
  }
}