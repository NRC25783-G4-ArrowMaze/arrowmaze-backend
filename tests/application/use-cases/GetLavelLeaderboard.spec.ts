import { GetLevelLeaderboard } from '../../../src/application/use-cases/GetLevelLeaderboard';
import { type ILevelRepository } from '../../../src/domain/repositories/ILevelRepository';
import { type IProgressRepository } from '../../../src/domain/repositories/IProgressRepository';
import { type IAccountRepository } from '../../../src/domain/repositories/IAccountRepository';
import { LeaderboardValidationError } from '../../../src/domain/exceptions/LeaderboardExceptions';
import { LevelRegistryError } from '../../../src/domain/exceptions/ProgressExceptions';
import { Email } from '../../../src/domain/value-objects/Email';

describe('GetLevelLeaderboard Use Case', () => {
  let mockLevelRepo: jest.Mocked<ILevelRepository>;
  let mockProgressRepo: jest.Mocked<IProgressRepository>;
  let mockAccountRepo: jest.Mocked<IAccountRepository>;
  let useCase: GetLevelLeaderboard;

  beforeEach(() => {
    mockLevelRepo = { findById: jest.fn() } as any;
    mockProgressRepo = { findAllByLevel: jest.fn() } as any;
    mockAccountRepo = { findById: jest.fn() } as any;
    useCase = new GetLevelLeaderboard(mockLevelRepo, mockProgressRepo, mockAccountRepo);
  });

  it('should_throw_LevelRegistryError_if_level_does_not_exist', async () => {
    mockLevelRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost_lvl', 'user_1', 10))
      .rejects.toThrow(LevelRegistryError);
  });

  it('should_throw_LeaderboardValidationError_if_limit_is_invalid', async () => {
    await expect(useCase.execute('lvl_1', 'user_1', -5))
      .rejects.toThrow(LeaderboardValidationError);
  });

  it('should_return_empty_arrays_if_no_progress_exists', async () => {
    mockLevelRepo.findById.mockResolvedValue({ id: 'lvl_1' } as any);
    mockProgressRepo.findAllByLevel.mockResolvedValue([]);

    const result = await useCase.execute('lvl_1', 'user_1', 10);

    expect(result.topPlayers).toEqual([]);
    expect(result.currentRecord).toBeNull();
  });

  it('should_return_ranked_leaderboard_and_current_record_with_safe_aliases', async () => {
    // Arrange
    mockLevelRepo.findById.mockResolvedValue({ id: 'lvl_1' } as any);
    
    mockProgressRepo.findAllByLevel.mockResolvedValue([
      { userId: 'user_1', levelId: 'lvl_1', score: 100, movesUsed: 5, timeElapsedSeconds: 10, achievedAt: '2026-01-01' },
      { userId: 'user_2', levelId: 'lvl_1', score: 500, movesUsed: 5, timeElapsedSeconds: 10, achievedAt: '2026-01-01' }
    ]);

    // Mock de las cuentas usando el Value Object real para ejercitar getPublicAlias()
    mockAccountRepo.findById.mockImplementation(async (id: string) => {
      if (id === 'user_1') return { getId: () => 'user_1', getEmail: () => Email.create('santiago@test.com') } as any;
      if (id === 'user_2') return { getId: () => 'user_2', getEmail: () => Email.create('pro_gamer@test.com') } as any;
      return null;
    });

    // Act
    const result = await useCase.execute('lvl_1', 'user_1', 10); // currentUserId = user_1

    // Assert
    expect(result.topPlayers).toHaveLength(2);
    
    // Validamos el orden (user_2 tiene 500 puntos, debe ser Rank 1)
    expect(result.topPlayers[0].username).toBe('pro_gamer'); // Alias seguro
    expect(result.topPlayers[0].rank).toBe(1);
    
    expect(result.topPlayers[1].username).toBe('santiago'); // Alias seguro
    expect(result.topPlayers[1].rank).toBe(2);

    // Validamos el currentRecord (user_1)
    expect(result.currentRecord).not.toBeNull();
    expect(result.currentRecord?.username).toBe('santiago');
    expect(result.currentRecord?.rank).toBe(2);
  });
});