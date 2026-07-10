import type { LeaderboardEntryDTO } from "../shared/contracts/LeaderboardDTO.js";

export type UnrankedEntry = Omit<LeaderboardEntryDTO, 'rank'>;

/**
 * Estrategia de ranking del leaderboard (patrón Strategy).
 * Permite intercambiar el algoritmo de ordenamiento y asignación de posiciones
 * sin modificar el caso de uso que lo consume.
 */
export interface IRankingStrategy {
  sortAndRank<T extends UnrankedEntry>(entries: T[]): Array<T & { rank: number }>;
}
