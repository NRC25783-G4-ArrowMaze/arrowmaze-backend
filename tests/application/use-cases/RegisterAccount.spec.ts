import { RegisterAccount } from '../../../src/application/use-cases/RegisterAccount';
import { type IAccountRepository } from '../../../src/domain/repositories/IAccountRepository';
import { type ICryptoService } from '../../../src/application/ports/ICryptoService';
import { Account } from '../../../src/domain/entities/Account';
import { RegistrationError, ValidationError } from '../../../src/domain/exceptions/AuthExceptions';
import { Email } from '../../../src/domain/value-objects/Email';

describe('RegisterAccount Use Case', () => {
  let mockAccountRepository: jest.Mocked<IAccountRepository>;
  let mockCryptoService: jest.Mocked<ICryptoService>;
  let useCase: RegisterAccount;

  beforeEach(() => {
    mockAccountRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
    };
    mockCryptoService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    const mockIdGenerator = () => 'test-uuid-1234';

    useCase = new RegisterAccount(mockAccountRepository, mockCryptoService, mockIdGenerator);
  });

  it('should_save_account_when_credentials_are_valid', async () => {
    // Arrange
    const request = { email: 'usuario@test.com', passwordPlainText: 'Secreta123' };
    mockAccountRepository.findByEmail.mockResolvedValue(null);
    mockCryptoService.hash.mockResolvedValue('hashed_password');

    // Act
    await useCase.execute(request);

    // Assert
    expect(mockAccountRepository.save).toHaveBeenCalledTimes(1);
    const savedAccountArg = mockAccountRepository.save.mock.calls[0][0];
    expect(savedAccountArg).toBeInstanceOf(Account);
    expect(savedAccountArg.email.getValue()).toBe('usuario@test.com');
    expect(savedAccountArg.passwordHash).toBe('hashed_password');
  });

  it('should_throw_validation_error_when_email_format_is_invalid', async () => {
    // Arrange
    const request = { email: 'usuario.test.com', passwordPlainText: 'Secreta123' };

    // Act
    const attempt = useCase.execute(request);

    // Assert
    await expect(attempt).rejects.toThrow(ValidationError);
    await expect(attempt).rejects.toThrow('invalid email format');
  });

  it('should_throw_validation_error_when_password_is_weak', async () => {
    // Arrange
    const request = { email: 'usuario@test.com', passwordPlainText: 'clave' };

    // Act
    const attempt = useCase.execute(request);

    // Assert
    await expect(attempt).rejects.toThrow(ValidationError);
  });

  it('should_throw_registration_error_when_email_already_exists', async () => {
    // Arrange
    const request = { email: 'admin@test.com', passwordPlainText: 'Secreta123' };
    // Primero, creamos una entidad Account válida (importando Email y Account si no estaban importados en este bloque)
    const fakeEmail = Email.create('admin@test.com');
    const existingAccount = new Account('mock-id-123', fakeEmail, 'hashed_password');

    // Luego, la pasamos al mock sin usar ningún "as"
    mockAccountRepository.findByEmail.mockResolvedValue(existingAccount);

    // Act
    const attempt = useCase.execute(request);

    // Assert
    await expect(attempt).rejects.toThrow(RegistrationError);
    await expect(attempt).rejects.toThrow('email is already in use');
  });
});