import type { LevelProgressDTO } from "../../infrastructure/shared/contracts/ProgressDTO";

export interface IProgressRepository {
  /**
   * Busca el progreso histórico de un jugador en un nivel específico.
   * Útil para validar si el nuevo intento supera el High Score actual.
   */
  findByUserAndLevel(userId: string, levelId: string): Promise<LevelProgressDTO | null>;

  /**
   * Obtiene todos los niveles completados por un jugador.
   * Garantiza el aislamiento multitenant filtrando por userId.
   */
  findAllByUser(userId: string): Promise<LevelProgressDTO[]>;

  /**
   * Guarda un nuevo registro o sobrescribe uno existente.
   */
  save(progress: LevelProgressDTO): Promise<void>;
}