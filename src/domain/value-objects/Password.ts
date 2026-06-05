import { ValidationError } from '../exceptions/AuthExceptions';

export class Password {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(password: string): Password {
    // Mínimo 8 caracteres, 1 número, 1 letra mayúscula
    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    
    if (!regex.test(password)) {
      throw new ValidationError('password must contain at least 8 characters, 1 number, and 1 uppercase letter');
    }

    return new Password(password);
  }

  public getValue(): string {
    return this.value;
  }
}