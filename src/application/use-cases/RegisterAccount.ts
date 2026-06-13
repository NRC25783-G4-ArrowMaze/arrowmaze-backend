import { type IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { type ICryptoService } from '../ports/ICryptoService';
import { Account } from '../../domain/entities/Account';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { RegistrationError } from '../../domain/exceptions/AuthExceptions';

// Data Transfer Object para la entrada de datos
export interface RegisterAccountRequest {
  email: string;
  passwordPlainText: string;
}

export class RegisterAccount {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly cryptoService: ICryptoService,
    private readonly idGenerator: () => string // Función inyectada para crear IDs únicos
  ) {}

  async execute(request: RegisterAccountRequest): Promise<void> {
    // 1. Validar reglas de negocio con Value Objects (Si fallan, lanzan ValidationError)
    const email = Email.create(request.email);
    const password = Password.create(request.passwordPlainText);

    // 2. Verificar duplicados (Escenario: rechazo de registro por email duplicado)
    const existingAccount = await this.accountRepository.findByEmail(email);
    if (existingAccount) {
      throw new RegistrationError('email is already in use');
    }

    // 3. Hashear la contraseña (el texto plano desaparece de la memoria al terminar esta función)
    const passwordHash = await this.cryptoService.hash(password.getValue());

    // 4. Construir y persistir la entidad de dominio
    const accountId = this.idGenerator();
    const account = new Account(accountId, email, passwordHash);

    await this.accountRepository.save(account);
  }
}