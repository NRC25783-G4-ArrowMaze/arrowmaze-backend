import { Login } from '../../../src/application/use-cases/Login.js';
import { type IAccountRepository } from '../../../src/domain/repositories/IAccountRepository.js';
import { type ICryptoService } from '../../../src/application/ports/ICryptoService.js';
import { type ITokenService } from '../../../src/application/ports/ITokenService.js';
import { Account } from '../../../src/domain/entities/Account.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { AuthError } from '../../../src/domain/exceptions/AuthExceptions.js';

describe('Login Use Case', () => {
  let mockAccountRepository: jest.Mocked<IAccountRepository>;
  let mockCryptoService: jest.Mocked<ICryptoService>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let useCase: Login;

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
    mockTokenService = {
      generate: jest.fn(),
      verify: jest.fn(),
    };
    const mockIdGenerator = () => 'jti-1234';

    useCase = new Login(mockAccountRepository, mockCryptoService, mockTokenService, mockIdGenerator);
  });

  it('should_return_token_when_credentials_are_correct', async () => {
    // Arrange
    const request = { email: 'user@test.com', passwordPlainText: 'Secreta123' };
    
    // El constructor de Account ahora asigna 'USER' por defecto
    const fakeAccount = new Account('acc-1', Email.create('user@test.com'), 'hashed_pw');
    
    mockAccountRepository.findByEmail.mockResolvedValue(fakeAccount);
    mockCryptoService.compare.mockResolvedValue(true);
    mockTokenService.generate.mockResolvedValue('valid_jwt_token');

    // Act
    const response = await useCase.execute(request);

    // Assert
    expect(response.token).toBe('valid_jwt_token');
    
    // Verificamos que el payload contenga la propiedad obligatoria 'role'
    // y que la sesión dure 7 días (604800 s), según la spec E2
    expect(mockTokenService.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'acc-1',
        jti: 'jti-1234',
        role: 'USER'
      }),
      604800
    );
  });

  it('should_throw_auth_error_when_email_is_invalid', async () => {
    // Arrange
    const request = { email: 'invalid.email', passwordPlainText: 'Secreta123' };

    // Act
    const attempt = useCase.execute(request);

    // Assert
    await expect(attempt).rejects.toThrow(AuthError);
    await expect(attempt).rejects.toThrow('invalid credentials');
  });

  it('should_throw_auth_error_when_account_does_not_exist', async () => {
    // Arrange
    const request = { email: 'notfound@test.com', passwordPlainText: 'Secreta123' };
    mockAccountRepository.findByEmail.mockResolvedValue(null);

    // Act
    const attempt = useCase.execute(request);

    // Assert
    await expect(attempt).rejects.toThrow(AuthError);
  });

  it('should_throw_auth_error_when_password_is_incorrect', async () => {
    // Arrange
    const request = { email: 'user@test.com', passwordPlainText: 'WrongPass1' };
    const fakeAccount = new Account('acc-1', Email.create('user@test.com'), 'hashed_pw');
    
    mockAccountRepository.findByEmail.mockResolvedValue(fakeAccount);
    mockCryptoService.compare.mockResolvedValue(false);

    // Act
    const attempt = useCase.execute(request);

    // Assert
    await expect(attempt).rejects.toThrow(AuthError);
  });
});