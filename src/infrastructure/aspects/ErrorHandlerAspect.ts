import { type Request, type Response, type NextFunction } from 'express';
import { AuthError, RegistrationError, ValidationError } from '../../domain/exceptions/AuthExceptions.js';
import { LeaderboardValidationError } from '../../domain/exceptions/LeaderboardExceptions.js';
import { LevelAlreadyExistsError, LevelNotFoundError, LevelValidationError } from '../../domain/exceptions/LevelExceptions.js';
import { LevelRegistryError, ProgressNotFoundError, ProgressValidationError } from '../../domain/exceptions/ProgressExceptions.js';

/**
 * Aspecto AOP de manejo centralizado de excepciones: traduce los errores
 * del dominio a respuestas HTTP en un único punto, liberando a los
 * controladores de los try/catch duplicados. En Express 5 las promesas
 * rechazadas de los handlers async llegan aquí automáticamente.
 */

type ErrorClass = new (...args: never[]) => Error;

// Tabla de traducción excepción de dominio → código HTTP
const STATUS_BY_ERROR: Array<[ErrorClass, number]> = [
  [ValidationError, 400],
  [LevelValidationError, 400],
  [ProgressValidationError, 400],
  [LeaderboardValidationError, 400],
  [AuthError, 401],
  [LevelNotFoundError, 404],
  [ProgressNotFoundError, 404],
  [RegistrationError, 409],
  [LevelAlreadyExistsError, 409],
  [LevelRegistryError, 422]
];

// La firma de 4 parámetros es obligatoria: Express solo reconoce como
// error handler a los middlewares con exactamente esta aridad.
export function errorHandlerAspect(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof Error) {
    for (const [errorClass, status] of STATUS_BY_ERROR) {
      if (error instanceof errorClass) {
        if (error instanceof AuthError && error.cause) {
          console.error('Detalle técnico interno:', error.cause);
        }
        res.status(status).json({ error: error.message });
        return;
      }
    }
  }

  // Error no controlado (fallo de I/O, bug, etc.): no filtrar detalles a la red
  console.error('Error interno del servidor:', error);
  res.status(500).json({ error: 'Internal server error' });
}
