import type { IRankingStrategy, UnrankedEntry } from "./IRankingStrategy.js";

/**
 * Estrategia de ranking competitivo: criterios de desempate en cascada
 * (score DESC → movimientos ASC → tiempo ASC → fecha ASC).
 */
export class CompetitiveRankingStrategy implements IRankingStrategy {
  /**
   * Ordena los registros aplicando los criterios de desempate en cascada
   * y asigna la posición absoluta (rank) a cada jugador.
   */
  public sortAndRank<T extends UnrankedEntry>(entries: T[]): Array<T & { rank: number }> {
    const sorted = [...entries].sort((a, b) => {
      // 1° Criterio: Mayor score (DESC)
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // 2° Criterio: Menor cantidad de movimientos (ASC)
      if (a.movesUsed !== b.movesUsed) {
        return a.movesUsed - b.movesUsed;
      }

      // 3° Criterio: Menor tiempo transcurrido (ASC)
      if (a.timeElapsedSeconds !== b.timeElapsedSeconds) {
        return a.timeElapsedSeconds - b.timeElapsedSeconds;
      }

      // 4° Criterio: Fecha más antigua (El primero en lograrlo gana) (ASC)
      const dateA = new Date(a.achievedAt).getTime();
      const dateB = new Date(b.achievedAt).getTime();
      return dateA - dateB;
    });

    // Asignación de la posición (rank) empezando desde 1
    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }
}
