import { EventEmitter } from 'node:events';
import { requestLoggingAspect } from '../../../src/infrastructure/aspects/RequestLoggingAspect.js';

describe('RequestLoggingAspect (aspecto AOP de logging de peticiones HTTP)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildContext = () => {
    const req: any = { method: 'GET', originalUrl: '/api/v1/levels' };
    // El aspecto escucha el evento 'finish' del response real de Node
    const res: any = new EventEmitter();
    res.statusCode = 200;
    const next = jest.fn();
    return { req, res, next };
  };

  it('should_call_next_immediately_without_touching_the_response', () => {
    // Arrange
    const { req, res, next } = buildContext();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    requestLoggingAspect(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalled(); // aún no terminó la petición
  });

  it('should_log_method_path_status_and_duration_when_response_finishes', () => {
    // Arrange
    const { req, res, next } = buildContext();
    res.statusCode = 404;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    requestLoggingAspect(req, res, next);
    res.emit('finish');

    // Assert
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[HTTP\] GET \/api\/v1\/levels → 404 \(\d+ms\)$/)
    );
  });
});
