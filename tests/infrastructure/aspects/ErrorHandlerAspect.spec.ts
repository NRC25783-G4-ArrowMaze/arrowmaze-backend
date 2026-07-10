import { errorHandlerAspect } from '../../../src/infrastructure/aspects/ErrorHandlerAspect.js';
import { AuthError, RegistrationError, ValidationError } from '../../../src/domain/exceptions/AuthExceptions.js';
import { LeaderboardValidationError } from '../../../src/domain/exceptions/LeaderboardExceptions.js';
import { LevelAlreadyExistsError, LevelNotFoundError, LevelValidationError } from '../../../src/domain/exceptions/LevelExceptions.js';
import { LevelRegistryError, ProgressNotFoundError, ProgressValidationError } from '../../../src/domain/exceptions/ProgressExceptions.js';

describe('ErrorHandlerAspect (aspecto AOP de manejo centralizado de excepciones)', () => {
  const buildRes = () => {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    return res;
  };
  const req: any = {};
  const next: any = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should_have_four_parameters_so_express_registers_it_as_error_handler', () => {
    expect(errorHandlerAspect.length).toBe(4);
  });

  it.each([
    [new ValidationError('bad email'), 400],
    [new LevelValidationError('bad payload'), 400],
    [new ProgressValidationError('bad progress'), 400],
    [new LeaderboardValidationError('bad limit'), 400],
    [new AuthError('invalid credentials'), 401],
    [new LevelNotFoundError(), 404],
    [new ProgressNotFoundError(), 404],
    [new RegistrationError('duplicated'), 409],
    [new LevelAlreadyExistsError('duplicated level'), 409],
    [new LevelRegistryError('registry failure'), 422]
  ])('should_map_%s_to_its_http_status', (error: Error, expectedStatus: number) => {
    // Arrange
    const res = buildRes();

    // Act
    errorHandlerAspect(error, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
  });

  it('should_log_the_cause_of_auth_errors_before_responding_401', () => {
    // Arrange
    const res = buildRes();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const cause = new Error('jwt expired');
    const error = new AuthError('session token is invalid', { cause });

    // Act
    errorHandlerAspect(error, req, res, next);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Detalle técnico interno:', cause);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should_respond_500_without_leaking_details_for_unknown_errors', () => {
    // Arrange
    const res = buildRes();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('ENOENT: disk exploded');

    // Act
    errorHandlerAspect(error, req, res, next);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Error interno del servidor:', error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('should_respond_500_when_the_thrown_value_is_not_an_error', () => {
    // Arrange
    const res = buildRes();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    errorHandlerAspect('boom', req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
