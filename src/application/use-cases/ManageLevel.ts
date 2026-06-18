import { type ILevelRepository } from '../../domain/repositories/ILevelRepository';
import { LevelValidationError, LevelNotFoundError, LevelAlreadyExistsError } from '../../domain/exceptions/LevelExceptions';
import type { LevelDataDTO } from '../../infrastructure/shared/contracts/LevelDataDTOs';

export class ManageLevel {
  constructor(private readonly levelRepository: ILevelRepository) {}

  async create(payload: unknown): Promise<string> {
    this.validatePayloadStructure(payload);
    
    const levelData = payload as LevelDataDTO;

    const existing = await this.levelRepository.findById(levelData.id);
    if (existing) {
      throw new LevelAlreadyExistsError(`Level with ID '${levelData.id}' already exists`);
    }

    await this.levelRepository.save(levelData);
    return levelData.id;
  }

  async update(id: string, payload: unknown): Promise<void> {
    this.validatePayloadStructure(payload);
    
    const levelData = payload as LevelDataDTO;

    const existing = await this.levelRepository.findById(id);
    if (!existing) {
      throw new LevelNotFoundError();
    }

    // Aseguramos que el ID del payload coincida con el ID de la URL
    if (levelData.id !== id) {
      throw new LevelValidationError("ID in URL does not match ID in payload");
    }

    await this.levelRepository.update(id, levelData);
  }

  // ─────────────────────────────────────────────
  // Lógica de Validación de Integridad (Bloque 5 del Gherkin)
  // ─────────────────────────────────────────────

  private validatePayloadStructure(payload: unknown): void {
    if (!payload || typeof payload !== 'object') {
      throw new LevelValidationError('Payload must be a valid JSON object');
    }

    const data = payload as Record<string, unknown>;

    if (typeof data.id !== 'string' || data.id.trim() === '') {
      throw new LevelValidationError("missing required field 'id'");
    }

    if (typeof data.allowedMoves !== 'number') {
      throw new LevelValidationError("LevelDataError: missing required field 'allowedMoves'");
    }

    if (!Array.isArray(data.cells) || data.cells.length === 0) {
      throw new LevelValidationError("LevelDataError: board must contain at least one cell");
    }

    if (!Array.isArray(data.arrows) || data.arrows.length === 0) {
      throw new LevelValidationError("LevelDataError: board must contain at least one arrow");
    }

    // Validación profunda de celdas sin usar any
    for (const cell of data.cells) {
      const c = cell as Record<string, unknown>;
      if (typeof c.portCount !== 'number') {
        throw new LevelValidationError("LevelDataError: portCount must be a number");
      }
    }
    
    // Podrías añadir más validaciones estructurales aquí si el CMS las requiere.
  }
}