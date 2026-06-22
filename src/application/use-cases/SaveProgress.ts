import { type IProgressRepository } from '../../domain/repositories/IProgressRepository';
import { type ILevelRepository } from '../../domain/repositories/ILevelRepository';
import { LevelRegistryError } from '../../domain/exceptions/ProgressExceptions';
import type { LevelProgressDTO } from '../../domain/shared/contracts/ProgressDTO';
import { SaveProgressCommand } from './SaveProgressCommand';

export interface SaveProgressResult {
  message: string;
  progress: LevelProgressDTO;
}

export class SaveProgress {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly levelRepository: ILevelRepository
  ) {}

  async execute(userId: string, rawPayload: unknown): Promise<SaveProgressResult> {
    // 1. Delegamos la validación estructural al comando
    const command = SaveProgressCommand.create(rawPayload);

    // 2. Validar existencia del nivel en el catálogo (Bloque 4)
    const levelExists = await this.levelRepository.findById(command.levelId);
    if (!levelExists) {
      throw new LevelRegistryError('LevelRegistryError: el nivel especificado no existe');
    }

    // 3. Construir el nuevo DTO garantizando el aislamiento del usuario (Bloque 3)
    const newProgress: LevelProgressDTO = {
      levelId: command.levelId,
      userId: userId,
      score: command.score,
      movesUsed: command.movesUsed,
      timeElapsedSeconds: command.timeElapsedSeconds,
      achievedAt: new Date().toISOString()
    };

    // 4. Lógica de High Score (Bloque 1)
    const existingProgress = await this.progressRepository.findByUserAndLevel(userId, command.levelId);

    if (!existingProgress) {
      await this.progressRepository.save(newProgress);
      return { message: 'Progreso guardado correctamente', progress: newProgress };
    }

    if (command.score > existingProgress.score) {
      await this.progressRepository.save(newProgress);
      return { message: 'Nuevo récord guardado', progress: newProgress };
    }

    return { message: 'Progreso registrado (no supera el récord actual)', progress: existingProgress };
  }
}