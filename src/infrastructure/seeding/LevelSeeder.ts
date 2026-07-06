import { type ManageLevel } from '../../application/use-cases/ManageLevel.js';
import { LevelAlreadyExistsError } from '../../domain/exceptions/LevelExceptions.js';
import type { LevelDataDTO } from '../../domain/shared/contracts/LevelDataDTOs.js';

export interface SeedResult {
  created: number;
  updated: number;
}

/**
 * Siembra el catálogo de niveles con upsert idempotente.
 *
 * Pasa por ManageLevel (no por el repositorio directo) a propósito:
 * JsonLevelRepository.save() hace push sin deduplicar, y ManageLevel aporta
 * la validación de integridad del payload (Bloque 5 del Gherkin de F2).
 * Los niveles existentes ajenos al seed no se tocan.
 */
export class LevelSeeder {
  constructor(private readonly manageLevel: ManageLevel) {}

  async run(levels: LevelDataDTO[]): Promise<SeedResult> {
    const result: SeedResult = { created: 0, updated: 0 };

    for (const level of levels) {
      try {
        await this.manageLevel.create(level);
        result.created++;
      } catch (error) {
        if (error instanceof LevelAlreadyExistsError) {
          await this.manageLevel.update(level.id, level);
          result.updated++;
        } else {
          throw error;
        }
      }
    }

    return result;
  }
}
