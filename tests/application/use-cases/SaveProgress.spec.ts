import { SaveProgress } from '../../../src/application/use-cases/SaveProgress';
import { type IProgressRepository } from '../../../src/domain/repositories/IProgressRepository';
import { type ILevelRepository } from '../../../src/domain/repositories/ILevelRepository';
import { ProgressValidationError, LevelRegistryError } from '../../../src/domain/exceptions/ProgressExceptions';
import type { LevelProgressDTO, SaveProgressPayloadDTO } from '../../../src/domain/contracts/ProgressDTO';

describe('SaveProgress Use Case', () => {
  let mockProgressRepository: jest.Mocked<IProgressRepository>;
  let mockLevelRepository: jest.Mocked<ILevelRepository>;
  let useCase: SaveProgress;

  const validPayload: SaveProgressPayloadDTO = {
    levelId: 'lvl_1',
    score: 1500,
    movesUsed: 12,
    timeElapsedSeconds: 45
  };

  const existingHighScore: LevelProgressDTO = {
    levelId: 'lvl_1',
    userId: 'user_A',
    score: 2000,
    movesUsed: 10,
    timeElapsedSeconds: 30,
    achievedAt: '2026-06-20T00:00:00.000Z'
  };

  beforeEach(() => {
    mockProgressRepository = { findByUserAndLevel: jest.fn(), findAllByUser: jest.fn(), save: jest.fn() };
    mockLevelRepository = { findById: jest.fn(), findAllMetadata: jest.fn(), findAll: jest.fn(), save: jest.fn(), update: jest.fn() };
    useCase = new SaveProgress(mockProgressRepository, mockLevelRepository);
  });

  it('should_throw_LevelRegistryError_if_level_does_not_exist', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute('user_A', validPayload)).rejects.toThrow(LevelRegistryError);
  });

  it('should_save_new_progress_when_no_history_exists', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue({ id: 'lvl_1' } as any);
    mockProgressRepository.findByUserAndLevel.mockResolvedValue(null);

    // Act
    const result = await useCase.execute('user_A', validPayload);

    // Assert
    expect(mockProgressRepository.save).toHaveBeenCalledTimes(1);
    expect(result.message).toBe('Progreso guardado correctamente');
    expect(result.progress.userId).toBe('user_A'); // Verificamos la inyección del inquilino
  });

  it('should_overwrite_progress_when_new_score_is_higher', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue({ id: 'lvl_1' } as any);
    mockProgressRepository.findByUserAndLevel.mockResolvedValue({ ...existingHighScore, score: 1000 }); // Récord viejo es 1000

    // Act
    const result = await useCase.execute('user_A', validPayload); // Nuevo es 1500

    // Assert
    expect(mockProgressRepository.save).toHaveBeenCalledTimes(1);
    expect(result.message).toBe('Nuevo récord guardado');
  });

  it('should_not_overwrite_progress_when_new_score_is_lower', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue({ id: 'lvl_1' } as any);
    mockProgressRepository.findByUserAndLevel.mockResolvedValue(existingHighScore); // Récord viejo es 2000

    // Act
    const result = await useCase.execute('user_A', validPayload); // Nuevo es 1500

    // Assert
    expect(mockProgressRepository.save).not.toHaveBeenCalled();
    expect(result.message).toBe('Progreso registrado (no supera el récord actual)');
  });

  it('should_throw_ProgressValidationError_on_invalid_payload', async () => {
    // Arrange
    const invalidPayload = { ...validPayload, movesUsed: -5 };

    // Act & Assert
    await expect(useCase.execute('user_A', invalidPayload)).rejects.toThrow(ProgressValidationError);
    await expect(useCase.execute('user_A', invalidPayload)).rejects.toThrow('movesUsed must be a positive integer');
  });
});