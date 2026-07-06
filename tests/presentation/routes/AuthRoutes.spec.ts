import { AuthRoutes } from '../../../src/presentation/routes/AuthRoutes.js';
import { AuthMiddleware } from '../../../src/presentation/middlewares/AuthMiddleware.js';
import { type AuthController } from '../../../src/presentation/controllers/AuthController.js';
import { type ITokenService, type TokenPayload } from '../../../src/application/ports/ITokenService.js';
import { type ISessionRepository } from '../../../src/domain/repositories/ISessionRepository.js';
import { type Request, type Response, type NextFunction } from 'express';

// Forma mínima de las capas internas del Router de Express para poder
// extraer los handlers tal y como el framework los invoca (desacoplados).
interface RouteLayer {
  handle: (req: Request, res: Response, next: NextFunction) => unknown;
}
interface RouterLayer {
  route?: { path: string; stack: RouteLayer[] };
}

describe('AuthRoutes', () => {
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;
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

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  it('should_pass_auth_middleware_when_express_invokes_the_logout_handler_detached', async () => {
    // Arrange: middleware real (el bug era perder `this` al registrarlo sin bind)
    const authMiddleware = new AuthMiddleware(mockTokenService, mockSessionRepository);
    const fakeController = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    } as unknown as AuthController;

    const fakePayload: TokenPayload = { accountId: 'user-1', jti: 'jti-1', role: 'USER' };
    mockTokenService.verify.mockResolvedValue(fakePayload);
    mockSessionRepository.isRevoked.mockResolvedValue(false);

    const router = AuthRoutes.create(fakeController, authMiddleware);

    const layers = (router as unknown as { stack: RouterLayer[] }).stack;
    const logoutRoute = layers.find((l) => l.route?.path === '/logout')?.route;
    expect(logoutRoute).toBeDefined();

    // Express invoca cada handler como función suelta: fn(req, res, next)
    const detachedMiddlewareHandler = logoutRoute!.stack[0].handle;
    const mockRequest: Partial<Request> = {
      headers: { authorization: 'Bearer valid_token_123' },
    };

    // Act
    await detachedMiddlewareHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert: la petición atraviesa el middleware en lugar de morir en 401
    expect(mockTokenService.verify).toHaveBeenCalledWith('valid_token_123');
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
