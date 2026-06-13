export interface ISessionRepository {
  // Guarda el JTI en la lista negra hasta su fecha de expiración original
  revoke(jti: string, expiresAt: Date): Promise<void>;
  
  // Verifica si el token ha sido revocado
  isRevoked(jti: string): Promise<boolean>;
}