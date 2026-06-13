export interface ICryptoService {
  /**
   * Toma una contraseña en texto plano y devuelve su hash seguro.
   */
  hash(plainText: string): Promise<string>;

  /**
   * Compara una contraseña en texto plano con un hash almacenado
   * para verificar si coinciden.
   */
  compare(plainText: string, hash: string): Promise<boolean>;
}