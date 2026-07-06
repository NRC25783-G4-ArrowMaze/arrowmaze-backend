import bcrypt from 'bcrypt';
import { type ICryptoService } from '../../application/ports/ICryptoService.js';

export class BcryptCryptoService implements ICryptoService {
  // El "saltRounds" define el costo computacional del algoritmo. 
  // 10 es el estándar recomendado para balancear seguridad y rendimiento.
  private readonly saltRounds = 10;

  async hash(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
  }
}