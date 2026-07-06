import { ProgressValidationError } from '../../domain/exceptions/ProgressExceptions.js';
import type { SaveProgressPayloadDTO } from '../../domain/shared/contracts/ProgressDTO.js';

export class SaveProgressCommand implements SaveProgressPayloadDTO {
  private constructor(
    public readonly levelId: string,
    public readonly score: number,
    public readonly movesUsed: number,
    public readonly timeElapsedSeconds: number
  ) {}

  /**
   * Factory method que valida el payload crudo y devuelve una instancia tipada y segura.
   */
  public static create(payload: unknown): SaveProgressCommand {
    if (!payload || typeof payload !== 'object') {
      throw new ProgressValidationError('ProgressValidationError: payload must be a valid JSON object');
    }

    const data = payload as Record<string, unknown>;

    if (typeof data.levelId !== 'string' || data.levelId.trim() === '') {
      throw new ProgressValidationError('ProgressValidationError: levelId is required');
    }

    if (typeof data.score !== 'number' || data.score < 0) {
      throw new ProgressValidationError('ProgressValidationError: score must be a positive integer');
    }

    if (typeof data.movesUsed !== 'number' || data.movesUsed < 0) {
      throw new ProgressValidationError('ProgressValidationError: movesUsed must be a positive integer');
    }

    if (typeof data.timeElapsedSeconds !== 'number' || data.timeElapsedSeconds < 0) {
      throw new ProgressValidationError('ProgressValidationError: timeElapsedSeconds must be a positive integer');
    }

    return new SaveProgressCommand(
      data.levelId,
      data.score,
      data.movesUsed,
      data.timeElapsedSeconds
    );
  }
}