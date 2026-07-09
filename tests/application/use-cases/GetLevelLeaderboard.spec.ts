import { GetLevelLeaderboard } from '../../../src/application/use-cases/GetLevelLeaderboard.js';
import { type ILevelRepository } from '../../../src/domain/repositories/ILevelRepository.js';
import { type IProgressRepository } from '../../../src/domain/repositories/IProgressRepository.js';
import { type IAccountRepository } from '../../../src/domain/repositories/IAccountRepository.js';
import { LeaderboardValidationError } from '../../../src/domain/exceptions/LeaderboardExceptions.js';
import { LevelRegistryError } from '../../../src/domain/exceptions/ProgressExceptions.js';
import { CompetitiveRankingStrategy } from '../../../src/domain/services/CompetitiveRankingStrategy.js';
import { type IRankingStrategy } from '../../../src/domain/services/IRankingStrategy.js';
import { Email } from '../../../src/domain/value-objects/Email.js';

describe('GetLevelLeaderboard Use Case', () => {
  let mockLevelRepo: jest.Mocked<ILevelRepository>;
  let mockProgressRepo: jest.Mocked<IProgressRepository>;
  let mockAccountRepo: jest.Mocked<IAccountRepository>;
  let rankingStrategy: IRankingStrategy;
  let useCase: GetLevelLeaderboard;

  beforeEach(() => {
    mockLevelRepo = { findById: jest.fn() } as any;
    mockProgressRepo = { findAllByLevel: jest.fn() } as any;
    mockAccountRepo = { findById: jest.fn() } as any;
    rankingStrategy = new CompetitiveRankingStrategy();
    useCase = new GetLevelLeaderboard(mockLevelRepo, mockProgressRepo, mockAccountRepo, rankingStrategy);
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

  it('should_delegate_ranking_to_injected_strategy', async () => {
    // Arrange: estrategia falsa que asigna rank fijo sin ordenar (Strategy intercambiable)
    const fakeStrategy: IRankingStrategy = {
      sortAndRank: jest.fn((entries: any[]) => entries.map(e => ({ ...e, rank: 99 })))
    };
    const customUseCase = new GetLevelLeaderboard(mockLevelRepo, mockProgressRepo, mockAccountRepo, fakeStrategy);

    mockLevelRepo.findById.mockResolvedValue({ id: 'lvl_1' } as any);
    mockProgressRepo.findAllByLevel.mockResolvedValue([
      { userId: 'user_1', levelId: 'lvl_1', score: 100, movesUsed: 5, timeElapsedSeconds: 10, achievedAt: '2026-01-01' }
    ]);
    mockAccountRepo.findById.mockResolvedValue({ getId: () => 'user_1', getEmail: () => Email.create('santiago@test.com') } as any);

    // Act
    const result = await customUseCase.execute('lvl_1', 'user_1', 10);

    // Assert
    expect(fakeStrategy.sortAndRank).toHaveBeenCalledTimes(1);
    expect(result.topPlayers[0].rank).toBe(99);
  });
});