/**
 * Serializa operaciones sobre un mismo archivo para evitar la carrera
 * read-modify-write de los repositorios JSON: dos peticiones concurrentes
 * que leen, modifican y escriben el mismo archivo pueden pisarse y perder
 * una escritura.
 *
 * La cola es a nivel de módulo y se indexa por la ruta absoluta del archivo,
 * porque las factories crean varias instancias del mismo repositorio
 * (p. ej. JsonSessionRepository) y un mutex por instancia no eliminaría
 * la carrera entre ellas.
 */
const queues = new Map<string, Promise<unknown>>();

export function serialize<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const previous = queues.get(filePath) ?? Promise.resolve();

  // Encadenamos tras la operación anterior; si aquella falló, la nuestra
  // debe ejecutarse igualmente (catch traga el error ajeno, no el propio).
  const current = previous.catch(() => undefined).then(operation);

  // La cola nunca debe quedar en estado rechazado para los siguientes
  queues.set(filePath, current.catch(() => undefined));

  return current;
}
