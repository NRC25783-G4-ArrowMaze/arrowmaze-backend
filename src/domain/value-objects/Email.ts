import { ValidationError } from '../exceptions/AuthExceptions';

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(email: string): Email {
    // Expresión regular para validar formato RFC 5322 básico
    const rfc5322Regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    
    if (!rfc5322Regex.test(email)) {
      throw new ValidationError('invalid email format');
    }

    return new Email(email);
  }

  public getValue(): string {
    return this.value;
  }

  /**
   * Retorna la parte local del correo (lo que va antes del '@') para usarla
   * como alias público. Evita exponer el correo completo (PII) hacia afuera.
   */
  public getPublicAlias(): string {
    return this.value.split('@')[0];
  }
}