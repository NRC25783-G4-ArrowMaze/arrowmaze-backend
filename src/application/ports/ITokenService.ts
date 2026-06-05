// Definimos la estructura de la carga útil (payload) que viajará dentro del JWT
export interface TokenPayload {
  accountId: string;
  jti: string;
  exp?: number; // Tiempo de expiración (gestionado internamente por la librería de JWT)
  iat?: number; // Fecha de emisión
}

export interface ITokenService {
  /**
   * Genera un JWT firmado válido por 7 días.
   * Recibe el ID de la cuenta y el identificador único del token (JTI).
   */
  generate(payload: Omit<TokenPayload, 'exp' | 'iat'>): Promise<string>;

  /**
   * Verifica la firma matemática del JWT y su fecha de expiración.
   * Si es válido, devuelve el payload decodificado.
   * Si es inválido o expiró, debe lanzar un error.
   */
  verify(token: string): Promise<TokenPayload>;
}