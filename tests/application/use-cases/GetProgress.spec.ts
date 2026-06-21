import { GetProgress } from '../../../src/application/use-cases/GetProgess';
import { type IProgressRepository } from '../../../src/domain/repositories/IProgressRepository';
import type { LevelProgressDTO } from '../../../src/infrastructure/shared/contracts/ProgressDTO';
import { ProgressNotFoundError } from '../../../src/domain/exceptions/ProgressExceptions';

describe('GetProgress Use Case', () => {
  let mockProgressRepository: jest.Mocked<IProgressRepository>;
  let useCase: GetProgress;

  const fakeProgress: LevelProgressDTO = {
    levelId: 'lvl_1',
    userId: 'user_123',
    score: 1000,
    movesUsed: 10,
    timeElapsedSeconds: 30,
    achievedAt: '2026-06-21T12:00:00.000Z'
  };

  beforeEach(() => {
    mockProgressRepository = {
      findByUserAndLevel: jest.fn(),
      findAllByUser: jest.fn(),
      save: jest.fn(),
    };
    useCase = new GetProgress(mockProgressRepository);
  });

  it('should_return_all_progress_for_a_specific_user', async () => {
    // Arrange
    mockProgressRepository.findAllByUser.mockResolvedValue([fakeProgress]);

    // Act
    const result = await useCase.getAllByUser('user_123');

    // Assert
    expect(mockProgressRepository.findAllByUser).toHaveBeenCalledWith('user_123');
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('user_123');
  });

  it('should_return_progress_when_level_exists_for_user', async () => {
    // Arrange
    mockProgressRepository.findByUserAndLevel.mockResolvedValue(fakeProgress);

    // Act
    const result = await useCase.getByLevel('user_123', 'lvl_1');

    // Assert
    expect(result).toEqual(fakeProgress);
  });

  it('should_throw_ProgressNotFoundError_when_level_not_played', async () => {
    // Arrange
    mockProgressRepository.findByUserAndLevel.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.getByLevel('user_123', 'lvl_99')).rejects.toThrow(ProgressNotFoundError);
  });
});