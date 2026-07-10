import { AuthMiddleware } from '../../../src/presentation/middlewares/AuthMiddleware.js';
import { type ITokenService, type TokenPayload } from '../../../src/application/ports/ITokenService.js';
import { type ISessionRepository } from '../../../src/domain/repositories/ISessionRepository.js';
import { type Request, type Response, type NextFunction } from 'express';

describe('AuthMiddleware', () => {
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;
  let middleware: AuthMiddleware;

  // Fakes seguros para Express
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

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

    middleware = new AuthMiddleware(mockTokenService, mockSessionRepository);

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  it('should_call_next_and_inject_accountId_and_role_when_token_is_valid', async () => {
    // Arrange
    mockRequest.headers = { authorization: 'Bearer valid_token_123' };
    const fakePayload: TokenPayload = { accountId: 'user-1', jti: 'jti-123', role: 'USER' };
    
    mockTokenService.verify.mockResolvedValue(fakePayload);
    mockSessionRepository.isRevoked.mockResolvedValue(false);

    // Act
    await middleware.execute(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNext
    );

    // Assert
    expect(mockTokenService.verify).toHaveBeenCalledWith('valid_token_123');
    expect(mockSessionRepository.isRevoked).toHaveBeenCalledWith('jti-123');
    
    // Inyección exitosa de ambas propiedades
    expect(mockRequest.accountId).toBe('user-1'); 
    expect(mockRequest.userRole).toBe('USER'); 
    
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should_return_401_unauthorized_when_authorization_header_is_missing', async () => {
    // Arrange
    mockRequest.headers = {}; // Sin cabecera

    // Act
    await middleware.execute(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: missing token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should_return_401_invalid_signature_when_token_verification_fails_generically', async () => {
    // Arrange
    mockRequest.headers = { authorization: 'Bearer manipulated_token' };
    const genericError = new Error('invalid signature');
    mockTokenService.verify.mockRejectedValue(genericError);

    // Act
    await middleware.execute(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: invalid token signature' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should_return_401_token_expired_when_token_is_expired', async () => {
    // Arrange
    mockRequest.headers = { authorization: 'Bearer old_token' };
    
    // El middleware lee error.message, por lo que el mensaje debe contener la frase clave
    const expiredError = new Error('jwt expired');
    
    mockTokenService.verify.mockRejectedValue(expiredError);

    // Act
    await middleware.execute(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'TokenExpiredError: session has expired' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should_return_403_forbidden_when_token_is_in_blacklist', async () => {
    // Arrange
    mockRequest.headers = { authorization: 'Bearer revoked_token' };
    const fakePayload: TokenPayload = { accountId: 'user-1', jti: 'jti-bad', role: 'USER' };
    
    mockTokenService.verify.mockResolvedValue(fakePayload);
    // Simulamos que el repositorio encuentra el token en la lista negra
    mockSessionRepository.isRevoked.mockResolvedValue(true); 

    // Act
    await middleware.execute(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden: token has been revoked' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});