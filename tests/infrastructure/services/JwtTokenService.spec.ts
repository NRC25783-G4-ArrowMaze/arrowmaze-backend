import jwt from 'jsonwebtoken';
import { JwtTokenService } from '../../../src/infrastructure/services/JwtTokenService.js';
import { AuthError } from '../../../src/domain/exceptions/AuthExceptions.js';

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
    verify: jest.fn()
  }
}));

describe('JwtTokenService (Adapter de jsonwebtoken → ITokenService)', () => {
  const SECRET = 'test-secret';
  let service: JwtTokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JwtTokenService(SECRET);
  });

  it('should_delegate_generate_to_jwt_sign_with_expiration', async () => {
    // Arrange
    (jwt.sign as jest.Mock).mockReturnValue('signed.jwt.token');
    const payload = { sub: 'user_1', jti: 'session_1', role: 'PLAYER' } as any;

    // Act
    const token = await service.generate(payload, 3600);

    // Assert
    expect(jwt.sign).toHaveBeenCalledWith(payload, SECRET, { expiresIn: 3600 });
    expect(token).toBe('signed.jwt.token');
  });

  it('should_return_decoded_payload_when_token_is_valid', async () => {
    // Arrange
    const decoded = { sub: 'user_1', jti: 'session_1', exp: 123, iat: 100 };
    (jwt.verify as jest.Mock).mockReturnValue(decoded);

    // Act
    const result = await service.verify('valid.jwt.token');

    // Assert
    expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', SECRET);
    expect(result).toEqual(decoded);
  });

  it('should_translate_jwt_errors_into_AuthError_with_cause', async () => {
    // Arrange
    const jwtError = new Error('jwt expired');
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw jwtError;
    });

    // Act & Assert
    await expect(service.verify('expired.jwt.token')).rejects.toThrow(AuthError);
    await expect(service.verify('expired.jwt.token')).rejects.toMatchObject({ cause: jwtError });
  });
});
