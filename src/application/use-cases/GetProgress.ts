import { type IProgressRepository } from '../../domain/repositories/IProgressRepository.js';
import type { LevelProgressDTO } from '../../domain/shared/contracts/ProgressDTO.js';
import { ProgressNotFoundError } from '../../domain/exceptions/ProgressExceptions.js';

export class GetProgress {
  constructor(private readonly progressRepository: IProgressRepository) {}

  async getAllByUser(userId: string): Promise<LevelProgressDTO[]> {
    return this.progressRepository.findAllByUser(userId);
  }

  async getByLevel(userId: string, levelId: string): Promise<LevelProgressDTO> {
    const progress = await this.progressRepository.findByUserAndLevel(userId, levelId);
    
    if (!progress) {
      throw new ProgressNotFoundError();
    }
    
    return progress;
  }
}