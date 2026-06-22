import { type ILevelRepository, type LevelMetadata } from '../../domain/repositories/ILevelRepository';
import { LevelNotFoundError } from '../../domain/exceptions/LevelExceptions';
import type { LevelDataDTO } from '../../domain/shared/contracts/LevelDataDTOs';

export class GetLevels {
  constructor(private readonly levelRepository: ILevelRepository) {}

  async getCatalog(difficulty?: unknown): Promise<LevelMetadata[]> {
    // Si la dificultad viene en el query string, la pasamos como string de forma segura
    const diffFilter = typeof difficulty === 'string' ? difficulty : undefined;
    return this.levelRepository.findAllMetadata(diffFilter);
  }

  async getById(id: string): Promise<LevelDataDTO> {
    const level = await this.levelRepository.findById(id);
    if (!level) {
      throw new LevelNotFoundError();
    }
    return level;
  }

  async getBulk(): Promise<LevelDataDTO[]> {
    return this.levelRepository.findAll();
  }
}