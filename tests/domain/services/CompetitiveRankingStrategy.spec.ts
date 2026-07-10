import { CompetitiveRankingStrategy } from '../../../src/domain/services/CompetitiveRankingStrategy.js';

describe('CompetitiveRankingStrategy', () => {
  const strategy = new CompetitiveRankingStrategy();

  it('should_sort_by_score_descending', () => {
    // Arrange
    const entries: any[] = [
      { username: 'B', score: 100, movesUsed: 10, timeElapsedSeconds: 30, achievedAt: '2026-01-02' },
      { username: 'A', score: 200, movesUsed: 10, timeElapsedSeconds: 30, achievedAt: '2026-01-02' }
    ];

    // Act
    const result = strategy.sortAndRank(entries);

    // Assert
    expect(result[0].username).toBe('A');
    expect(result[0].rank).toBe(1);
    expect(result[1].username).toBe('B');
    expect(result[1].rank).toBe(2);
  });

  it('should_resolve_score_ties_by_moves_ascending', () => {
    // Arrange
    const entries: any[] = [
      { username: 'B', score: 200, movesUsed: 15, timeElapsedSeconds: 30, achievedAt: '2026-01-02' },
      { username: 'A', score: 200, movesUsed: 10, timeElapsedSeconds: 30, achievedAt: '2026-01-02' }
    ];

    // Act
    const result = strategy.sortAndRank(entries);

    // Assert
    expect(result[0].username).toBe('A'); // Menos movimientos gana
  });

  it('should_resolve_moves_ties_by_time_ascending', () => {
    // Arrange
    const entries: any[] = [
      { username: 'B', score: 200, movesUsed: 10, timeElapsedSeconds: 45, achievedAt: '2026-01-02' },
      { username: 'A', score: 200, movesUsed: 10, timeElapsedSeconds: 30, achievedAt: '2026-01-02' }
    ];

    // Act
    const result = strategy.sortAndRank(entries);

    // Assert
    expect(result[0].username).toBe('A'); // Menos tiempo gana
  });

  it('should_resolve_absolute_ties_by_oldest_date', () => {
    // Arrange
    const entries: any[] = [
      { username: 'Newer', score: 200, movesUsed: 10, timeElapsedSeconds: 30, achievedAt: '2026-06-20T10:00:00Z' },
      { username: 'Older', score: 200, movesUsed: 10, timeElapsedSeconds: 30, achievedAt: '2026-06-19T10:00:00Z' }
    ];

    // Act
    const result = strategy.sortAndRank(entries);

    // Assert
    expect(result[0].username).toBe('Older'); // El primero en lograrlo gana
  });
});
