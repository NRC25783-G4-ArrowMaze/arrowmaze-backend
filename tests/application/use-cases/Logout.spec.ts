import { Logout } from '../../../src/application/use-cases/Logout.js';
import { type ITokenService, type TokenPayload } from '../../../src/application/ports/ITokenService.js';
import { type ISessionRepository } from '../../../src/domain/repositories/ISessionRepository.js';
import { AuthError } from '../../../src/domain/exceptions/AuthExceptions.js';

describe('Logout Use Case', () => {
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;
  let useCase: Logout;

  beforeEach(() => {
    mockTokenService = {
      generate: jest.fn(),
      verify: jest.fn(),
    };
    mockSessionRepository = {
      revoke: jest.fn(),
      isRevoked: jest.fn(),
      deleteExpiredTokens: jest.fn(),
    };

    useCase = new Logout(mockTokenService, mockSessionRepository);
  });

  it('should_revoke_token_when_token_is_valid', async () => {
    // Arrange
    const request = { token: 'valid_token' };
    const mockPayload: TokenPayload = {
      accountId: 'acc-1',
      jti: 'jti-1234',
      exp: 1672531200, // Timestamp genérico
      role: 'USER'
    };
    mockTokenService.verify.mockResolvedValue(mockPayload);

    // Act
    await useCase.execute(request);

    // Assert
    const expectedDate = new Date(1672531200 * 1000);
    expect(mockSessionRepository.revoke).toHaveBeenCalledWith('jti-1234', expectedDate);
    expect(mockSessionRepository.revoke).toHaveBeenCalledTimes(1);
  });

  it('should_throw_auth_error_when_token_verification_fails', async () => {
    // Arrange
    const request = { token: 'invalid_token' };
    mockTokenService.verify.mockRejectedValue(new Error('jwt malformed'));

    // Act
    const attempt = useCase.execute(request);

    // Assert
    await expect(attempt).rejects.toThrow(AuthError);
    await expect(attempt).rejects.toThrow('session token is invalid or has been revoked');
    expect(mockSessionRepository.revoke).not.toHaveBeenCalled();
  });
});