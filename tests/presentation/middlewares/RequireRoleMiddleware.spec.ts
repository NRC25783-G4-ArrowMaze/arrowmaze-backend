import { RequireRoleMiddleware } from '../../../src/presentation/middlewares/RequireRoleMiddleware.js';
import { type Request, type Response, type NextFunction } from 'express';

describe('RequireRoleMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should_call_next_when_userRole_matches_required_role', () => {
    // Arrange
    const middleware = RequireRoleMiddleware.create('ADMIN');
    mockRequest.userRole = 'ADMIN';

    // Act
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should_return_403_forbidden_when_userRole_does_not_match', () => {
    // Arrange
    const middleware = RequireRoleMiddleware.create('ADMIN');
    mockRequest.userRole = 'USER'; // Intento de escalada de privilegios

    // Act
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should_return_403_forbidden_when_userRole_is_missing', () => {
    // Arrange
    const middleware = RequireRoleMiddleware.create('ADMIN');
    // mockRequest.userRole es undefined porque el AuthMiddleware falló o no se ejecutó
    
    // Act
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});