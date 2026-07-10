import { type Request, type Response, type NextFunction } from 'express';

/**
 * Aspecto AOP de logging de peticiones HTTP: registra método, ruta,
 * código de estado y duración de cada petición sin tocar controladores
 * ni casos de uso (observabilidad como responsabilidad transversal).
 */
export function requestLoggingAspect(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    const elapsedMs = Date.now() - startedAt;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} → ${res.statusCode} (${elapsedMs}ms)`);
  });

  next();
}
