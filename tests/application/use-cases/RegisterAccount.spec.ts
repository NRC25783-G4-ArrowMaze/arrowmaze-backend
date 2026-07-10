import { RegisterAccount } from '../../../src/application/use-cases/RegisterAccount.js';
import { type IAccountRepository } from '../../../src/domain/repositories/IAccountRepository.js';
import { type ICryptoService } from '../../../src/application/ports/ICryptoService.js';
import { Account } from '../../../src/domain/entities/Account.js';
import { RegistrationError, ValidationError } from '../../../src/domain/exceptions/AuthExceptions.js';
import { Email } from '../../../src/domain/value-objects/Email.js';

describe('RegisterAccount Use Case', () => {
  let mockAccountRepository: jest.Mocked<IAccountRepository>;
  let mockCryptoService: jest.Mocked<ICryptoService>;
  let useCase: RegisterAccount;

  beforeEach(() => {
    mockAccountRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
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
    
    // Usamos los getters obligatorios del dominio blindado
    expect(savedAccountArg.getEmail().getValue()).toBe('usuario@test.com');
    expect(savedAccountArg.getPasswordHash()).toBe('hashed_password');
    
    // Verificamos que se asigna el rol correcto por defecto
    expect(savedAccountArg.getRole()).toBe('USER');
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
    
    const fakeEmail = Email.create('admin@test.com');
    // Instanciamos el mock de Account con la firma completa, dejando que asuma el rol por defecto
    const existingAccount = new Account('mock-id-123', fakeEmail, 'hashed_password');

    mockAccountRepository.findByEmail.mockResolvedValue(existingAccount);

    // Act
    const attempt = useCase.execute(request);

    // Assert
    await expect(attempt).rejects.toThrow(RegistrationError);
    await expect(attempt).rejects.toThrow('email is already in use');
  });
});